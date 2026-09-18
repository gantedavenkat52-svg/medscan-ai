export type Role = 'patient' | 'admin';
export type UrgencyLevel = 'routine' | 'consult' | 'urgent';

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
  isDemo?: boolean;
}

export interface Profile {
  user_id: string;
  name: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;
  blood_group?: string;
  allergies?: string[];
  existing_conditions?: string[];
  medications?: string[];
  emergency_contact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  privacy_settings?: {
    share_with_research: boolean;
    store_history: boolean;
  };
  updated_at: string;
}

export interface PossibleCondition {
  condition_name: string;
  simple_explanation: string;
  why_associated: string;
  common_additional_symptoms: string[];
  when_to_seek_care: string;
}

export interface SymptomAssessment {
  id: string;
  user_id: string;
  symptoms: string[];
  context: {
    age_range?: string;
    duration?: string;
    severity?: number;
    onset?: string;
    existing_conditions?: string[];
    medications?: string[];
  };
  symptom_summary: string;
  urgency: UrgencyLevel;
  red_flags_detected: string[];
  possible_conditions: PossibleCondition[];
  recommendations: string[];
  disclaimer: string;
  created_at: string;
}

export interface DailyHealthReport {
  id: string;
  user_id: string;
  date: string;
  energy_level: number;
  sleep_hours: number;
  sleep_quality: string;
  water_intake_liters: number;
  exercise_minutes: number;
  mood: string;
  symptoms_reported: string[];
  vitals?: {
    temperature_f?: number;
    bp_systolic?: number;
    bp_diastolic?: number;
    blood_glucose_mgdl?: number;
    resting_heart_rate?: number;
  };
  ai_summary: string;
  ai_changes: string[];
  ai_recommendations: string[];
  created_at: string;
}

export interface LabResult {
  id: string;
  lab_report_id: string;
  test_name: string;
  result_value: string | number;
  unit: string;
  reference_range: string;
  status: 'within_range' | 'review';
  test_explanation: string;
  general_interpretation: string;
  possible_reasons: string[];
  suggested_next_step: string;
}

export interface LabReport {
  id: string;
  user_id: string;
  lab_name: string;
  report_type: string;
  report_date: string;
  file_name?: string;
  file_url?: string;
  ocr_confidence: number;
  is_low_confidence: boolean;
  overall_summary: string;
  results: LabResult[];
  created_at: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  qualifications: string;
  experience_years: number;
  hospital_affiliation: string;
  location: string;
  city: string;
  postal_code: string;
  consultation_types: ('in_person' | 'telehealth')[];
  languages: string[];
  available_hours: string;
  contact_phone: string;
  contact_email: string;
  image_url: string;
  rating: number;
  review_count: number;
  distance_km?: number;
}

export interface Appointment {
  id: string;
  user_id: string;
  provider_id: string;
  provider_name: string;
  provider_type: string;
  specialty?: string;
  date: string;
  time: string;
  patient_name: string;
  status: 'confirmed' | 'requested' | 'cancelled';
  created_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  hospital_type: string;
  address: string;
  city: string;
  postal_code: string;
  distance_km: number;
  emergency_services: boolean;
  trauma_level?: string;
  specialties: string[];
  contact_phone: string;
  emergency_phone: string;
  website: string;
  directions_url: string;
  rating: number;
  review_count: number;
}

export interface DiagnosticLab {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  available_tests: string[];
  home_sample_collection: boolean;
  accreditations: string[];
  operating_hours: string;
  contact_phone: string;
  contact_email: string;
  booking_url: string;
}

export interface TimelineEvent {
  id: string;
  user_id: string;
  event_type: 'symptom' | 'lab_report' | 'daily_report' | 'appointment';
  title: string;
  description: string;
  reference_id?: string;
  date: string;
  created_at: string;
}

export interface AIConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  safety_evaluated?: boolean;
}
