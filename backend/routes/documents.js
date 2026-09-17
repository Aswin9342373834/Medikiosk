const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const MedicalDocument = require('../models/MedicalDocument');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');
const { upload, ocrService } = require('../services/ocrService');
const ollamaService = require('../services/ollamaService');
const { authenticateUser, requireRole, createAuditLog } = require('../middleware/auth');

// Upload document (Patient or Kiosk)
router.post('/upload', authenticateUser, requireRole(['PATIENT']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId = req.user.id;
    let patient = await Patient.findOne({ userId });
    if (!patient) {
      patient = await Patient.create({
        userId,
        name: 'Patient',
        abhaId: `ABHA-${Date.now().toString().slice(-6)}`
      });
    }

    // Default visibility is PRIVATE (Secure by default until physician review)
    const document = await MedicalDocument.create({
      patientId: patient._id,
      userId,
      filename: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      storagePath: req.file.path,
      documentType: req.body.documentType || 'Other',
      visibility: 'Private',
      reviewStatus: 'Pending',
      ocrStatus: 'Processing',
      aiStatus: 'Processing'
    });

    await createAuditLog(userId, 'PATIENT', 'DOCUMENT_UPLOADED', 'MedicalDocument', document._id);

    // Asynchronous OCR & Medical Entity Extraction Pipeline
    (async () => {
      try {
        const ocrResult = await ocrService.extractTextFromDocument(req.file.path, req.file.mimetype);
        document.ocrText = ocrResult.text || '';
        document.ocrProvider = ocrResult.provider || 'Development OCR mode';
        document.ocrStatus = ocrResult.status === 'Completed' ? 'Completed' : (ocrResult.status || 'Completed');

        // AI Medical Entity Extraction
        if (document.ocrText && document.ocrText.trim().length > 0) {
          const extracted = await ollamaService.analyzeExtractedDocument(document.ocrText);
          document.extractedData = extracted;
          document.aiStatus = 'Completed';
        } else {
          document.aiStatus = 'Skipped';
        }

        await document.save();

        const io = req.app.get('io');
        if (io) {
          io.emit('new-document', {
            documentId: document._id,
            patientId: patient._id,
            filename: document.filename,
            documentType: document.documentType
          });
          io.emit('document-review-required', {
            documentId: document._id,
            patientName: patient.name,
            patientId: patient._id
          });
        }
      } catch (pipelineErr) {
        console.error('Document OCR/AI processing error:', pipelineErr);
        document.ocrStatus = 'Failed';
        document.aiStatus = 'Failed';
        await document.save();
      }
    })();

    res.status(201).json({
      success: true,
      message: 'Medical document uploaded securely and queued for physician review.',
      data: document
    });
  } catch (error) {
    console.error('Document upload route error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get patient's released documents (For logged-in patient)
router.get('/my-documents', authenticateUser, requireRole(['PATIENT']), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });

    // STRICT PRIVACY: ONLY return documents where visibility is 'Released'
    const documents = await MedicalDocument.find({
      patientId: patient._id,
      visibility: 'Released'
    }).sort({ uploadedAt: -1 });

    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all documents for a patient (Doctors & Admins get both Private & Released; Patients get ONLY Released)
router.get('/patient/:patientId', authenticateUser, async (req, res) => {
  try {
    const { patientId } = req.params;

    if (req.user.role === 'PATIENT') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient || patient._id.toString() !== patientId) {
        await createAuditLog(req.user.id, 'PATIENT', 'ACCESS_DENIED', 'MedicalDocument', null, 'Failure', 'Attempted to view other patient documents');
        return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own records' });
      }

      // Return ONLY released documents for patients
      const releasedDocs = await MedicalDocument.find({ patientId, visibility: 'Released' }).sort({ uploadedAt: -1 });
      return res.json({ success: true, data: releasedDocs });
    }

    // Doctors and Admins can view all documents
    const allDocs = await MedicalDocument.find({ patientId }).sort({ uploadedAt: -1 });
    res.json({ success: true, data: allDocs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Download / View single document (BACKEND AUTHORIZATION ENFORCED)
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const doc = await MedicalDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    if (req.user.role === 'PATIENT') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient || doc.patientId.toString() !== patient._id.toString()) {
        await createAuditLog(req.user.id, 'PATIENT', 'ACCESS_DENIED', 'MedicalDocument', doc._id, 'Failure', 'Cross-patient document access denied');
        return res.status(403).json({ success: false, message: 'Forbidden: Access denied to other patient documents' });
      }

      // CRITICAL: Check document visibility
      if (doc.visibility !== 'Released') {
        await createAuditLog(req.user.id, 'PATIENT', 'ACCESS_DENIED', 'MedicalDocument', doc._id, 'Failure', 'Attempted to access Private document');
        return res.status(403).json({ 
          success: false, 
          message: 'Access Denied: This medical report is pending doctor review and has not been released.' 
        });
      }
    }

    if (req.user.role === 'DOCTOR') {
      await createAuditLog(req.user.id, 'DOCTOR', 'DOCTOR_VIEWED_DOCUMENT', 'MedicalDocument', doc._id);
    }

    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Download raw file stream with RBAC
router.get('/:id/file', authenticateUser, async (req, res) => {
  try {
    const doc = await MedicalDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    if (req.user.role === 'PATIENT') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient || doc.patientId.toString() !== patient._id.toString() || doc.visibility !== 'Released') {
        return res.status(403).json({ success: false, message: 'Access Denied' });
      }
    }

    const resolvedPath = path.resolve(doc.storagePath);
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ success: false, message: 'Physical file not found on server' });
    }

    res.sendFile(resolvedPath);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Doctor Document Visibility Decision: 'Released' vs 'Private'
router.patch('/:id/visibility', authenticateUser, requireRole(['DOCTOR']), async (req, res) => {
  try {
    const { visibility } = req.body; // 'Released' or 'Private'
    if (!['Released', 'Private'].includes(visibility)) {
      return res.status(400).json({ success: false, message: 'Visibility must be either "Released" or "Private"' });
    }

    const doc = await MedicalDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    doc.visibility = visibility;
    doc.reviewedBy = req.user.id;
    doc.reviewedAt = new Date();
    doc.reviewStatus = 'Reviewed';
    await doc.save();

    const action = visibility === 'Released' ? 'DOCUMENT_RELEASED' : 'DOCUMENT_MARKED_PRIVATE';
    await createAuditLog(req.user.id, 'DOCTOR', action, 'MedicalDocument', doc._id, 'Success', `Doctor set document visibility to ${visibility}`);

    // Real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('report-released', {
        patientId: doc.patientId,
        documentId: doc._id,
        filename: doc.filename,
        visibility: doc.visibility
      });
    }

    if (visibility === 'Released') {
      const patient = await Patient.findById(doc.patientId);
      if (patient) {
        await Notification.create({
          userId: patient.userId,
          recipientRole: 'PATIENT',
          title: 'Medical Report Released',
          message: `Your report "${doc.filename}" has been reviewed and authorized by the physician.`,
          type: 'Info',
          actionUrl: '/patient/records'
        });
      }
    }

    res.json({
      success: true,
      message: `Document has been marked as ${visibility}.`,
      data: doc
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
