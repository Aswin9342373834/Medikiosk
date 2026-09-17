# MediKiosk
## AI-Powered Clinical History, Medical Document Digitization & Real-Time Patient Intake Platform for Indian Government Hospitals

> **MediKiosk** is a patient-facing AI clinical intake software platform designed for high-volume Indian government hospital OPDs. It enables patients to independently provide comprehensive clinical history through natural voice conversation and guided touchscreen interaction, digitize existing physical medical documents, and generate a structured physician-ready summary before consultation.

---

# 1. Executive Summary

Clinical history-taking is one of the most important diagnostic activities in medicine. A proper history includes the patient's presenting complaint, history of present illness, past medical and surgical history, drug and allergy history, family and personal history, and review of systems.

In India's overburdened public hospital outpatient departments, the available consultation time can be extremely limited. The original problem statement highlights that tertiary government hospitals and apex institutions can register thousands of OPD patients per day, while consultation time may be only a few minutes. Within this short period, the physician may need to elicit history, examine the patient, review previous records, formulate a clinical assessment, counsel the patient, and prescribe treatment.

This creates a clinical history-taking bottleneck and can contribute to under-elicitation of history, repeated questioning, difficulty reviewing previous records, and missed information.

MediKiosk addresses this **first-mile clinical information problem** by moving structured information collection to a patient-facing kiosk or portal before the consultation.

The system combines:

- Conversational AI
- Voice and touch interaction
- Indian-language support
- Adaptive clinical questioning
- AYUSH history mode
- Red-flag screening
- Medical document scanning
- OCR
- Medical information extraction
- Chronological medical timeline
- AI-generated physician-ready summary
- Doctor verification
- Real-time doctor/patient updates
- Doctor-controlled report visibility
- Patient health records
- Hospital-wide administration
- Consent and security controls
- FHIR/ABDM/ABHA-ready architecture

The doctor remains the responsible clinical decision-maker. AI-generated information is presented as a draft for professional review and is not an autonomous diagnosis.

---

# 2. Background and Problem Analysis

## 2.1 Clinical History-Taking Bottleneck in Indian Hospitals

History taking is the structured elicitation of:

- Presenting complaints
- History of present illness
- Past medical history
- Past surgical history
- Drug history
- Allergy history
- Family history
- Personal history
- Review of systems

The supplied problem statement describes history-taking as a major diagnostic activity and highlights the severe time pressure experienced in Indian public hospital OPDs.

The problem statement notes that tertiary government hospitals and apex institutions can routinely register approximately **4,000–10,000 OPD patients per day**, while consultation time may frequently be in the **2–5 minute range**. It also references a BMJ Open study published in 2017 reporting an average primary-care consultation in India of just over two minutes.

Within this limited consultation window, doctors may need to:

1. Elicit clinical history
2. Examine the patient
3. Review previous records
4. Formulate a diagnosis/clinical assessment
5. Counsel the patient
6. Prescribe treatment

This creates a significant information bottleneck.

MediKiosk attempts to address this bottleneck by collecting structured patient information before the patient enters the consultation workflow.

---

# 3. AYUSH-Specific Challenge

AYUSH institutions have an additional history-taking requirement.

The supplied problem statement identifies Ayurvedic history frameworks including:

- Trividha Pariksha
- Ashtavidha Pariksha
- Dashavidha Pariksha

The extended Ayurvedic history can include:

- Prakriti
- Vikriti
- Agni
- Koshtha
- Ahara-Vihara
- Nidana
- Samprapti

MediKiosk therefore includes an **AYUSH History Mode** for Ayurvedic OPDs.

The system can capture Dashavidha Pariksha parameters:

1. Prakriti
2. Vikriti
3. Sara
4. Samhanana
5. Pramana
6. Satmya
7. Sattva
8. Ahara Shakti
9. Vyayama Shakti
10. Vaya

It can also capture relevant Ahara-Vihara information.

The exact clinical questionnaire and terminology should be configured and validated with qualified AYUSH professionals.

---

# 4. Medical Documentation and Records Fragmentation

Patients may carry medical information in multiple formats:

```text
Paper Prescriptions
        +
Laboratory Reports
        +
Discharge Summaries
        +
Imaging Reports
        +
Referral Documents
        +
Previous Medical Records
```

These documents may be:

- Handwritten
- Printed
- In different languages
- From different hospitals
- Chronologically disordered
- Available only as physical copies or images

The physician may therefore spend a portion of the limited consultation time manually reviewing fragmented documents.

MediKiosk provides a first-mile document digitization workflow:

```text
Physical Medical Document
        ↓
Scan / Upload
        ↓
OCR
        ↓
Medical Information Extraction
        ↓
Structured Data
        ↓
Chronological Timeline
        ↓
Doctor Review
```

---

# 5. ABDM and First-Mile Problem

The supplied problem statement describes the **Ayushman Bharat Digital Mission (ABDM)** as establishing national digital-health infrastructure including:

- ABHA IDs
- Health Information Exchange infrastructure
- FHIR-based interoperability standards

However, the problem identified by the statement is the lack of an efficient patient-facing first-mile platform that can capture structured history and digitize medical documents before the clinical encounter.

MediKiosk is designed as that first-mile layer.

Conceptually:

```text
Patient
   ↓
MediKiosk
   ↓
Structured Clinical Information
   ↓
Hospital Information System
   ↓
Authorized ABDM / ABHA Workflow
```

The actual ABDM/ABHA integration requires the appropriate APIs, authorization, consent, credentials, hospital integration, testing, and production deployment.

---

# 6. Precise Problem Statement

