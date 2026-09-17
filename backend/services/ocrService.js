const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|pdf/i;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /image\/(jpeg|jpg|png)|application\/pdf/.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Image files (JPG, PNG) are permitted.'));
    }
  }
});

/**
 * OCR Provider Abstraction Interface
 */
class OCRProvider {
  async extract(filePath, mimeType) {
    throw new Error('extract() must be implemented by provider');
  }
}

class TesseractLocalProvider extends OCRProvider {
  constructor() {
    super();
    this.name = 'Tesseract.js Local Engine';
  }

  async extract(filePath, mimeType) {
    try {
      const Tesseract = require('tesseract.js');
      console.log('Running Tesseract OCR on ' + filePath + '...');
      const result = await Tesseract.recognize(filePath, 'eng', {
        logger: m => {}
      });
      return {
        text: result.data?.text || '',
        confidence: result.data?.confidence || 0,
        provider: this.name,
        status: 'Completed'
      };
    } catch (e) {
      console.warn('Tesseract OCR engine not available or failed:', e.message);
      return null;
    }
  }
}

class PdfParseProvider extends OCRProvider {
  constructor() {
    super();
    this.name = 'PDF Text Stream Parser';
  }

  async extract(filePath, mimeType) {
    if (!filePath.toLowerCase().endsWith('.pdf') && mimeType !== 'application/pdf') {
      return null;
    }
    try {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return {
        text: data.text || '',
        provider: this.name,
        status: 'Completed'
      };
    } catch (e) {
      console.warn('PDF parser not available or failed:', e.message);
      return null;
    }
  }
}

class DevelopmentFallbackProvider extends OCRProvider {
  constructor() {
    super();
    this.name = 'Development OCR mode';
  }

  async extract(filePath, mimeType) {
    return {
      text: '',
      provider: this.name,
      status: 'OCR provider not configured',
      message: 'OCR provider not configured. Please configure Tesseract, Google Vision, or AWS Textract for production handwritten/printed document extraction.'
    };
  }
}

const providers = [
  new PdfParseProvider(),
  new TesseractLocalProvider(),
  new DevelopmentFallbackProvider()
];

const ocrService = {
  async extractTextFromDocument(filePath, mimeType = '') {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found at path: ' + filePath);
    }

    for (const provider of providers) {
      try {
        const result = await provider.extract(filePath, mimeType);
        if (result && (result.text?.trim().length > 0 || result.status === 'OCR provider not configured')) {
          return result;
        }
      } catch (err) {
        console.warn('Provider ' + provider.name + ' failed: ' + err.message);
      }
    }

    return {
      text: '',
      provider: 'Development OCR mode',
      status: 'OCR provider not configured'
    };
  }
};

module.exports = {
  upload,
  ocrService
};
