# MediKiosk
## AI-Assisted Clinical History & Medical Document Intake Platform
**Target:** Government Hospitals / High-Volume OPD

> **Project Classification**: **COMPLETE UPGRADED MEDIKIOSK PROTOTYPE / MVP with ABDM/FHIR-ready architecture**

MediKiosk is a production-grade prototype platform engineered specifically for high-volume Indian Government Hospital Outpatient Departments (OPDs). It streamlines patient registration, captures structured clinical history through conversational multilingual voice and touch input, manages medical document intake with doctor-controlled privacy, and equips physicians with synthesized clinical dossiers before consultations begin.

---

## ðŸ¥ Problem Statement & Objectives

### The Challenge in Public OPDs
In Indian tertiary government hospitals, medical colleges, and district civil hospitals, outpatient clinics frequently manage **300 to 800 patients per physician per day**. Doctors have an average of **2 to 5 minutes** per clinical consultation. A major portion of this limited time is lost to repetitive, non-clinical administrative friction:
- Eliciting basic chief complaints, symptom timeline, onset, duration, and pain severity manually.
- Sifting through unorganized physical paper records, old hospital prescription slips, and external diagnostic reports brought by patients.
- Manually writing repetitive demographic and clinical intake data into physical OPD registers.
- High multilingual diversity among patients, creating comprehension barriers for clinical history.

### Core Objectives
1. **Reduce Wait & Intake Overhead**: Accelerate clinical intake from 5 minutes down to <60 seconds of physician time through self-service kiosk terminals and patient portals.
2. **Standardized Clinical History Intake**: Capture structured complaints, duration, severity, past medical history, allergies, and authoritative AYUSH Dashavidha Pariksha parameters.
3. **Doctor-Controlled Medical Privacy**: Secure patient-uploaded diagnostic files with default `Private` visibility until clinically verified and released by the attending doctor.
4. **Physician Cockpit & Triage Prioritization**: Automatically detect clinical red flags (acute chest pain, respiratory distress, stroke signs) to prioritize urgent patients at the top of the queue.
5. **ABDM & FHIR R4 Standardization**: Produce valid NRCES/ABDM `OPConsultRecord` Document Bundles ready for Indian digital health exchange.
6. **Zero-Trace Kiosk Security**: Enforce a strict 90-second inactivity timeout with a 15-second countdown warning modal that purges all patient data from memory upon expiration.

### 1. Patient Experience
- **Authentication & Self-Registration**: Secure registration with ABHA ID, name, contact, and password.
- **OP Registration Flow**: 6-step wizard generating standard Government Hospital token numbers (`TKN-XXX`) and OP numbers (`OPD-2026-XXXXXX`) across specialties (General Medicine, Cardiology, Pediatrics, Orthopedics, AYUSH).
- **Conversational Intake**: Voice input and touch symptom chips (fever, cough, chest pain, trauma, etc.), duration, severity, and AYUSH dosha queries. Red-flag symptoms trigger immediate emergency triage banners.
- **Medical Documents**: Upload lab reports, diagnostic scans, and discharge summaries (stored privately by default).
- **Health Records**: 10-tab consolidated view of vitals, prescriptions, investigations, consultations, and immunizations.

### 2. Doctor Cockpit
- **Triage Queue**: Real-time queue prioritized by acuity (`Urgent / Red Flag` &rarr; `Priority` &rarr; `Normal`).
- **AI Summary Inspection**: Structured chief complaints, timeline, and vitals accompanied by an explicit `"REQUIRES DOCTOR REVIEW"` banner.
- **Doctor-Controlled Visibility**: Doctors inspect uploaded documents and explicitly click `"Make Visible to Patient"` to release them.
- **Prescription Builder**: Multi-item drug regimens (1-0-1 frequency, duration, precautions) with instant printable prescription slips.
- **Consultation Closure**: Consultation wrap-up automatically updates patient status to `Completed`.

### 3. Admin Command Center
- **Operational Metrics**: Real-time counts of registered patients, active OPD queues, priority cases, and active doctors.
- **Department & Doctor Management**: Roster monitoring, specialty allocation, and kiosk station health.
- **Security & Audit Logs**: Immutable audit trails recording logins, clinical intake submissions, document releases, and access denials.

