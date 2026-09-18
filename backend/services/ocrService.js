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

function isValidImageBuffer(buffer) {
  if (!buffer || buffer.length < 4) return false;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
  // BMP: 42 4D
  if (buffer[0] === 0x42 && buffer[1] === 0x4D) return true;
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return true;
  return false;
}

function isValidPdfBuffer(buffer) {
  if (!buffer || buffer.length < 5) return false;
  return buffer.slice(0, 4).toString() === '%PDF';
}

class TesseractLocalProvider extends OCRProvider {
  constructor() {
    super();
    this.name = 'Tesseract.js Local Engine';
  }

  async extract(filePath, mimeType) {
    const isImage = /image\/(jpeg|jpg|png)/i.test(mimeType) || /\.(jpe?g|png)$/i.test(filePath);
    if (!isImage) return null;

    try {
      if (!fs.existsSync(filePath)) {
        return { text: '', confidence: 0, provider: this.name, status: 'OCR failed', error: 'File not found' };
      }

      const fileBuffer = fs.readFileSync(filePath);
      if (!isValidImageBuffer(fileBuffer)) {
        // Not a valid image file binary; gracefully return Low-confidence extraction without crashing worker
        return {
          text: '',
          confidence: 0,
          provider: this.name,
          status: 'Low-confidence extraction',
          error: 'File does not contain valid image binary stream'
        };
      }

      const Tesseract = require('tesseract.js');
      const langPath = path.join(__dirname, '..');

      const ocrPromise = Tesseract.recognize(filePath, 'eng', {
        langPath: langPath,
        logger: () => {}
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tesseract OCR execution timed out')), 8000)
      );

      const result = await Promise.race([ocrPromise, timeoutPromise]);
      const text = result.data?.text?.trim() || '';
      const confidence = Math.round(result.data?.confidence || 0);
      const status = text.length > 0
        ? (confidence >= 60 ? 'Successfully extracted' : 'Low-confidence extraction')
        : 'Low-confidence extraction';

      return {
        text,
        confidence,
        provider: this.name,
        status
      };
    } catch (e) {
      console.warn('Tesseract OCR engine failed:', e.message);
      return {
        text: '',
        confidence: 0,
        provider: this.name,
        status: 'OCR failed',
        error: e.message
      };
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
      if (!fs.existsSync(filePath)) {
        return { text: '', confidence: 0, provider: this.name, status: 'OCR failed', error: 'File not found' };
      }

      const dataBuffer = fs.readFileSync(filePath);
      if (!isValidPdfBuffer(dataBuffer)) {
        return {
          text: '',
          confidence: 0,
          provider: this.name,
          status: 'Low-confidence extraction',
          error: 'File does not contain valid PDF binary header'
        };
      }

      const pdfParseModule = require('pdf-parse');
      let text = '';

      if (typeof pdfParseModule === 'function') {
        const data = await pdfParseModule(dataBuffer);
        text = data.text?.trim() || '';
      } else if (pdfParseModule && typeof pdfParseModule.PDFParse === 'function') {
        const parser = new pdfParseModule.PDFParse({ data: dataBuffer });
        await parser.load();
        const textResult = await parser.getText();
        text = (typeof textResult === 'string' ? textResult : (textResult?.text || '')).trim();
        await parser.destroy();
      }

      return {
        text,
        confidence: text.length > 0 ? 95 : 0,
        provider: this.name,
        status: text.length > 0 ? 'Successfully extracted' : 'Low-confidence extraction'
      };
    } catch (e) {
      console.warn('PDF parser not available or failed:', e.message);
      return {
        text: '',
        confidence: 0,
        provider: this.name,
        status: 'OCR failed'
      };
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
      confidence: 0,
      provider: this.name,
      status: 'OCR unavailable',
      message: 'OCR extraction engine is not available. Please review document manually.'
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
        if (result !== null && result !== undefined) {
          return result;
        }
      } catch (err) {
        console.warn('Provider ' + provider.name + ' failed: ' + err.message);
      }
    }

    return {
      text: '',
      provider: 'Development OCR mode',
      status: 'OCR unavailable'
    };
  }
};

module.exports = {
  upload,
  ocrService
};
