# MediKiosk

AI Clinical History & Medical Document Intake Platform

> **Target Environment**: High-Volume Government Hospital Outpatient Departments (OPDs), District Hospitals, Medical Colleges, and Community Health Centers.

MediKiosk is an AI-assisted clinical intake and medical document processing platform engineered to eliminate intake bottlenecks in public healthcare facilities. It automates patient registration, captures structured multilingual clinical history, digitizes medical documents with doctor-supervised privacy, and delivers synthesized clinical summaries to physicians before consultations begin.

---

## 1. Project Overview

MediKiosk modernizes outpatient intake across public healthcare institutions in India. Designed for touch kiosks and mobile web access, it enables patients to self-register, select clinical departments, provide structured symptom timelines through voice and touch chips, and upload outside diagnostic files. In the consultation room, physicians receive prioritized triage queues, extracted lab records, and standardized clinical intake summaries, allowing them to focus entirely on diagnosis and patient care.

---

## 2. Problem Statement

In public tertiary hospitals and government medical colleges across India, physicians routinely examine **300 to 800 outpatient cases per day**, averaging **2 to 5 minutes per patient**. Critical consultation time is lost to repetitive non-clinical friction:
- Manually writing basic demographic data and repetitive chief complaints into paper OPD registers.
- Deciphering and transcribing unorganized paper lab reports, old prescription slips, and discharge summaries brought by patients.
- Multilingual barriers between patients and clinical staff leading to incomplete symptom histories.
- Absence of real-time acuity triage in standard waiting queues, delaying care for unstable patients.

MediKiosk resolves these operational challenges by moving intake upstream into a patient self-service workflow with strict physician oversight.

---

## 3. Key Features

- **Multilingual Support**: Fully localized user interface and conversational clinical questionnaires in **English**, **Tamil (தமிழ்)**, and **Hindi (हिन्दी)**.
- **Authoritative Department Clinical Mode**: Backend-enforced mode allocation (`MEDICAL` for Allopathy departments, `AYUSH` for Traditional Medicine) with anti-spoofing protection.
- **Conversational Voice & Touch Intake**: Dual-modality clinical questionnaire combining browser voice transcription with high-contrast symptom chips.
- **Doctor-Controlled Document Privacy**: All patient-uploaded records default to `Private`. Files are only released to the patient portal after explicit physician verification.
- **Side-by-Side OCR Verification**: Physicians inspect original document images side-by-side with extracted lab values and reference ranges, preserving physical file immutability.
- **Acuity-Based Triage Queue**: Real-time triage ordering that automatically prioritizes emergency red-flag cases to the top of the consultation queue.
- **FHIR R4 Standardization**: Generates NRCES/ABDM-compliant `OPConsultRecord` Document Bundles ready for digital health exchange.
- **Zero-Trace Kiosk Security**: Automatic 90-second inactivity timer with a 15-second visual countdown modal, purging session memory and uploaded document cache.

---

## 4. Patient Workflow

```
1. Language Selection (English / தமிழ் / हिन्दी)
   ↓
2. Patient Registration / ABHA Scan (Name, Mobile, Password, Optional ABHA ID)
   ↓
3. OPD Department Selection (General Medicine, Cardiology, Pediatrics, Orthopedics, Ayurveda, Siddha, Unani)
   ↓
4. Conversational Clinical Intake (Chief complaints, duration, severity, timeline, past history)
   ↓
5. Medical Document Upload (Lab reports, diagnostic imaging, prior prescriptions)
   ↓
6. OPD Token Generation (Assigned TKN-XXX, OP Number, estimated wait time)
   ↓
7. Consultation & Treatment (Physician consultation, prescription issuance, record release)
```

---

## 5. AI Features

- **Local LLM Synthesis**: Integration with local Ollama service (`deepseek-r1:8b`) to synthesize patient symptom narratives into structured clinical summaries.
- **Deterministic Rule-Based Fallback**: If local Ollama is offline or unavailable, the system automatically uses a deterministic clinical structuring engine to guarantee zero intake disruption.
- **Physician Accountability Guardrail**: Every AI summary is prominently watermarked with:
  > **"AI-Assisted Clinical Summary — Requires Doctor Review"**
  Ensuring clinical decisions are exclusively made by licensed medical practitioners.

---

## 6. Medical Document OCR

- **Dual-Engine Extraction**: Employs `tesseract.js` (WebAssembly OCR) for printed diagnostic scans and `pdf-parse` for digital laboratory PDF reports.
- **Standardized Processing Lifecycle**: Every uploaded document transitions through formal statuses: `Processing`, `Successfully extracted`, `Low-confidence extraction`, `OCR unavailable`, or `OCR failed`.
- **Entity Extraction**: Automatically isolates `testName`, `value`, `unit`, `referenceRange`, and `impression`.
- **Tamper-Evident Immutability**: The physical file stored on disk is never altered. Edits made by doctors during verification update metadata records while the original file retains its cryptographic SHA-256 integrity.