---

## ðŸ”’ Security & Privacy Architecture

| Control | Implementation |
| :--- | :--- |
| **Document Privacy by Default** | All patient-uploaded records start with `visibility: 'Private'`. Patients cannot download or view documents until the consulting physician marks them as `Released`. |
| **Direct URL Bypass Prevention** | Static express file serving for `/uploads` is disabled. All file downloads require authenticated access through `/api/documents/:id/file`. |
| **Role-Based Access Control (RBAC)** | Route-level middleware (`authenticateUser`, `requireRole`) blocks unauthorized access (Patients attempting to view Doctor or Admin endpoints receive `403 Forbidden`). |
| **Patient Data Isolation** | Patient B cannot access Patient A's medical records or documents even if released. |
| **Auditing & Traceability** | Sensitive actions (login, registration, document release, access rejection) generate structured `AuditLog` records. |

---

## ðŸ› ï¸ Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express.js (REST API), Socket.IO (Real-time synchronization).
- **Database**: MongoDB with Mongoose ODM.
- **Authentication**: Stateless JSON Web Tokens (JWT) with bcrypt password hashing.
- **AI & OCR Architecture**: Local Ollama service integration with DeepSeek-R1, coupled with deterministic fallbacks and OCR text extraction abstractions.

---

## ðŸ“ Project Structure

```text
Medikosiko/
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ config/              # MongoDB connection & configuration
â”‚   â”œâ”€â”€ middleware/          # JWT authentication, RBAC, and audit logging
â”‚   â”œâ”€â”€ models/              # Mongoose schemas (User, Patient, Doctor, Prescription, etc.)
â”‚   â”œâ”€â”€ routes/              # Express route controllers (/auth, /patients, /doctors, etc.)
â”‚   â”œâ”€â”€ services/            # Local AI (Ollama) and OCR extraction services
â”‚   â”œâ”€â”€ tests/               # Automated test suites (Jest & Supertest)
â”‚   â”œâ”€â”€ uploads/             # Secure directory for patient medical uploads (.gitkeep)
â”‚   â”œâ”€â”€ .env.example         # Template for backend environment variables
â”‚   â”œâ”€â”€ index.js             # Express application and Socket.IO server entrypoint
â”‚   â””â”€â”€ package.json         # Backend dependencies & test scripts
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ public/              # Static assets and icons
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ app/             # Next.js App Router (public, patient, doctor, admin, kiosk)
â”‚   â”‚   â”œâ”€â”€ components/      # Shared components (Navbar, LanguageSwitcher, VoiceInput)
â”‚   â”‚   â”œâ”€â”€ contexts/        # LanguageContext (React i18n state)
â”‚   â”‚   â”œâ”€â”€ locales/         # Localized JSON dictionaries (en.json, ta.json, hi.json)
â”‚   â”‚   â””â”€â”€ lib/             # Central API client (api.ts) and Socket.IO client (socket.ts)
â”‚   â”œâ”€â”€ .env.example         # Template for frontend environment variables
â”‚   â”œâ”€â”€ next.config.js       # Next.js configuration with API proxy rewrites
â”‚   â”œâ”€â”€ tailwind.config.ts   # Tailwind styling and high-contrast hospital color palette
â”‚   â””â”€â”€ package.json         # Frontend dependencies & Next.js scripts
â”œâ”€â”€ .gitignore               # Root ignore rules for dependencies, secrets, and uploads
â””â”€â”€ README.md                # Project documentation
```

---