The supplied description identifies the following core problem:

> There is no purpose-built patient-facing software platform that enables patients to independently and comprehensively record their medical history through natural spoken conversation and guided touchscreen interaction while simultaneously digitizing their existing physical medical documents and generating a structured, physician-ready clinical history summary before the consultation.

MediKiosk is designed to address this gap.

---

# 7. Why Existing Solutions Fall Short

## 7.1 Hospital Registration Systems

Traditional hospital registration systems may capture:

- Name
- Age
- Department
- Token number
- Appointment information
- Demographic information

However, registration alone does not provide comprehensive clinical history or intelligent medical document processing.

---

## 7.2 Mobile Health Applications

Mobile applications can require:

- Smartphone ownership
- Smartphone literacy
- Stable connectivity
- Patient enrolment
- Familiarity with digital interfaces

This can create accessibility challenges for:

- Elderly users
- Rural users
- Low-literacy users
- First-time patients
- Patients unfamiliar with healthcare applications

MediKiosk provides a patient-facing kiosk/touch interface with voice guidance to reduce these barriers.

---

## 7.3 Manual Nurse-Led Triage

Manual history desks and nurse-led triage depend heavily on human resources.

In a high-volume government hospital, a completely manual first-mile history workflow may not scale efficiently.

MediKiosk therefore aims to automate structured information collection while keeping clinically important decisions under human supervision.

---

## 7.4 Generic Document Scanners

A generic scanner may create an image or PDF of a report.

MediKiosk goes further by attempting to:

```text
Scan
 ↓
OCR
 ↓
Extract Clinical Entities
 ↓
Structure Information
 ↓
Chronologically Organize
 ↓
Present for Doctor Review
```

---

# 8. Specific Challenges Addressed

MediKiosk is designed around five major challenges identified in the original problem statement.

## Challenge 1 — Multilingual Voice

The platform must handle:

- Indian languages
- Regional accents
- Mixed-language speech
- Hospital background noise
- Different levels of digital familiarity

---

## Challenge 2 — Accessibility

The interface should be usable by a first-time, non-technical patient.

Design principles include:

- Large touch targets
- Icon-driven UI
- Simple instructions
- Audio prompts
- Voice interaction
- Guided navigation
- Minimal typing

---

## Challenge 3 — Clinical History Structuring

Free-form patient narration should be converted into a structured format:

```text
Chief Complaint
HPI
Past Medical History
Past Surgical History
Drug History
Allergy History
Family History
Personal History
Review of Systems
Prior Investigations
```

AYUSH mode can additionally capture Dashavidha Pariksha and Ahara-Vihara parameters.

---

## Challenge 4 — Medical OCR

MediKiosk should process:

- Printed prescriptions
- Handwritten prescriptions where supported
- Laboratory reports
- Discharge summaries
- Investigation reports

and extract:

- Diagnoses
- Medications
- Dosages
- Investigation values
- Reference ranges
- Procedures
- Surgery history

OCR results should be treated as requiring appropriate verification, particularly for handwritten or poor-quality documents.

---

## Challenge 5 — Privacy and Security

The system handles sensitive health information.

The architecture therefore includes:

- Consent
- Role-based access
- Secure processing
- Authentication
- Audit logging
- Session cleanup
- Controlled report visibility
- Appropriate data protection practices

The supplied problem statement specifically identifies the **Digital Personal Data Protection Act 2023** and the **ABDM consent framework** as relevant considerations.

---

# 9. Proposed Solution — MediKiosk

MediKiosk is a software platform for AI-powered clinical history collection and medical document intelligence.

The patient can:

1. Identify themselves
2. Select a language
3. Provide consent
4. Answer clinical questions by voice or touch
5. Complete adaptive history
6. Receive red-flag screening
7. Scan medical documents
8. Review extracted information
9. Review the generated clinical summary
10. Submit information to the hospital workflow

The doctor can then:

1. Receive the patient in the queue
2. Review the clinical history
3. Review medical documents
4. Review OCR output
5. Review the AI summary
6. Correct/confirm/reject AI-generated information
7. Conduct consultation
8. Record clinical assessment
9. Create prescription
10. Decide report visibility
11. Complete the consultation

The admin can monitor hospital operations in real time.

---

# 10. Module A — Conversational Multimodal History Engine

The Conversational Multimodal History Engine conducts structured clinical history through:

- Voice
- Touch
- Guided prompts
- Adaptive questioning

The patient can speak naturally in a supported language.

For example:

```text
Patient:
"I have chest pain."

        ↓

AI:
"When did the pain begin?"

        ↓

Patient:
"Yesterday."

        ↓

AI:
"Does the pain become worse with physical activity?"
```

The system can use a clinical history ontology and dialogue-management logic to maintain structure.

---

# 11. Adaptive Questioning

Questions dynamically branch based on previous answers.

The supplied problem statement gives chest pain as an example and references the SOCRATES framework.

A simplified flow can be:

```text
Chief Complaint
      ↓
Onset
      ↓
Character
      ↓
Location
      ↓
Radiation
      ↓
Aggravating Factors
      ↓
Relieving Factors
      ↓
Associated Symptoms
      ↓
Relevant History
```

The exact questioning logic should be clinically validated before production deployment.

---

# 12. Dual-Mode Input

Every important patient question should ideally be answerable by:

### Voice

```text
🎤 Speak your answer
```

or

### Touch

```text
YES
NO
NOT SURE
SELECT OPTION
```

This makes the system more accessible across literacy and digital-comfort levels.

---

# 13. AYUSH History Mode

