-- MedScan AI Relational Schema
-- Compatible with PostgreSQL, Supabase, and SQLite

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'patient' CHECK (role IN ('patient', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
    user_id VARCHAR(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    age INT,
    gender VARCHAR(50),
    blood_group VARCHAR(10),
    allergies JSONB DEFAULT '[]',
    existing_conditions JSONB DEFAULT '[]',
    medications JSONB DEFAULT '[]',
    emergency_contact JSONB,
    privacy_settings JSONB DEFAULT '{"share_with_research": false, "store_history": true}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS symptom_assessments (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    symptoms JSONB NOT NULL,
    context JSONB NOT NULL,
    symptom_summary TEXT NOT NULL,
    urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('routine', 'consult', 'urgent')),
    red_flags_detected JSONB DEFAULT '[]',
    possible_conditions JSONB NOT NULL,
    recommendations JSONB DEFAULT '[]',
    disclaimer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_health_reports (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    energy_level INT CHECK (energy_level BETWEEN 1 AND 5),
    sleep_hours NUMERIC(4, 1),
    sleep_quality VARCHAR(50),
    water_intake_liters NUMERIC(4, 2),
    exercise_minutes INT,
    mood VARCHAR(50),
    symptoms_reported JSONB DEFAULT '[]',
    vitals JSONB,
    ai_summary TEXT,
    ai_changes JSONB DEFAULT '[]',
    ai_recommendations JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lab_reports (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    lab_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    report_date DATE NOT NULL,
    file_name VARCHAR(255),
    file_url VARCHAR(255),
    ocr_confidence NUMERIC(5, 2) DEFAULT 95.0,
    is_low_confidence BOOLEAN DEFAULT FALSE,
    overall_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lab_results (
    id VARCHAR(36) PRIMARY KEY,
    lab_report_id VARCHAR(36) REFERENCES lab_reports(id) ON DELETE CASCADE,
    test_name VARCHAR(100) NOT NULL,
    result_value VARCHAR(50) NOT NULL,
    unit VARCHAR(50),
    reference_range VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('within_range', 'review')),
    test_explanation TEXT NOT NULL,
    general_interpretation TEXT NOT NULL,
    possible_reasons JSONB DEFAULT '[]',
    suggested_next_step TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    qualifications VARCHAR(255) NOT NULL,
    experience_years INT NOT NULL,
    hospital_affiliation VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    consultation_types JSONB NOT NULL,
    languages JSONB NOT NULL,
    available_hours VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    image_url TEXT
);

CREATE TABLE IF NOT EXISTS hospitals (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    hospital_type VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    distance_km NUMERIC(5, 2),
    emergency_services BOOLEAN DEFAULT FALSE,
    trauma_level VARCHAR(50),
    specialties JSONB NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    emergency_phone VARCHAR(50) NOT NULL,
    website VARCHAR(255),
    directions_url TEXT
);

CREATE TABLE IF NOT EXISTS diagnostic_labs (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    available_tests JSONB NOT NULL,
    home_sample_collection BOOLEAN DEFAULT FALSE,
    accreditations JSONB NOT NULL,
    operating_hours VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    booking_url VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS health_timeline (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    reference_id VARCHAR(36),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_conversations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    messages JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