---

## 7. Clinical History Generation

- Captures chief complaints, symptom onset, timeline progression, aggravating and relieving factors, current medications, drug allergies, and past surgical history.
- Transforms unstructured conversational input into standardized clinical sections:
  - **History of Present Illness (HPI)**
  - **Review of Systems (ROS)**
  - **Past Medical & Surgical History**
  - **Allergies & Current Medications**
  - **Pain Severity Scale (1–10 Numeric Rating Scale)**

---

## 8. Red Flag Detection

- Scans clinical input in real-time for high-acuity keywords and symptom combinations:
  - **Cardiovascular**: Severe retrosternal chest pain, radiating left arm pain, syncope.
  - **Respiratory**: Acute respiratory distress, stridor, cyanosis.
  - **Neurological**: Sudden unilateral weakness, facial droop, acute altered sensorium.
  - **Trauma & Sepsis**: Uncontrolled hemorrhage, high fever with severe altered mental state.
- **Immediate Action**: Automatically flags the patient visit as **`URGENT`**, elevates their token to the top of the physician's queue, and displays an emergency alert banner on the kiosk terminal.

---

## 9. AYUSH Mode

For departments categorized under traditional Indian medicine (**Ayurveda**, **Siddha**, and **Unani**), MediKiosk automatically switches clinical questionnaires to authoritative AYUSH parameters:
- **Dashavidha Pariksha**: 10-fold clinical diagnostic framework.
- **Prakriti & Vikriti Evaluation**: Baseline constitutional analysis vs. current doshic imbalance (Vata, Pitta, Kapha).
- **Agni Assessment**: Digestive and metabolic status (Manda, Tikshna, Vishama, Sama).
- **Koshtha Assessment**: Gastrointestinal and bowel habit profiling.

---

## 10. Patient Portal

- **URL**: `/patient`
- **Features**:
  - Live OPD visit tracking and queue position.
  - Department and Clinical Mode display.
  - Secure medical records vault with 10 clinical data tabs.
  - Diagnostic document uploads with private default visibility.
  - One-click NRCES/ABDM FHIR R4 Bundle export.
  - Digital consent management and history.

---

## 11. Doctor Cockpit

- **URL**: `/doctor`
- **Features**:
  - Acuity-prioritized OPD queue (`URGENT / RED FLAG` → `PRIORITY` → `NORMAL`).
  - Synthesized patient intake summary with clinical review disclaimer.
  - Side-by-side document inspection with editable lab entity verification.
  - Explicit `"Release to Patient"` visibility control toggle.
  - Multi-item prescription builder with dosage, frequency (e.g., 1-0-1), and follow-up date.
  - Consultation completion and automated queue advancement.

---

## 12. Hospital Admin

- **URL**: `/admin`
- **Features**:
  - Real-time hospital operational metrics (total registrations, active queue, emergency cases, online doctors).
  - Department and room allocation management.
  - Kiosk terminal connectivity and heartbeat monitoring.
  - Immutable regulatory audit log tracking security events, logins, and document visibility changes.

---

## 13. Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express.js (REST API), Socket.IO (Real-time live queue).
- **Database**: MongoDB with Mongoose ODM.
- **Authentication**: Stateless JSON Web Tokens (JWT) with bcrypt password hashing.
- **AI & OCR**: Ollama (`deepseek-r1:8b`), `tesseract.js`, `pdf-parse`.
- **Health Standards**: HL7 FHIR R4, NRCES/ABDM OPConsultRecord specification.

---

## 14. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   CLIENT APPLICATIONS                    │
│   Kiosk Terminal       Patient Portal     Doctor Cockpit │
│   (/kiosk)             (/patient)         (/doctor)      │
└────────────────────────────┬─────────────────────────────┘
                             │ HTTPS / WSS / REST
                             ▼
┌──────────────────────────────────────────────────────────┐
│                   EXPRESS REST BACKEND                   │
│   Routes: /auth, /opd, /clinical-history, /documents     │
│   Middleware: JWT Auth, RBAC, AuditLog, CORS             │
│   Real-time: Socket.IO Queue Synchronization             │
└──────────────┬─────────────────────────────┬─────────────┘
               │                             │
               ▼                             ▼
