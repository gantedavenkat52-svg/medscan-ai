import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  User, Profile, SymptomAssessment, DailyHealthReport,
  LabReport, LabResult, Doctor, Hospital, DiagnosticLab,
  TimelineEvent, AIConversation, Appointment
} from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'medscan_db.json');

export interface DatabaseSchema {
  users: User[];
  profiles: Profile[];
  symptomAssessments: SymptomAssessment[];
  dailyHealthReports: DailyHealthReport[];
  labReports: LabReport[];
  labResults: LabResult[];
  doctors: Doctor[];
  hospitals: Hospital[];
  diagnosticLabs: DiagnosticLab[];
  timelineEvents: TimelineEvent[];
  aiConversations: AIConversation[];
  appointments: Appointment[];
}

const initialData: DatabaseSchema = {
  users: [],
  profiles: [],
  symptomAssessments: [],
  dailyHealthReports: [],
  labReports: [],
  labResults: [],
  doctors: [],
  hospitals: [],
  diagnosticLabs: [],
  timelineEvents: [],
  aiConversations: [],
  appointments: []
};

class Database {
  private data: DatabaseSchema = { ...initialData };
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const savedData = JSON.parse(fileContent);
        this.data = {
          ...initialData,
          ...savedData,
          appointments: savedData.appointments ?? []
        };
      } else {
        this.save();
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      this.data = { ...initialData };
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to persist database to disk:', error);
    }
  }

  // Raw getter
  public getData(): DatabaseSchema {
    return this.data;
  }

  public resetData(newData: DatabaseSchema) {
    this.data = newData;
    this.save();
  }

  // User methods
  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  // Profile methods
  public getProfile(userId: string): Profile | undefined {
    return this.data.profiles.find(p => p.user_id === userId);
  }

  public upsertProfile(profile: Profile): Profile {
    const index = this.data.profiles.findIndex(p => p.user_id === profile.user_id);
    if (index >= 0) {
      this.data.profiles[index] = { ...this.data.profiles[index], ...profile, updated_at: new Date().toISOString() };
    } else {
      this.data.profiles.push({ ...profile, updated_at: new Date().toISOString() });
    }
    this.save();
    return this.getProfile(profile.user_id)!;
  }

  // Symptoms methods
  public createSymptomAssessment(assessment: SymptomAssessment): SymptomAssessment {
    this.data.symptomAssessments.unshift(assessment);
    this.save();
    return assessment;
  }

  public getSymptomAssessmentsByUser(userId: string): SymptomAssessment[] {
    return this.data.symptomAssessments
      .filter(s => s.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Daily Health Reports
  public createDailyHealthReport(report: DailyHealthReport): DailyHealthReport {
    this.data.dailyHealthReports.unshift(report);
    this.save();
    return report;
  }

  public getDailyHealthReportsByUser(userId: string): DailyHealthReport[] {
    return this.data.dailyHealthReports
      .filter(r => r.user_id === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public getLatestDailyReport(userId: string): DailyHealthReport | undefined {
    const reports = this.getDailyHealthReportsByUser(userId);
    return reports[0];
  }

  // Lab Reports
  public createLabReport(report: LabReport): LabReport {
    this.data.labReports.unshift(report);
    // save child results
    if (report.results && report.results.length > 0) {
      for (const res of report.results) {
        this.data.labResults.push(res);
      }
    }
    this.save();
    return report;
  }

  public getLabReportsByUser(userId: string): LabReport[] {
    return this.data.labReports
      .filter(r => r.user_id === userId)
      .sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime());
  }

  public getLabReportById(id: string): LabReport | undefined {
    return this.data.labReports.find(r => r.id === id);
  }

  // Timeline Events
  public createTimelineEvent(event: TimelineEvent): TimelineEvent {
    this.data.timelineEvents.unshift(event);
    this.save();
    return event;
  }

  public getTimelineByUser(userId: string): TimelineEvent[] {
    return this.data.timelineEvents
      .filter(t => t.user_id === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Care Search: Doctors
  public searchDoctors(query: {
    specialty?: string;
    city?: string;
    consultation_type?: 'in_person' | 'telehealth';
    search?: string;
  }): Doctor[] {
    return this.data.doctors.filter(d => {
      if (query.specialty && query.specialty !== 'All' && !d.specialty.toLowerCase().includes(query.specialty.toLowerCase())) {
        return false;
      }
      if (query.city && query.city !== 'All' && !d.city.toLowerCase().includes(query.city.toLowerCase())) {
        return false;
      }
      if (query.consultation_type && !d.consultation_types.includes(query.consultation_type)) {
        return false;
      }
      if (query.search) {
        const s = query.search.toLowerCase();
        const matches = d.name.toLowerCase().includes(s) ||
          d.specialty.toLowerCase().includes(s) ||
          d.hospital_affiliation.toLowerCase().includes(s) ||
          d.city.toLowerCase().includes(s);
        if (!matches) return false;
      }
      return true;
    }).map((doctor, index) => ({
      ...doctor,
      distance_km: doctor.distance_km ?? Number((1.2 + index * 1.7).toFixed(1))
    })).sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0) || b.rating - a.rating);
  }

  public createAppointment(appointment: Appointment): Appointment {
    this.data.appointments.unshift(appointment);
    this.save();
    return appointment;
  }

  public getAppointmentsByUser(userId: string): Appointment[] {
    return this.data.appointments
      .filter(appointment => appointment.user_id === userId)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }

  public addDoctor(doctor: Doctor): Doctor {
    this.data.doctors.push(doctor);
    this.save();
    return doctor;
  }

  // Care Search: Hospitals
  public searchHospitals(query: {
    city?: string;
    emergency_only?: boolean;
    specialty?: string;
    search?: string;
  }): Hospital[] {
    return this.data.hospitals.filter(h => {
      if (query.city && query.city !== 'All' && !h.city.toLowerCase().includes(query.city.toLowerCase())) {
        return false;
      }
      if (query.emergency_only && !h.emergency_services) {
        return false;
      }
      if (query.specialty && query.specialty !== 'All' && !h.specialties.some(s => s.toLowerCase().includes(query.specialty!.toLowerCase()))) {
        return false;
      }
      if (query.search) {
        const s = query.search.toLowerCase();
        const matches = h.name.toLowerCase().includes(s) ||
          h.city.toLowerCase().includes(s) ||
          h.hospital_type.toLowerCase().includes(s);
        if (!matches) return false;
      }
      return true;
    }).sort((a, b) => b.rating - a.rating || a.distance_km - b.distance_km);
  }

  public addHospital(hospital: Hospital): Hospital {
    this.data.hospitals.push(hospital);
    this.save();
    return hospital;
  }

  // Care Search: Diagnostic Labs
  public searchDiagnosticLabs(query: {
    city?: string;
    home_collection_only?: boolean;
    test?: string;
    search?: string;
  }): DiagnosticLab[] {
    return this.data.diagnosticLabs.filter(l => {
      if (query.city && query.city !== 'All' && !l.city.toLowerCase().includes(query.city.toLowerCase())) {
        return false;
      }
      if (query.home_collection_only && !l.home_sample_collection) {
        return false;
      }
      if (query.test && query.test !== 'All' && !l.available_tests.some(t => t.toLowerCase().includes(query.test!.toLowerCase()))) {
        return false;
      }
      if (query.search) {
        const s = query.search.toLowerCase();
        const matches = l.name.toLowerCase().includes(s) ||
          l.city.toLowerCase().includes(s) ||
          l.address.toLowerCase().includes(s);
        if (!matches) return false;
      }
      return true;
    });
  }

  public addDiagnosticLab(lab: DiagnosticLab): DiagnosticLab {
    this.data.diagnosticLabs.push(lab);
    this.save();
    return lab;
  }

  // AI Conversations
  public getAIConversation(userId: string): AIConversation | undefined {
    return this.data.aiConversations.find(c => c.user_id === userId);
  }

  public saveAIConversation(conversation: AIConversation): AIConversation {
    const idx = this.data.aiConversations.findIndex(c => c.id === conversation.id || c.user_id === conversation.user_id);
    if (idx >= 0) {
      this.data.aiConversations[idx] = { ...conversation, updated_at: new Date().toISOString() };
    } else {
      this.data.aiConversations.push({ ...conversation, updated_at: new Date().toISOString() });
    }
    this.save();
    return conversation;
  }

  // Admin stats
  public getStats() {
    return {
      totalUsers: this.data.users.length,
      totalSymptomChecks: this.data.symptomAssessments.length,
      totalDailyReports: this.data.dailyHealthReports.length,
      totalLabReports: this.data.labReports.length,
      totalDoctors: this.data.doctors.length,
      totalHospitals: this.data.hospitals.length,
      totalDiagnosticLabs: this.data.diagnosticLabs.length,
      totalTimelineEvents: this.data.timelineEvents.length
    };
  }
}

export const db = new Database();