For Ayurvedic OPDs, the system provides an extended history mode.

Example:

```text
AYUSH MODE

Prakriti
Vikriti
Sara
Samhanana
Pramana
Satmya
Sattva
Ahara Shakti
Vyayama Shakti
Vaya
Ahara-Vihara
```

This mode should be configurable according to the clinical workflow of the participating AYUSH institution.

---

# 14. Red-Flag Detection

MediKiosk can screen the captured history for potentially urgent symptoms.

Example:

```text
Patient History
      ↓
Clinical Screening
      ↓
Potential Red Flag
      ↓
Priority Alert
      ↓
Authorized Triage Staff
```

The original problem statement gives examples such as:

- Acute chest pain with dyspnoea
- Stroke symptoms

The purpose is to trigger immediate human attention rather than routine queueing.

**MediKiosk should not independently diagnose or prescribe treatment.**

---

# 15. Module B — Medical Document Digitization & Intelligence

The medical document module allows patients to scan or upload previous:

- Prescriptions
- Lab reports
- Discharge summaries
- Investigation reports
- Other relevant medical documents

Pipeline:

```text
Document
   ↓
Image Processing
   ↓
OCR
   ↓
Medical Entity Extraction
   ↓
Structured Data
   ↓
Doctor Review
```

---

# 16. Intelligent Medical Extraction

Potentially extracted information includes:

### Diagnoses

```text
Diagnosis
Condition
Clinical Finding
```

### Medications

```text
Medicine
Dosage
Frequency
Duration
Instructions
```

### Investigations

```text
Investigation
Result
Value
Reference Range
Date
```

### Procedures

```text
Procedure
Surgery
Treatment History
```

The extracted data should remain reviewable and traceable to the source document.

---

# 17. Chronological Medical Timeline

Documents and clinical events should be organized chronologically.

Example:

```text
SEP 05
Emergency Visit
      ↓
SEP 05
Investigation
      ↓
SEP 06
Consultation
      ↓
SEP 06
Prescription
      ↓
SEP 07
Follow-up
```

This allows the physician to understand the patient's previous history more quickly.

---

# 18. Abnormal-Value Highlighting

Where laboratory reference ranges are reliably available, the system can highlight potentially abnormal values for physician attention.

Example:

```text
Laboratory Report

Hb       10.2 g/dL    Attention
Sodium   140 mmol/L   Within range
```

This is a support feature.

It should not be treated as a final clinical interpretation without physician review.

---

# 19. Drug Interaction Attention

Where a validated medication knowledge source is available, the system can flag potential drug interactions for physician attention.

Example:

```text
Medication A
      +
Medication B
      ↓
Potential Interaction
      ↓
Physician Review
```

The alert should be informational and should not automatically change treatment.

---

# 20. Module C — Structured History Summary Generator

The AI summary generator combines:

```text
Conversational History
        +
Digitized Medical Documents
        +
Investigation Information
        +
Relevant Timeline Events
        ↓
Structured Clinical Summary
```

The summary should be available to the doctor when the patient reaches the consultation stage.

---

# 21. Standard Clinical Format

The supplied problem statement specifies a standard clinical structure:

```text
Chief Complaint
        ↓
History of Present Illness
        ↓
Past Medical / Surgical History
        ↓
Drug / Allergy History
        ↓
Family History
        ↓
Personal History
        ↓
Review of Systems
        ↓
Prior Investigation Summary
```

This structure is designed to make the information familiar and usable for physicians.

---

# 22. Physician Verification

The AI summary must be clearly labelled:

> **AI-GENERATED DRAFT — PHYSICIAN REVIEW REQUIRED**

The doctor can:

- Edit
- Correct
- Confirm
- Reject

The AI should never silently convert its output into an autonomous diagnosis.

---

# 23. Bilingual Output

The original problem statement proposes:

- Patient-facing audio confirmation in a local language
- Physician-facing summary in English/Hindi

The implementation can extend this through configurable language support.

Example:

```text
Patient:
Local-language voice confirmation

Doctor:
Structured physician-facing summary
```

---

# 24. Module D — Consent, Privacy & ABDM Integration

MediKiosk uses a consent-first approach.

The patient should be informed about:

- What information is collected
- Why it is collected
- AI processing
- Document processing
- Doctor access
- Appropriate data sharing

For low-literacy users, the system can provide audio explanations.

---

# 25. Secure Processing

Sensitive patient information should be processed and stored using appropriate security controls.

Recommended controls include:

- HTTPS
- Encryption
- Secure authentication
- Role-based authorization
- Secure storage
- Audit logs
- Session timeout
- Temporary data cleanup

The production system should undergo appropriate institutional security and compliance review.

---

# 26. Session Termination

The original problem statement specifies that temporary session data should be cleared immediately after submission.

For a public kiosk, this is especially important.

```text
Patient A
   ↓
Uses Kiosk
   ↓
Submits
   ↓
Session Ends
   ↓
Temporary Data Cleared
   ↓
Kiosk Ready
   ↓
Patient B
```

The implementation should also prevent cached personal information from being exposed to the next patient.

---

# 27. Consent-First Design

Consent should be:

- Clear
- Understandable
- Purpose-specific
- Appropriately recorded
- Auditable
- Revocable where applicable

Audio explanation can be provided for patients who have difficulty reading.

---

# 28. Three-Role Application Architecture

MediKiosk contains three major application roles.

```text
                         MEDIKIOSK
                            │
             ┌──────────────┼──────────────┐
             ↓              ↓              ↓
           ADMIN          PATIENT        DOCTOR
             │              │              │
             ↓              ↓              ↓
       Admin Portal    Patient Portal   Doctor Portal
```

