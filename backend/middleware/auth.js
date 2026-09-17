const jwt = require('jsonwebtoken');
const AuditLog = require('../models/AuditLog');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'medikiosk_super_secret_jwt_key_2026';

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }
};

const requireRole = (roles = []) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      // Log access denial for security audit
      try {
        await AuditLog.create({
          userId: req.user.id,
          role: req.user.role,
          action: 'ACCESS_DENIED',
          resource: req.originalUrl,
          result: 'Failure',
          details: `Role ${req.user.role} attempted to access restricted endpoint requiring [${roles.join(', ')}]`
        });
      } catch (e) {
        console.warn('Audit log write error:', e.message);
      }

      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: Access requires one of [${roles.join(', ')}] roles.` 
      });
    }

    next();
  };
};

const createAuditLog = async (userId, role, action, resource, resourceId, result = 'Success', details = '') => {
  try {
    await AuditLog.create({
      userId,
      role,
      action,
      resource,
      resourceId,
      result,
      details
    });
  } catch (err) {
    console.error('AuditLog Error:', err.message);
  }
};

module.exports = {
  JWT_SECRET,
  authenticateUser,
  requireRole,
  createAuditLog
};
