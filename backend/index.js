const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const adminRoutes = require('./routes/admin');
const clinicalHistoryRoutes = require('./routes/clinicalHistory');
const documentRoutes = require('./routes/documents');
const investigationRoutes = require('./routes/investigations');
const prescriptionRoutes = require('./routes/prescriptions');
const consultationRoutes = require('./routes/consultations');
const notificationRoutes = require('./routes/notifications');
const aiRoutes = require('./routes/ai');
const departmentRoutes = require('./routes/departments');
const opdRoutes = require('./routes/opd');
const consentRoutes = require('./routes/consent');
const pharmacyRoutes = require('./routes/pharmacies');

const app = express();

// Allowed Origins for CORS
const envOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(url => url.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'https://medikiosk-nn87.vercel.app',
  'https://medikiosk-mauve-tau.vercel.app',
  ...envOrigins
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    // Allow any localhost / 127.0.0.1 port in local development
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // Allow Vercel preview and production deployments
    if (/^https:\/\/([a-zA-Z0-9-_]+\.)?vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'Access-Control-Request-Private-Network'
  ],
  optionsSuccessStatus: 200
};

// Handle Chromium Private Network Access (PNA) preflights
app.use((req, res, next) => {
  if (req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Direct static uploads protected - require authorization via /api/documents/:id/file
app.use('/uploads', (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Direct file access is disabled. Use authorized endpoint /api/documents/:id/file'
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

// Attach Socket.IO to express app
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  
  socket.on('join-patient-room', (patientId) => {
    socket.join(`patient-${patientId}`);
  });

  socket.on('join-doctor-room', (doctorId) => {
    socket.join(`doctor-${doctorId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Database Connection
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clinical-history', clinicalHistoryRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/investigations', investigationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/opd', opdRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/pharmacies', pharmacyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'Healthy',
    timestamp: new Date().toISOString(),
    service: 'MediKiosk Clinical Intake Backend'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[MediKiosk] Server listening on port ${PORT}`);
  });
}

module.exports = { app, server };