Each role has different responsibilities.

---

# 29. Patient Module

## Patient Dashboard

The patient interface follows a clean healthcare-oriented blue-and-white visual style.

### Patient Profile

Displays:

- Patient name
- Patient ID / UHID
- Last visit
- ABHA information where implemented
- Scheme/coverage status

### Medication Reminder

Displays current medication reminders.

Actions:

- Taken
- Skipped
- Snoozed

### My Services

- Health Records
- Admissions

### Medical Services

- Investigation Reports
- Prescriptions
- Vitals
- Clinical History
- Medical Documents

### MediKiosk Services

- Start Clinical History
- Scan Medical Document
- Review AI Summary
- Submission Status

### Additional

- Notifications
- QR/ABHA access where implemented
- Profile
- Settings

---

# 30. Patient Dashboard UI Adaptation

The provided reference patient interface contains sections such as:

- Medical Records
- Admission Records
- Investigation Reports
- My Prescriptions
- Vitals Tracker
- Patient dashboard
- Medication reminder
- Health Records
- Admissions

These concepts can be adapted to MediKiosk.

The following reference features are intentionally removed:

```text
Hospital Wallet       ❌
Pharmacy Wallet       ❌
```

They are not part of the core MediKiosk clinical-intake requirement.

Instead, the interface should use that space for:

```text
Clinical History
Medical Documents
Scan Report
AI Summary
```

---

# 31. Patient Health Records

The patient can view authorized information such as:

- Clinical history
- Previous consultations
- Doctor-confirmed conditions
- Allergies
- Medications
- Previous procedures
- Medical timeline
- Doctor-released reports
- Prescriptions
- Vitals
- Admissions

AI-generated information should be distinguishable from doctor-confirmed information.

---

# 32. Patient Admissions

Admission records can contain:

- Admission date
- Ward
- Department
- Doctor
- Admission ID
- Room/bed where authorized
- Status

Possible statuses:

```text
Admitted
Transferred
Discharged
```

---

# 33. Investigation Reports — Patient View

Patient report interface can contain:

```text
Search & Filter

Report Type
All Types

Time Period
All Time

Investigation Reports
```

Each report can show:

- Report name
- Report ID
- Date
- Type
- Status
- Doctor review status
- View action

---

# 34. Doctor-Controlled Report Visibility

This is an important MediKiosk-specific workflow.

A patient-uploaded report is **not automatically visible to the patient after OCR**.

The workflow is:

```text
Patient Uploads Report
        ↓
OCR + AI Extraction
        ↓
Secure Storage
        ↓
Doctor Receives
        ↓
Doctor Reviews
        ↓
     ┌───────────────┐
     ↓               ↓
Make Visible      Keep Private
     ↓               ↓
Patient Can View   Patient Cannot View
```

Possible report statuses:

```text
Uploaded
Processing
OCR Completed
Pending Doctor Review
Approved
Released
Private
```

Patient-facing message:

> **Under Doctor Review**  
> This report will be available after authorized doctor review and release.

This creates a clear human review point.

---

# 35. Patient Prescription Module

The prescription interface can show:

```text
Prescription ID
Date
Doctor
Department
Status
View
```

Prescription details can contain:

- Medicine
- Dosage
- Frequency
- Duration
- Instructions
- Doctor
- Date
- Status

Prescription data should originate from the doctor's confirmed consultation.

---

# 36. Patient Vitals Tracker

The patient interface can show:

- Blood Pressure
- Heart Rate
- SpO2
- Temperature
- Other Vital Signs

Example:

```text
Blood Pressure
130/80 mmHg

Normal Reference
120/80 mmHg
```

The system can provide historical trends when data exists.

---

# 37. Doctor Module

The doctor portal is the main clinical review interface.

## Doctor Dashboard

```text
Doctor Login
      ↓
Dashboard
      ↓
Patient Queue
      ↓
Select Patient
      ↓
Patient Overview
```

The doctor can access authorized:

- Patient information
- Clinical history
- AI summary
- Medical documents
- OCR results
- Investigation reports
- Medical timeline
- Vitals
- Previous consultations
- Report visibility controls

---

# 38. Doctor Review Workflow

```text
New Patient
     ↓
Review History
     ↓
Review Documents
     ↓
Review OCR
     ↓
Review Timeline
     ↓
Review AI Summary
     ↓
Edit / Correct / Confirm / Reject
     ↓
Consult Patient
```

The doctor should be able to compare extracted information against source documents when necessary.

---

# 39. Clinical Consultation

The doctor records:

- Clinical assessment
- Clinical impression
- Diagnosis where appropriate
- Investigations
- Treatment plan
- Medication
- Dosage
- Frequency
- Duration
- Instructions
- Follow-up

Workflow:

```text
Patient Review
      ↓
Consultation
      ↓
Clinical Assessment
      ↓
Prescription
      ↓
Save / Confirm
      ↓
Patient Record Updated
```

---

# 40. Admin Module

The Admin has hospital-wide operational responsibilities.

Admin can monitor:

- Departments
- Patients
- Doctors
- Reports
- Kiosks
- Government schemes
- Insurance/coverage information
- Analytics
- System activity

Clinical access should still follow role-based authorization and hospital policy.

---

# 41. Admin Real-Time Dashboard

Possible operational metrics:

```text
Patients Today
Waiting Patients
Active Consultations
Completed Consultations
Priority Alerts
Reports Processed
Pending Doctor Reviews
Active Doctors
Active Kiosks
```

These values should be generated from the live backend in an actual deployment rather than hard-coded.