## âš™ï¸ Environment Setup & Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB Community Server (v6.0 or higher) running locally on port 27017
- (Optional) [Ollama](https://ollama.ai/) with DeepSeek model for local AI synthesis

---

### Step 1: Clone the Repository
```bash
git clone <repository_url>
cd Medikosiko
```

---

### Step 2: Configure Environment Variables

#### Backend Configuration
Copy `backend/.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```
Ensure `backend/.env` contains:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/medikiosk
JWT_SECRET=your_secure_jwt_secret_key_here
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-r1:8b
CLIENT_URL=http://localhost:3000
```

#### Frontend Configuration
Copy `frontend/.env.example` to `frontend/.env.local`:
```bash
cp frontend/.env.example frontend/.env.local
```
Ensure `frontend/.env.local` contains:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

### Step 3: Install Dependencies

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

### Step 4: Run the Application

#### Start the Backend Server (Port 5000)
```bash
cd backend
npm start
```
*The backend connects to MongoDB and listens on `http://localhost:5000`.*

#### Start the Frontend Development Server (Port 3000)
```bash
cd frontend
npm run dev
```
*The frontend will be available at `http://localhost:3000`.*

---

## ðŸ§ª Testing & Verification

### Automated Backend Tests
Run the complete automated test suite (verifying authentication, RBAC, public registration restrictions, authoritative clinicalMode enforcement, OPD state machine transitions, document privacy, side-by-side OCR file preservation, cross-patient ownership, doctor queue, prescriptions, FHIR R4 bundles, integration services, and multilingual dictionary integrity):
```bash
cd backend
npm test
```
*All 43 test cases across `api.test.js` and `i18n.test.js` pass with 100% success against an isolated `medikiosk_test` database.*

### Frontend Linting & Build
```bash
cd frontend
npm run lint
npm run build
```
*Compiles cleanly and optimizes all 25 static application pages with zero errors.*

---

## ðŸ“Š Implementation & Architectural Status

### ðŸŸ¢ IMPLEMENTED
- **Authoritative Department Clinical Mode**: MongoDB-backed authoritative mode (`MEDICAL` vs `AYUSH`) enforced in the backend. Client spoofing attempts are strictly overridden.
- **Unified Department Configuration**: Consistent departments across models, seed, tests, and UI: Allopathic (`General Medicine`, `Cardiology`, `Pediatrics`, `Orthopedics`) and AYUSH (`Ayurveda`, `Siddha`, `Unani`).
- **OPD State Machine**: Formal state machine (`REGISTERED` &rarr; `WAITING` &rarr; `HISTORY_IN_PROGRESS` &rarr; `HISTORY_COMPLETED` &rarr; `READY_FOR_DOCTOR` &rarr; `IN_CONSULTATION` &rarr; `COMPLETED`) with invalid transitions strictly rejected (e.g. `COMPLETED` &rarr; `NEW`).
- **Local OCR Extraction Engine**: Integrated local extraction using `tesseract.js` (pure WebAssembly/JS) for printed documents and `pdf-parse` for PDF text streams. Enforces standardized lifecycle statuses (`Processing`, `Successfully extracted`, `Low-confidence extraction`, `OCR unavailable`, `OCR failed`) and numerical confidence tracking.
- **FHIR R4 Bundle Export**: Generates NRCES / ABDM compliant `OPConsultRecord` FHIR R4 Document Bundles (`GET /api/patients/:id/fhir-bundle` and `GET /api/opd/visits/:id/fhir`) with `Composition`, `Patient`, `Encounter`, `Condition`, `Observation` (vitals), `MedicationRequest`, and `AllergyIntolerance` resources. Accessible directly from the Patient Records portal.
- **Document Privacy Controls**: Documents default to `Private`. Patients cannot access private documents. Doctors review and explicitly release documents. Cross-patient document isolation enforced at the API level.
- **Side-by-Side OCR Verification**: Doctor modal viewing original PDF/image alongside editable structured entities (`testName`, `value`, `unit`, `referenceRange`, `impression`). Verification updates metadata while the physical uploaded file remains 100% immutable.
- **Cross-Patient Ownership Security**: Authenticated user identity (`req.user.id`) enforced on profile, OPD visits, clinical history, documents, prescriptions, FHIR bundles, and consent records.
- **Public Registration Guardrails**: Public registration (`/register`) is restricted strictly to the `PATIENT` role; unauthorized requests for `DOCTOR` or `ADMIN` roles are rejected with `403 Forbidden`.
- **Kiosk Security & Inactivity Reset**: 90-second inactivity timer with 15-second visual countdown modal, purging all sensitive memory, form state, and uploaded document references.
- **Trilingual Localization (i18n)**: Full UI localization across English, Tamil, and Hindi for patient portals, consent, kiosk, validation, and clinical questionnaires.
### 2. Full Automated End-to-End Test Suite
Run the comprehensive live end-to-end test suite (exercising Patient E2E, Medical mode, AYUSH mode, mode spoofing rejection, RBAC, document privacy lifecycle, OCR engine statuses, deterministic AI fallback, FHIR R4 exports, digital consent, doctor-confirmed prescriptions with SHA-256 digest, kiosk 90s timeout, multilingual rendering, Socket.IO live broadcasts, and live admin operational telemetry):
```bash
cd backend
npm run test:e2e
```
*All 15 E2E categories validate with 100% PASS against the live server and database.*

---

## ðŸ“¡ API Overview

| Endpoint | Method | Role | Description |
| :--- | :---: | :---: | :--- |
| `/api/health` | GET | Public | Server operational status and timestamp |
| `/api/auth/register` | POST | Public | Patient-only self-registration (Doctor/Admin rejected with 403) |
| `/api/auth/login` | POST | Public | JWT authentication for Patients, Doctors, and Hospital Admins |
| `/api/departments` | GET | Public | Active clinical departments with authoritative `clinicalMode` |
| `/api/opd/visits` | POST | PATIENT | Create OPD visit; backend derives authoritative `clinicalMode` |
| `/api/opd/visits/:id/status` | PATCH | Authenticated | OPD state machine transitions (`REGISTERED` &rarr; `WAITING`, etc.) |
| `/api/opd/visits/:id/fhir` | GET | Authenticated | Export OPD encounter as NRCES/ABDM FHIR R4 Document Bundle |
| `/api/consent` | POST | PATIENT | Record digital consent (`purpose`, `language`, `version`) with audit log |
| `/api/clinical-history/submit-history` | POST | PATIENT | Conversational intake submission with red-flag rule scan |
| `/api/documents/upload` | POST | PATIENT | Secure document upload (`visibility: 'Private'` by default) |
| `/api/documents/:id` | GET | Authenticated | Document inspection (Doctor access or released patient access only) |
| `/api/documents/:id/visibility` | PATCH | DOCTOR | Doctor-controlled document release (`Private` &rarr; `Released`) |
| `/api/documents/:id/extracted-data` | PATCH | DOCTOR | Side-by-side OCR entity verification (disk file remains immutable) |
| `/api/doctors/queue` | GET | DOCTOR | Real-time queue sorted by acuity (`URGENT` red flags first) |
| `/api/consultations/start` | POST | DOCTOR | Initiate physician consultation session |
| `/api/consultations/complete` | POST | DOCTOR | Complete consultation and discharge patient |
| `/api/prescriptions` | POST | DOCTOR | Authorize doctor prescription with SHA-256 cryptographic digest |
| `/api/patients/:id/fhir-bundle` | GET | Authenticated | Full patient dossier export in NRCES/ABDM FHIR R4 Bundle |
| `/api/admin/stats` | GET | ADMIN | Live telemetry KPIs (patients, visits, doctors, kiosks, red flags) |
| `/api/admin/audit-logs` | GET | ADMIN | Immutable security and regulatory audit log feed |

---

## ðŸ—„ï¸ Database Architecture

| Collection | Schema Model | Purpose |
| :--- | :--- | :--- |
| `users` | `User.js` | Core authentication, bcrypt hashed credentials, and role assignments (`PATIENT`, `DOCTOR`, `ADMIN`) |
| `patients` | `Patient.js` | Demographic records, ABHA IDs, government hospital UHIDs, and assigned OPD tokens |
| `doctors` | `Doctor.js` | Physician credentials, MCI license numbers, specialties, and OPD room allocations |
| `departments` | `Department.js` | Hospital specialties with authoritative `clinicalMode` (`MEDICAL` vs `AYUSH`) |
| `opdvisits` | `OpdVisit.js` | Outpatient encounters, token numbers (`TKN-XXX`), and state machine status |
| `consents` | `Consent.js` | Digital consent audit trail (purpose, version, language, timestamp) |
| `clinicalhistories` | `ClinicalHistory.js` | Chief complaints, HPI, pain scales, AYUSH Dashavidha Pariksha, and red-flag alerts |
| `medicaldocuments` | `MedicalDocument.js` | Diagnostic reports with storage paths, OCR confidence, extracted entities, and visibility lifecycle |
| `consultations` | `Consultation.js` | Physician clinical notes, assessment, and treatment plans |
| `prescriptions` | `Prescription.js` | Drug items (dosage, frequency, duration) with SHA-256 tamper-evident digest |
| `kiosks` | `Kiosk.js` | Touch terminal telemetry, physical locations, and connectivity health |
| `auditlogs` | `AuditLog.js` | Immutable chronological event log for access control, uploads, and data releases |

---

## ðŸŽ¬ Step-by-Step Demo Walkthrough

1. **Self-Service Kiosk (`/kiosk`)**:
   - Patient selects language (**English**, **à®¤à®®à®¿à®´à¯**, or **à¤¹à¤¿à¤¨à¥à¤¦à¥€**).
   - Enters basic demographics or scans ABHA card.
   - Selects OPD department:
     - Selecting **General Medicine / Cardiology / Pediatrics / Orthopedics** activates **Medical Mode**.
     - Selecting **Ayurveda / Siddha / Unani** automatically activates **AYUSH Mode** with Prakriti, Vikriti, and Agni assessment.
   - Records chief complaints and answers follow-up severity questions.
   - If user steps away, the **90-second inactivity timer** triggers a **15-second visual warning** and resets all session memory cleanly.
2. **Patient Dashboard (`/patient`)**:
   - Patient views live OPD token number and estimated queue position.
   - Uploads outside lab report or previous prescription: default visibility is immediately set to `Private` (hidden from public view).
3. **Doctor Cockpit (`/doctor`)**:
   - Attending doctor logs in (`doctor@hospital.gov.in` / `Password123!`).
   - Doctor queue displays patients prioritized by acuity: cases with acute chest pain or respiratory distress appear at the top as **`URGENT`**.
   - Doctor opens patient dossier to review the structured intake summary with mandatory disclaimer: *"AI-Assisted Clinical Summary â€” Requires Doctor Review"*.
   - Doctor clicks **Inspect Document** to review uploaded PDF/image side-by-side, edits extracted lab values if needed, and clicks **Release to Patient**.
   - Doctor starts consultation, writes prescription with frequency and follow-up, and completes the visit.
4. **Patient Record Access (`/patient/records`)**:
   - Patient can now view the released diagnostic report and doctor-confirmed prescription.
   - Patient can click **Export FHIR R4 Bundle** to download a standardized NRCES/ABDM JSON bundle.
5. **Hospital Command Center (`/admin`)**:
   - Hospital administrator logs in (`admin@hospital.gov.in` / `Password123!`).
   - Views live operational counts, department queues, doctor availability, active kiosks, and real-time audit trails.

---

## ðŸ“Š Implementation & Architectural Status

### ðŸŸ¢ IMPLEMENTED
- **Authoritative Department Clinical Mode**: MongoDB-backed authoritative mode (`MEDICAL` vs `AYUSH`) enforced in the backend. Client spoofing attempts are strictly overridden.
- **Unified Department Configuration**: Consistent departments across models, seed, tests, and UI: Allopathic (`General Medicine`, `Cardiology`, `Pediatrics`, `Orthopedics`) and AYUSH (`Ayurveda`, `Siddha`, `Unani`).
- **OPD State Machine**: Formal state machine (`REGISTERED` &rarr; `WAITING` &rarr; `HISTORY_IN_PROGRESS` &rarr; `HISTORY_COMPLETED` &rarr; `READY_FOR_DOCTOR` &rarr; `IN_CONSULTATION` &rarr; `COMPLETED`) with invalid transitions strictly rejected.
- **Local OCR Extraction Engine**: Integrated local extraction using `tesseract.js` (with local traineddata and timeout protection) and `pdf-parse`. Standardized lifecycle statuses (`Processing`, `Successfully extracted`, `Low-confidence extraction`, `OCR unavailable`, `OCR failed`) with numerical confidence.
- **FHIR R4 Bundle Export**: Generates NRCES / ABDM compliant `OPConsultRecord` FHIR R4 Document Bundles (`GET /api/patients/:id/fhir-bundle` and `GET /api/opd/visits/:id/fhir`) with `Composition`, `Patient`, `Encounter`, `Condition`, `Observation` (vitals), `MedicationRequest`, and `AllergyIntolerance` resources.
- **Document Privacy Controls**: Documents default to `Private`. Patients cannot access private documents until doctor review and explicit release. Direct `/uploads` URL access is disabled with `403 Forbidden`. Cross-patient document isolation enforced at the API level.
- **Side-by-Side OCR Verification**: Doctor modal viewing original PDF/image alongside editable structured entities (`testName`, `value`, `unit`, `referenceRange`, `impression`). Verification updates metadata while the physical uploaded file remains 100% immutable (SHA-256 verified).
- **Cross-Patient Ownership Security**: Authenticated user identity (`req.user.id`) enforced on profile, OPD visits, clinical history, documents, prescriptions, FHIR bundles, and consent records.
- **Public Registration Guardrails**: Public registration (`/register`) is restricted strictly to the `PATIENT` role; unauthorized requests for `DOCTOR` or `ADMIN` roles are rejected with `403 Forbidden`.
- **Kiosk Security & Inactivity Reset**: 90-second inactivity timer with 15-second visual countdown modal, purging all sensitive memory, form state, and uploaded document references.
- **Trilingual Localization (i18n)**: Full UI localization across English, Tamil, and Hindi for patient portals, consent, kiosk, validation, and clinical questionnaires.
- **Doctor Consultation & Doctor-Confirmed Prescription**: Acuity-based doctor queue, clinical notes, SHA-256 tamper-evident doctor-confirmed prescriptions, and consultation closure.
- **Real-Time WebSockets**: Socket.IO events for live queue synchronization (`new-patient`, `patient-update`, `report-released`, `consultation-completed`).

### ðŸŸ¡ PARTIALLY IMPLEMENTED
- **AI-Assisted Clinical Structuring**: Local Ollama (`deepseek-r1:8b`) integration via `ollamaService.js` with deterministic rule-based structuring fallback when Ollama is unavailable. Output is always labeled *"AI-Assisted Clinical Summary â€” Requires Doctor Review"*.

### ðŸ”µ INTEGRATION-READY
- **ABDM Gateway Service Interfaces**: Architectural interface (`backend/services/abdmService.js`) covering Milestone 1 (ABHA creation & verification), Milestone 2 (HIP care context linking), and Milestone 3 (HIU consent flow). Ready for NHA sandbox client credentials.
- **Digital Signature Service**: Cryptographic service interface (`backend/services/digitalSignatureService.js`) calculating SHA-256 digests for prescriptions; ready for Class 3 USB PKI tokens or Aadhaar eSign ASP integration.
- **ICD-10 Codification Service**: Clinical terminology interface (`backend/services/icd10Service.js`) with local fallback vocabulary; ready for official WHO ICD API credentials.
- **Speech-to-Text Integration**: Web Speech API browser acoustic capture active; frontend and backend hooks configured for server-side Bhashini/AI4Bharat pipelines.

### ðŸ”´ NOT IMPLEMENTED / SCOPE LIMITATIONS
- **Live production ABDM Gateway Sandbox network connectivity** (requires official National Health Authority credentials).
- **Live Bhashini / AI4Bharat server-side speech recognition pipeline** (uses browser Web Speech API with fallback touch chips).
- **Production handwritten cursive medical prescription OCR engine** (uses printed document OCR engine; complex handwritten cursive doctor scripts require cloud vision models).
- **Live physical USB PKI hardware token / Aadhaar eSign ASP network connectivity** (uses SHA-256 cryptographic digest calculation).
- **Live WHO ICD-10 API network integration** (uses local clinical dictionary).

---

## ðŸ“œ License & Compliance

Developed for Indian Public Healthcare and Government Hospital OPD workflow modernization. Adheres to standard clinical documentation guidelines and NRCES / ABDM FHIR R4 profile specifications.