┌──────────────────────────┐   ┌───────────────────────────┐
│     MONGODB DATABASE     │   │   LOCAL AI & OCR ENGINE   │
│   Users, Patients,       │   │   Ollama (DeepSeek-R1)    │
│   OpdVisits, Documents,  │   │   Tesseract.js OCR        │
│   Prescriptions, Audits  │   │   PDF Text Stream Parser  │
└──────────────────────────┘   └───────────────────────────┘
```

---

## 15. Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Server (v6.0 or higher) running locally on port 27017 or a cloud MongoDB URI
- (Optional) [Ollama](https://ollama.ai/) with `deepseek-r1:8b` model for local AI structuring

### Step 1: Clone the Repository
```bash
git clone https://github.com/Aswin9342373834/Medikiosk.git
cd Medikiosk
```

### Step 2: Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

---

## 16. Environment Variables

### Backend Configuration (`backend/.env`)
Create `backend/.env` using the template `backend/.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/medikiosk
JWT_SECRET=your_secure_jwt_secret_key_here
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-r1:8b
CLIENT_URL=http://localhost:3000
```

### Frontend Configuration (`frontend/.env.local`)
Create `frontend/.env.local` using the template `frontend/.env.example`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 17. Running Frontend

```bash
cd frontend
npm run dev
```
The frontend application will be available at `http://localhost:3000`.

---

## 18. Running Backend

```bash
cd backend
# Seed initial demo accounts and canonical departments
npm run seed

# Start the server
npm start
```
The backend server will listen on `http://localhost:5000`. Verify health at `http://localhost:5000/api/health`.

---

## 19. Demo Accounts

The following demo accounts are available in development:

| Role | Email Address | Password | Landing Page |
|---|---|---|---|
| **Patient** | `patient@hospital.gov.in` | `Password123!` | `/patient` |
| **Doctor** | `doctor@hospital.gov.in` | `Password123!` | `/doctor` |
| **Hospital Admin** | `admin@hospital.gov.in` | `Password123!` | `/admin` |

*Note: One-Click Demo Access buttons are also provided directly on the `/login` page.*

---

## 20. Testing

### Run Backend Automated Tests (73/73 PASS)
```bash
cd backend
npm test
```
Validates authentication, registration, RBAC, clinicalMode enforcement, OPD state machine, document privacy, side-by-side OCR verification, and multilingual dictionaries.

### Run Frontend Typecheck and Lint
```bash
cd frontend
npx tsc --noEmit
npm run lint
```

### Run Frontend Production Build
```bash
cd frontend
npm run build
```

---

## 21. Deployment

### Frontend (Vercel)
1. Import the repository into the Vercel Dashboard.
2. Set the Root Directory to `frontend`.
3. In **Settings** → **Environment Variables**, configure:
   - `NEXT_PUBLIC_API_URL`: `https://<your-deployed-backend-domain>`
   - `NEXT_PUBLIC_SOCKET_URL`: `https://<your-deployed-backend-domain>`
4. Deploy the application.

### Backend (Cloud Platforms)
1. Deploy `backend/` to any Node.js hosting platform (Render, Railway, AWS ECS, GCP Cloud Run).
2. Set the production environment variables:
   - `PORT=5000`
   - `MONGODB_URI=<your-production-mongodb-connection-string>`
   - `JWT_SECRET=<your-production-jwt-secret>`
   - `CLIENT_URL=https://medikiosk-nn87.vercel.app`

---

## 22. Security & Privacy

- **No Plaintext Passwords**: All user passwords are encrypted using `bcrypt.hash` with salt rounds = 10.
- **Document Privacy by Default**: Uploaded diagnostic reports remain `Private` and unreachable by patients until verified and released by a consulting doctor.
- **Direct Access Prevention**: Static serving of `/uploads` is disabled; all file requests require authenticated token authorization.
- **Role-Based Access Control**: Strict middleware guards enforce patient, doctor, and admin privileges at both API and UI route levels.
- **Immutable Audit Trail**: Sensitive operations (logins, registrations, status transitions, document releases) generate immutable `AuditLog` records in MongoDB.
- **Zero Inactive Traces**: Kiosk terminals purge session data and browser storage after 90 seconds of inactivity.

---

## 23. Project Limitations

- **Local AI Dependencies**: LLM narrative synthesis requires an active Ollama instance; deterministic fallback rules activate if Ollama is unreachable.
- **Complex Cursive Handwriting**: The local OCR engine handles printed reports and standard digital lab outputs; highly cursive handwritten doctor notes require specialized cloud vision models.
- **ABDM Sandbox Credentials**: Live ABDM M1/M2/M3 transactions require official National Health Authority (NHA) gateway credentials and active client certificates.

---

## 24. Future Enhancements

- **National Health Stack ABDM Integration**: Direct connection to live ABDM M1/M2/M3 sandbox APIs for instant ABHA creation and HIP/HIU record linking.
- **Server-Side Bhashini Voice Pipeline**: Integration with India's Bhashini AI platform for high-accuracy regional Indian dialect acoustic processing.
- **Hardware Kiosk Peripherals**: Integration with thermal token printers, barcode/QR scanners, and physical digital signature USB PKI tokens.
- **Clinical Terminology Codification**: Real-time SNOMED CT and WHO ICD-10 diagnostic coding assistance for physicians.

---

## License & Compliance

Developed for Indian Public Healthcare and Government Hospital OPD workflow modernization. Complies with NRCES/ABDM FHIR R4 profile specifications.