---

# 42. Department Monitoring

Example:

| Department | Patients | Waiting | Doctors | Pending Reports |
|---|---:|---:|---:|---:|
| General Medicine | Live | Live | Live | Live |
| Emergency | Live | Live | Live | Live |
| Pediatrics | Live | Live | Live | Live |
| Cardiology | Live | Live | Live | Live |

The actual departments should be configurable according to the hospital.

---

# 43. Government Scheme Module

Admin can manage:

- Scheme name
- Description
- Eligibility information
- Benefits
- Required documents
- Application status

Patient can view:

- Available schemes
- Relevant information
- Required documents
- Application status

Actual eligibility rules must come from authoritative government/hospital sources.

---

# 44. Insurance / Coverage Module

This is a supporting module.

Possible fields:

- Coverage status
- Verification status
- Provider
- Required documents
- Processing status

It should not assume that all government-hospital patients have private insurance.

---

# 45. Real-Time Hospital Workflow

MediKiosk is intended for real-time hospital use.

## Patient → Doctor

```text
Patient submits history
        ↓
Backend receives information
        ↓
Realtime event
        ↓
Doctor dashboard updates
        ↓
Patient appears in appropriate queue
```

## Patient → Report

```text
Patient uploads report
        ↓
OCR processing
        ↓
Doctor receives update
        ↓
Doctor reviews report
```

## Doctor → Patient

```text
Doctor releases report
        ↓
Realtime event
        ↓
Patient health record updates
        ↓
Patient can view released report
```

## Red Flag

```text
History captured
        ↓
Potential red flag detected
        ↓
Authorized triage alert
```

## Consultation

```text
Doctor completes consultation
        ↓
Clinical record updated
        ↓
Prescription available
        ↓
Patient portal updated
```

## Admin

```text
Patient / Doctor / Report Events
          ↓
Realtime Backend
          ↓
Admin Dashboard
          ↓
Current Hospital Operations
```

---

# 46. End-to-End Patient Journey

The original problem statement defines the journey as:

## Step 1 — Identify

Patient:

- Logs into the software platform
- Enters/scans an ABHA ID or permitted identity information
- Can register as a new patient where required
- Selects language
- Provides consent through an audio-guided flow

```text
Identify
   ↓
Language
   ↓
Consent
```

---

## Step 2 — Converse

AI conducts an adaptive voice + touch history interview.

It captures:

- Chief complaint
- HPI
- Relevant clinical history
- Red flags

```text
Voice / Touch
      ↓
Adaptive Questions
      ↓
Structured History
      ↓
Red Flag Screening
```

---

## Step 3 — Scan

Patient uploads/scans:

- Previous prescriptions
- Laboratory reports
- Discharge summaries
- Other relevant medical documents

AI:

```text
Digitizes
   ↓
Extracts
   ↓
Structures
   ↓
Chronologically Organizes
```

---

## Step 4 — Summarize & Route

The system generates:

- Structured clinical summary
- Medical timeline
- Document information

The workflow can then update the hospital system and authorized digital health infrastructure where integration is implemented.

The summary appears on the physician's screen.

---

## Step 5 — Consult

The physician:

- Reviews the complete history
- Edits/confirms the AI-generated information
- Reviews documents
- Examines the patient
- Performs clinical reasoning
- Counsels the patient
- Prescribes treatment

The supplied problem statement describes the goal as allowing the physician to spend the consultation on examination, reasoning, and counselling rather than spending most of the available time on basic history elicitation.

---

# 47. Complete MediKiosk Workflow

```text
                         MEDIKIOSK
                            │
             ┌──────────────┼──────────────┐
             ↓              ↓              ↓
           ADMIN          PATIENT        DOCTOR
             │              │              │
             ↓              ↓              ↓
       Admin Portal    Patient Portal   Doctor Portal
             │              │              │
       Hospital-wide     Identify       Patient Queue
       monitoring          ↓              ↓
       departments      Language       Select Patient
       patients            ↓              ↓
       reports          Consent       Patient Profile
       schemes             ↓              ↓
       coverage        AI History      AI Summary
       doctors             ↓              ↓
       kiosks          Voice/Touch     Documents
       analytics           ↓              ↓
       system          Adaptive Qs      Timeline
                          ↓                ↓
                     Red-Flag Check     Doctor Review
                          ↓                ↓
                     Scan Documents     Examination
                          ↓                ↓
                          OCR         Clinical Assessment
                          ↓                ↓
                   Medical Extraction   Prescription
                          ↓                ↓
                     Timeline        Save/Confirm Record
                          ↓                ↓
                     AI Summary             │
                          ↓                  │
                    Patient Review           │
                          ↓                  │
                      Submission             │
                          ↓                  │
                     HIS / ABHA* ───────────→│
                                             ↓
                                    Updated Health Record
                                             ↓
                                          Patient
                                             ↓
                                   Released Information

* Where implemented and authorized.
```

---

# 48. Technology Architecture

A practical implementation can use the following architecture.

## Frontend

### Patient/Kiosk

- Flutter

Suitable for:

- Android kiosks
- Tablets
- Touch interfaces
- Responsive layouts

### Web Portals

- React / Next.js
- Responsive CSS
- Component-based UI

---

## Backend

- Node.js
- Express.js
- REST APIs
- Realtime APIs/WebSockets

---

## Database

- PostgreSQL
- Supabase where suitable

Possible backend responsibilities:

- Authentication
- Patient records
- Clinical history
- Documents
- Reports
- Prescriptions
- Notifications
- Audit logs
- Realtime events

---

