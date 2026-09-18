import { db } from '../../db/db.js';
import { Doctor, Hospital } from '../../types/index.js';

const SPECIALTY_RULES: Array<{ keywords: string[]; specialty: string }> = [
  { keywords: ['headache', 'migraine', 'neurolog', 'seizure', 'stroke'], specialty: 'Neurology' },
  { keywords: ['chest', 'cardiac', 'heart', 'cholesterol', 'hypertension', 'blood pressure'], specialty: 'Cardiology' },
  { keywords: ['glucose', 'diabetes', 'a1c', 'thyroid', 'vitamin d', 'metabolism'], specialty: 'Endocrinology' },
  { keywords: ['back pain', 'orthopedic', 'joint', 'bone', 'muscle', 'strain'], specialty: 'Orthopedics' },
  { keywords: ['rash', 'skin', 'dermat'], specialty: 'Dermatology' },
  { keywords: ['cough', 'fever', 'fatigue', 'viral', 'infection', 'nausea'], specialty: 'Internal Medicine' }
];

function getSpecialties(conditions: string[], flaggedTests: string[]): string[] {
  const text = [...conditions, ...flaggedTests].join(' ').toLowerCase();
  const specialties = SPECIALTY_RULES
    .filter(rule => rule.keywords.some(keyword => text.includes(keyword)))
    .map(rule => rule.specialty);

  return specialties.length > 0 ? [...new Set(specialties)] : ['Internal Medicine'];
}

function matchesSpecialty(doctor: Doctor, specialty: string): boolean {
  return doctor.specialty.toLowerCase().includes(specialty.toLowerCase());
}

function matchesHospital(hospital: Hospital, specialty: string): boolean {
  return hospital.specialties.some(item => item.toLowerCase().includes(specialty.toLowerCase()));
}

export function getCareRecommendations(input: {
  conditions?: string[];
  flaggedTests?: string[];
  city?: string;
  urgent?: boolean;
}) {
  const conditions = input.conditions || [];
  const flaggedTests = input.flaggedTests || [];
  const specialties = getSpecialties(conditions, flaggedTests);
  const doctors = db.searchDoctors({ city: input.city });
  const hospitals = db.searchHospitals({
    city: input.city,
    emergency_only: input.urgent === true
  });

  const recommendedDoctors = doctors
    .filter(doctor => specialties.some(specialty => matchesSpecialty(doctor, specialty)))
    .slice(0, 6);
  const recommendedHospitals = hospitals
    .filter(hospital => input.urgent || specialties.some(specialty => matchesHospital(hospital, specialty)))
    .slice(0, 6);

  return {
    educational_notice: 'These are directory matches based on reported symptoms or report markers, not a diagnosis or endorsement.',
    specialties,
    doctors: recommendedDoctors,
    hospitals: recommendedHospitals,
    ranked_by: 'Doctor and hospital rating first, then experience or distance.'
  };
}