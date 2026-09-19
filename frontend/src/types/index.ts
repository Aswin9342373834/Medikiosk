export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface User {
  id: string;
  _id?: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface Patient {
  _id: string;
  userId: string;
  name: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  abhaId: string;
  uhid?: string;
  bloodGroup?: string;
  contactNumber?: string;
  address?: string;
  preferredLanguage?: string;
  currentStatus: 'Registered' | 'History Collection' | 'Waiting for Doctor' | 'In Consultation' | 'Completed';
  governmentScheme?: {
    schemeName: string;
    applicationStatus: string;
  };
  createdAt?: string;
}

export interface Doctor {
  _id: string;
  userId: string;
  name: string;
  licenseNumber: string;
  department: string;
  specialization: string;
  roomNumber: string;
  isAvailable: boolean;
}

export interface MedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route?: string;
  instructions?: string;
}

export interface ClinicalHistory {
  _id: string;
  patientId: string | Patient;
  userId: string;
  presentingComplaint: string;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  onset?: string;
  duration?: string;
  location?: string;
  character?: string;
  severity?: string;
  aggravatingFactors?: string;
  relievingFactors?: string;
  associatedSymptoms?: string[];
  pastMedicalHistory?: string[];
  pastSurgicalHistory?: string[];
  medications?: MedicationItem[];
  allergies?: string[];
  familyHistory?: string;
  personalHistory?: string;
  socialHistory?: string;
  reviewOfSystems?: string[];
  ayushMode?: boolean;
  ayushData?: {
    prakriti?: string;
    vikriti?: string;
    sara?: string;
    samhanana?: string;
    pramana?: string;
    satmya?: string;
    sattva?: string;
    aharaShakti?: string;
    vyayamaShakti?: string;
    vaya?: string;
    ahara?: string;
    vihara?: string;
    nidana?: string;
    samprapti?: string;
  };
  aiSummary?: string;
  redFlags?: string[];
  doctorAttentionItems?: string[];
  aiStatus?: 'Pending' | 'Completed' | 'Failed' | 'Unavailable';
  doctorReviewStatus?: 'Pending' | 'Accepted' | 'Edited' | 'Rejected';
  doctorNotes?: string;
  status: 'Not Started' | 'In Progress' | 'Submitted' | 'Doctor Reviewed' | 'Confirmed';
  consentGiven?: boolean;
  consentTimestamp?: string;
  createdAt?: string;
}

export interface MedicalDocument {
  _id: string;
  patientId: string;
  userId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  uploadedAt: string;
  documentType: 'Prescription' | 'Lab Report' | 'Discharge Summary' | 'Imaging Report' | 'Other';
  ocrStatus: 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Provider Not Configured';
  ocrProvider?: string;
  ocrText?: string;
  aiStatus: 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Skipped';
  extractedData?: {
    diagnoses?: string[];
    medications?: MedicationItem[];
    investigations?: {
      test: string;
      result: string;
      value?: string;
      unit?: string;
      referenceRange?: string;
      date?: string;
    }[];
    procedures?: string[];
    hospital?: string;
    doctor?: string;
  };
  reviewStatus: 'Pending' | 'Reviewed' | 'Rejected';
  visibility: 'Private' | 'Released';
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface PrescriptionItem {
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  route?: string;
  instructions?: string;
}

export interface Prescription {
  _id: string;
  consultationId?: string;
  patientId: string;
  doctorId: string;
  items: PrescriptionItem[];
  followUp?: string;
  generalAdvice?: string;
  date: string;
  status: string;
}

export interface Consultation {
  _id: string;
  patientId: string;
  doctorId: string;
  department: string;
  clinicalAssessment?: string;
  clinicalImpression?: string;
  diagnosis?: string;
  doctorNotes?: string;
  treatmentPlan?: string;
  followUpInstructions?: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
  consultationDate: string;
  completedAt?: string;
}

export interface Notification {
  _id: string;
  userId?: string;
  recipientRole?: string;
  title: string;
  message: string;
  type: 'Info' | 'Warning' | 'Critical' | 'RedFlag';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  timestamp: string;
  userId: string;
  role: string;
  action: string;
  resource: string;
  resourceId?: string;
  result: 'Success' | 'Failure';
  details?: string;
}

export interface HospitalDepartment {
  _id: string;
  name: string;
  code: string;
  clinicalMode?: 'MEDICAL' | 'AYUSH';
  roomNumber?: string;
  headOfDepartment?: string;
  activeDoctors: number;
  waitingCount: number;
  totalPatientsToday: number;
}

export interface OpdVisit {
  _id: string;
  patientId: string | Patient;
  userId: string;
  departmentId: string | HospitalDepartment;
  departmentName: string;
  doctorId?: string;
  clinicalMode: 'MEDICAL' | 'AYUSH';
  preferredLanguage?: string;
  tokenNumber: string;
  opNumber: string;
  status: string;
  visitType?: string;
  opdType?: string;
  hospital?: string;
  queueNumber?: number;
  registeredAt?: string;
  createdAt?: string;
  department?: {
    name?: string;
    code?: string;
    roomNumber?: string;
    clinicalMode?: 'MEDICAL' | 'AYUSH';
  };
}

export interface KioskDevice {
  _id: string;
  kioskId: string;
  location: string;
  department: string;
  status: 'Online' | 'Offline' | 'Maintenance';
  ipAddress: string;
  lastPing: string;
}