## AI Layer

- Large Language Model
- Clinical dialogue manager
- Clinical information extraction
- Structured summary generation
- Question branching

The model should be constrained by a clinical history structure and validated workflows rather than allowed to generate unrestricted clinical instructions.

---

## Speech Layer

- Indian-language ASR
- Speech-to-text
- Text-to-speech

Possible technology sources may include Indian-language speech models such as Bhashini/AI4Bharat-based services where technically and operationally appropriate.

---

## OCR Layer

- Printed document OCR
- Handwritten document OCR where supported
- Medical entity extraction
- Document classification

---

## Realtime Layer

Possible technologies:

- WebSockets
- Supabase Realtime
- Event-driven backend services

---

## Interoperability

- FHIR-compatible data structures
- Hospital Information System integration
- ABDM/ABHA integration layer where authorized and implemented

---

# 49. Suggested Database Structure

```text
users
patients
doctors
admins
departments

patient_profiles

clinical_histories
clinical_history_answers

medical_documents
document_ocr_results

investigation_reports
investigation_results

medical_timelines

vitals

consultations
clinical_assessments

prescriptions
prescription_items

report_visibility

admissions

government_schemes
scheme_documents

insurance_records

consents

notifications

audit_logs

kiosks
```

---

# 50. Important Report Visibility Data Model

A report should have a visibility state separate from its upload state.

Example:

```text
document_status:
Uploaded
Processing
OCR Completed

doctor_review_status:
Pending
Reviewed

patient_visibility:
Private
Released
```

This prevents the system from accidentally exposing a document simply because it has completed OCR.

---

# 51. Notification System

## Patient Notifications

- History submitted
- Consultation completed
- Prescription available
- Report released
- Follow-up reminder

## Doctor Notifications

- New patient history
- New medical document
- New investigation report
- Priority alert
- Patient waiting

## Admin Notifications

- Kiosk offline
- Operational alert
- Pending report reviews
- Department queue alert
- System event

---

# 52. Status Management

## Patient

```text
Registered
History Collection
Waiting for Doctor
In Consultation
Completed
```

## Clinical History

```text
Not Started
In Progress
Submitted
Doctor Reviewed
Confirmed
```

## Medical Document

```text
Uploaded
Processing
OCR Completed
Pending Doctor Review
Approved
Released
Private
```

## Consultation

```text
Waiting
In Consultation
Completed
```

---

# 53. Security and Privacy Architecture

Because MediKiosk processes health information, security must be considered from the beginning.

## Authentication

Separate authenticated access for:

- Patient
- Doctor
- Admin

## Authorization

Role-based permissions should control:

- Which patients can be viewed
- Which reports can be accessed
- Which records can be edited
- Which reports can be released
- Which administrative functions can be changed

## Audit Logging

Record important actions:

```text
User
Action
Resource
Date / Time
Result
```

Examples:

- Doctor viewed patient
- Doctor edited summary
- Doctor released report
- Admin modified configuration
- Patient submitted history

## Kiosk Security

The kiosk should:

- Use session timeout
- Clear temporary information
- Prevent previous-patient information from appearing
- Use secure communication
- Restrict unauthorized device access

---

# 54. Accessibility

The interface should be designed for first-time users.

Recommended design:

- Large buttons
- High readability
- Clear icons
- Minimal text where possible
- Audio instructions
- Voice interaction
- Touch interaction
- Progress indicator
- Confirmation before submission
- Local-language guidance

Example:

```text
STEP 2 OF 5

How are you feeling today?

🎤 Speak

OR

[Chest Pain]
[Breathing Problem]
[Fever]
[Other]
```

---

# 55. Patient Interface Screen List

1. Welcome / Splash
2. Patient Identification
3. Language Selection
4. Consent
5. Patient Dashboard
6. Clinical History
7. Voice Interaction
8. Adaptive Questions
9. Red-Flag Status
10. Document Scanner
11. OCR Processing
12. Extracted Information
13. Medical Timeline
14. AI Clinical Summary
15. Patient Review
16. Submission
17. Health Records
18. Admissions
19. Investigation Reports
20. Prescriptions
21. Vitals
22. Released Reports
23. Notifications
24. Profile
25. Settings

---

# 56. Doctor Interface Screen List

1. Doctor Login
2. Dashboard
3. Patient Queue
4. Patient Overview
5. Clinical History
6. AI Clinical Summary
7. Medical Documents
8. OCR Results
9. Investigation Reports
10. Medical Timeline
11. Vitals
12. Report Review
13. Report Visibility
14. Clinical Assessment
15. Prescription
16. Consultation Confirmation

---

# 57. Admin Interface Screen List

1. Admin Login
2. Hospital Dashboard
3. Department Monitoring
4. Patient Monitoring
5. Doctor Management
6. Report Management
7. Government Scheme Management
8. Insurance/Coverage
9. Kiosk Management
10. Analytics
11. Notifications
12. System Settings
13. Audit / Activity Logs

---

# 58. Real-Time Example

Consider a patient arriving at a government hospital OPD.

### Stage 1 — Identify

The patient verifies their identity.

### Stage 2 — Consent

The system provides an understandable explanation and obtains the required consent.

### Stage 3 — Clinical History

The patient speaks or taps answers.

### Stage 4 — Adaptive Questions

The system asks relevant follow-up questions.

### Stage 5 — Red-Flag Screening

Potentially urgent information is routed to authorized hospital staff.

### Stage 6 — Scan Documents

The patient scans previous reports.

### Stage 7 — OCR

The system extracts available information.

### Stage 8 — Timeline

The system organizes historical events.

### Stage 9 — AI Summary

A physician-ready draft is generated.

### Stage 10 — Doctor Queue

The doctor receives the patient information through the real-time dashboard.

### Stage 11 — Doctor Review

The doctor reviews and corrects the AI-generated information.

### Stage 12 — Consultation

The doctor examines the patient and performs the clinical consultation.

### Stage 13 — Assessment

The doctor records the clinical assessment.

### Stage 14 — Prescription

The doctor creates and confirms the prescription.

### Stage 15 — Report Visibility

The doctor decides whether individual patient-uploaded reports are released.

### Stage 16 — Patient Update

The patient's authorized health record is updated in real time.

---

# 59. Testing Strategy

## Functional Testing

Test:

- Patient identification
- Login
- Consent
- Language selection
- Voice interaction
- Touch interaction
- Adaptive questions
- Document scanning
- OCR
- Medical extraction
- Timeline
- AI summary
- Doctor review
- Consultation
- Prescription
- Report release
- Patient visibility
- Admin monitoring

## Realtime Testing

Verify:

```text
Patient submits
      ↓
Doctor receives

Patient uploads report
      ↓
Doctor receives

Doctor releases report
      ↓
Patient sees released report

Doctor completes consultation
      ↓
Patient record updates
```

## Security Testing

Test:

- Unauthorized access
- Role escalation
- Patient-to-patient data leakage
- Kiosk session leakage
- Report visibility enforcement
- Authentication failures
- Audit logging

## OCR Testing

Test:

- Printed reports
- Handwritten reports
- Low-quality images
- Different document layouts
- Multiple languages
- Medical abbreviations

## Usability Testing

Test with:

- Elderly users
- Low-literacy users
- First-time users
- Different language users
- Users with limited digital experience

---

# 60. Deployment Architecture

A government-hospital deployment can use:

```text
Patient Kiosks
       │
       ↓
Hospital Network
       │
       ↓
Application Backend
       │
 ┌─────┼──────────────┐
 ↓     ↓              ↓
DB    AI/OCR       Realtime
 │     │              │
 └─────┼──────────────┘
       ↓
 ┌─────┴─────────┐
 ↓               ↓
Doctor         Admin
Portal         Portal
```

Production deployment should include:

- Secure network configuration
- Backup strategy
- Monitoring
- Device management
- Authentication
- Data recovery
- Disaster recovery
- Logging
- Secure updates

---

# 61. Production Readiness Considerations

MediKiosk should be treated as a healthcare system rather than only a UI prototype.

Before real hospital deployment, the following should be validated:

### Clinical Validation

- History questionnaire
- Adaptive question logic
- Red-flag rules
- Summary format
- OCR extraction
- AYUSH workflow

### Technical Validation

- API reliability
- Realtime performance
- OCR performance
- ASR performance
- Database reliability
- Backup/recovery
- Device reliability

### Security Validation

- Authentication
- Authorization
- Encryption
- Session management
- Audit logging
- Vulnerability testing

### Hospital Validation

- OPD workflow
- Doctor workflow
- Triage workflow
- Kiosk placement
- Staff training
- Emergency escalation
- Hospital Information System integration

---

# 62. Project Benefits

## Patients

- Easier history submission
- Voice/touch interaction
- Local-language guidance
- Reduced repetitive questioning
- Organized health information
- Access to doctor-released reports
- Better visibility of prescriptions and investigations

## Doctors

- Structured pre-consultation history
- Consolidated medical documents
- Medical timeline
- AI-assisted summary
- Faster access to relevant information
- Human-controlled report review

## Hospital

- More structured intake
- Better operational visibility
- Real-time workflow
- Kiosk-based self-service
- Digital document processing
- Centralized information flow

## Admin

- Department monitoring
- Patient-volume monitoring
- Doctor monitoring
- Kiosk monitoring
- Report workflow monitoring
- Scheme and coverage information
- Analytics
- Audit visibility

---

# 63. What Makes MediKiosk Different

A conventional registration workflow:

```text
Patient
   ↓
Demographics
   ↓
Token / Registration
```

A generic document scanner:

```text
Document
   ↓
Image / PDF
```

MediKiosk:

```text
Patient
   ↓
Identify
   ↓
Consent
   ↓
Voice / Touch History
   ↓
Adaptive Questions
   ↓
Red-Flag Screening
   ↓
Document Scanning
   ↓
OCR
   ↓
Medical Information Extraction
   ↓
Medical Timeline
   ↓
AI Clinical Summary
   ↓
Doctor Review
   ↓
Clinical Consultation
   ↓
Clinical Assessment
   ↓
Prescription
   ↓
Doctor-Controlled Report Release
   ↓
Patient Health Record
   ↓
Real-Time Hospital Monitoring
```

This is the central differentiation of the project.

---

# 64. Key Design Principle

MediKiosk follows this principle:

```text
PATIENT PROVIDES
        ↓
AI STRUCTURES
        ↓
DOCTOR REVIEWS
        ↓
DOCTOR DECIDES
        ↓
AUTHORIZED INFORMATION IS SHARED
```

The AI is an assistant to the clinical workflow, not the final clinical authority.

---

# 65. Limitations and Responsible Use

The following limitations should be explicitly acknowledged:

- Speech recognition can be affected by noise and accents.
- OCR can make errors, particularly with handwritten documents.
- Medical terminology may be ambiguous.
- AI-generated summaries can contain errors or omissions.
- Red-flag detection can miss or incorrectly flag information.
- External health-record integration depends on hospital and platform APIs.
- ABHA/ABDM connectivity requires authorized implementation.
- Production clinical use requires clinical validation and governance.

Therefore:

> AI-generated content must be reviewed by qualified healthcare professionals before it is used for clinical decision-making.

---

# 66. Future Scope

Potential future enhancements include:

1. Wider Indian-language support
2. Better regional-accent recognition
3. Improved noisy-environment ASR
4. Improved handwritten medical OCR
5. Medical terminology normalization
6. Hospital Information System integration
7. Authorized ABDM/ABHA integration
8. FHIR-based interoperability
9. Offline/low-connectivity kiosk capability
10. Advanced accessibility support
11. Hospital-level analytics
12. Improved clinical workflow configuration
13. Multi-hospital deployment
14. Advanced audit and governance
15. Integration with approved medical devices

---

# 67. Final System Architecture

```text
                              MEDIKIOSK
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
                 ↓                ↓                ↓
               ADMIN            PATIENT          DOCTOR
                 │                │                │
                 ↓                ↓                ↓
           Admin Portal      Patient Portal    Doctor Portal
                 │                │                │
                 │            Identify             │
                 │                ↓                │
                 │             Consent             │
                 │                ↓                │
                 │        Language Selection       │
                 │                ↓                │
                 │       Voice / Touch History     │
                 │                ↓                │
                 │        Adaptive Questions       │
                 │                ↓                │
                 │         Red-Flag Screening      │
                 │                ↓                │
                 │        Document Scanning        │
                 │                ↓                │
                 │            OCR + AI              │
                 │                ↓                │
                 │       Medical Extraction        │
                 │                ↓                │
                 │        Medical Timeline ───────→│
                 │                ↓                │
                 │         AI Summary ────────────→│
                 │                                 ↓
                 │                           Doctor Review
                 │                                 ↓
                 │                            Consultation
                 │                                 ↓
                 │                         Clinical Assessment
                 │                                 ↓
                 │                            Prescription
                 │                                 ↓
                 │                          Record Updated
                 │                                 ↓
                 │                         Patient Portal
                 │                                 ↓
                 │                      Released Information
                 │
                 ├── Departments
                 ├── Patients
                 ├── Doctors
                 ├── Reports
                 ├── Government Schemes
                 ├── Coverage
                 ├── Kiosks
                 ├── Analytics
                 └── Audit
```

---

# 68. Final End-to-End Flow

```text
                 MEDIKIOSK

                   PATIENT
                      │
                      ↓
                 IDENTIFY
                      │
                      ↓
                  CONSENT
                      │
                      ↓
              SELECT LANGUAGE
                      │
                      ↓
             VOICE / TOUCH HISTORY
                      │
                      ↓
             ADAPTIVE QUESTIONING
                      │
                      ↓
              RED-FLAG SCREENING
                      │
                      ↓
              SCAN MEDICAL REPORTS
                      │
                      ↓
                  OCR + AI
                      │
                      ↓
          MEDICAL INFORMATION EXTRACTION
                      │
                      ↓
              MEDICAL TIMELINE
                      │
                      ↓
             AI CLINICAL SUMMARY
                      │
                      ↓
              PATIENT REVIEW
                      │
                      ↓
                 SUBMISSION
                      │
                      ↓
              REAL-TIME BACKEND
                      │
                      ↓
                DOCTOR QUEUE
                      │
                      ↓
               DOCTOR REVIEW
                      │
             ┌────────┴────────┐
             ↓                 ↓
        REPORT REVIEW      AI SUMMARY REVIEW
             │                 │
             └────────┬────────┘
                      ↓
                 CONSULTATION
                      ↓
             CLINICAL ASSESSMENT
                      ↓
                 PRESCRIPTION
                      ↓
            DOCTOR CONFIRMS RECORD
                      ↓
              REPORT VISIBILITY
                 ┌────┴────┐
                 ↓         ↓
             RELEASED    PRIVATE
                 ↓
          PATIENT CAN VIEW
                 ↓
          HEALTH RECORD UPDATED
                 ↓
           ADMIN DASHBOARD
                 ↓
       REAL-TIME HOSPITAL MONITORING
```

---

# 69. Final Project Statement

**MediKiosk is an AI-powered first-mile clinical intake platform for Indian government hospitals that helps patients provide structured medical history through voice and touch, digitize previous medical documents, organize information chronologically, and generate a physician-ready clinical summary before consultation.**

The platform connects:

```text
PATIENT
   ↓
AI-ASSISTED INTAKE
   ↓
MEDICAL DOCUMENT INTELLIGENCE
   ↓
STRUCTURED CLINICAL SUMMARY
   ↓
DOCTOR REVIEW
   ↓
CONSULTATION
   ↓
CLINICAL ASSESSMENT
   ↓
PRESCRIPTION
   ↓
DOCTOR-CONTROLLED REPORT RELEASE
   ↓
PATIENT HEALTH RECORD
   ↓
REAL-TIME HOSPITAL OPERATIONS
   ↓
ADMIN
```

**Core principle:**

> **Identify → Converse → Scan → Summarize → Route → Review → Consult → Record**

MediKiosk is intended to reduce the first-mile clinical information bottleneck while improving accessibility and organization of patient-provided information, without replacing qualified healthcare professionals.

---

## Project Documentation Status

This README combines the **original MediKiosk problem statement and expected solution description** with the finalized three-role hospital workflow, patient interface requirements, doctor-controlled report visibility, real-time hospital operation, and implementation architecture.

For production deployment, all clinical, security, privacy, OCR, speech, interoperability, and hospital-workflow components must undergo appropriate validation before being used with real patients.
