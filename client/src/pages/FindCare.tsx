import React, { useState, useEffect } from 'react';
import { 
  MapPin, Stethoscope, Building2, Microscope, 
  Search, Phone, Globe, Navigation, Clock, ShieldCheck, 
  AlertTriangle, Filter, CheckCircle2, Video, UserCheck, X, Calendar, Clock3
} from 'lucide-react';
import { api } from '../api/client.js';
import { Appointment, Doctor, Hospital, DiagnosticLab } from '../types.js';

export const FindCare: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'doctors' | 'hospitals' | 'labs'>('doctors');
  
  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [consultType, setConsultType] = useState<string>('all');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [homeCollectionOnly, setHomeCollectionOnly] = useState(false);

  // Results
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [labs, setLabs] = useState<DiagnosticLab[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<{ date: string; time: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Appointment Inquiry Modal
  const [bookingModal, setBookingModal] = useState<{
    isOpen: boolean;
    providerName: string;
    providerType: string;
    providerId: string;
  }>({
    isOpen: false,
    providerName: '',
    providerType: '',
    providerId: ''
  });
  const [bookingPatientName, setBookingPatientName] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetchCareData();
  }, [activeCategory, selectedCity, selectedSpecialty, consultType, emergencyOnly, homeCollectionOnly]);

  useEffect(() => {
    api.getAppointments().then((res) => setAppointments(res.appointments || [])).catch(() => setAppointments([]));
  }, []);

  const fetchCareData = async () => {
    setLoading(true);
    try {
      if (activeCategory === 'doctors') {
        const res = await api.searchDoctors({
          search: searchQuery || undefined,
          city: selectedCity !== 'All' ? selectedCity : undefined,
          specialty: selectedSpecialty !== 'All' ? selectedSpecialty : undefined,
          consultation_type: consultType !== 'all' ? consultType : undefined
        });
        setDoctors(res.doctors || []);
      } else if (activeCategory === 'hospitals') {
        const res = await api.searchHospitals({
          search: searchQuery || undefined,
          city: selectedCity !== 'All' ? selectedCity : undefined,
          emergency_only: emergencyOnly || undefined,
          specialty: selectedSpecialty !== 'All' ? selectedSpecialty : undefined
        });
        setHospitals(res.hospitals || []);
      } else {
        const res = await api.searchLabs({
          search: searchQuery || undefined,
          city: selectedCity !== 'All' ? selectedCity : undefined,
          home_collection_only: homeCollectionOnly || undefined
        });
        setLabs(res.labs || []);
      }
    } catch (err) {
      console.error('Failed to fetch healthcare directory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCareData();
  };

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setSelectedCity('Metropolis');
          fetchCareData();
        },
        () => {
          alert('Location access denied or unavailable. Please choose your city manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser. Please search manually.');
    }
  };

  const handleOpenBooking = async (provider: { id: string; name: string }, type: string) => {
    setBookingModal({
      isOpen: true,
      providerId: provider.id,
      providerName: provider.name,
      providerType: type
    });
    setBookingSuccess(false);
    setBookingDate('');
    setBookingTime('');
    if (type === 'Doctor Consultation') {
      try {
        const res = await api.getDoctorAvailability(provider.id);
        setAvailableSlots(res.slots || []);
      } catch {
        setAvailableSlots([]);
      }
    } else {
      setAvailableSlots([]);
    }
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.requestAppointment({
        provider_id: bookingModal.providerId,
        provider_type: bookingModal.providerType,
        patient_name: bookingPatientName || 'Demo Patient',
        preferred_date: bookingDate || new Date().toISOString().split('T')[0],
        time: bookingTime || '09:00'
      });
      setBookingSuccess(true);
      const res = await api.getAppointments();
      setAppointments(res.appointments || []);
      setTimeout(() => {
        setBookingModal({ isOpen: false, providerName: '', providerType: '', providerId: '' });
      }, 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Healthcare Discovery Directory</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Factual matching of doctors, emergency hospitals, and diagnostic labs based on your criteria.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveCategory('doctors')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeCategory === 'doctors' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctors</span>
          </button>
          <button
            onClick={() => setActiveCategory('hospitals')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeCategory === 'hospitals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Hospitals</span>
          </button>
          <button
            onClick={() => setActiveCategory('labs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeCategory === 'labs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Microscope className="w-3.5 h-3.5" />
            <span>Diagnostic Labs</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeCategory} by name, specialty, or keywords...`}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
          >
            <Navigation className="w-3.5 h-3.5 text-slate-600" />
            <span>Nearby Location</span>
          </button>

          <button
            type="submit"
            className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition"
          >
            Search
          </button>
        </form>

        {/* Secondary Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">City:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
            >
              <option value="All">All Locations</option>
              <option value="Metropolis">Metropolis</option>
            </select>
          </div>

          {activeCategory === 'doctors' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Specialty:</span>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
                >
                  <option value="All">All Specialties</option>
                  <option value="Internal Medicine">Internal Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Consult Type:</span>
                <select
                  value={consultType}
                  onChange={(e) => setConsultType(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="in_person">In-Person Only</option>
                  <option value="telehealth">Telehealth / Video</option>
                </select>
              </div>
            </>
          )}

          {activeCategory === 'hospitals' && (
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={emergencyOnly}
                onChange={(e) => setEmergencyOnly(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
              />
              <span>24/7 Verified Emergency Department Only</span>
            </label>
          )}

          {activeCategory === 'labs' && (
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={homeCollectionOnly}
                onChange={(e) => setHomeCollectionOnly(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
              />
              <span>Home Sample Collection Available</span>
            </label>
          )}
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-600 flex items-center justify-between border border-slate-200">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            {activeCategory === 'doctors' && "Factual matching based on selected criteria. MedScan AI does not rank or certify physicians."}
            {activeCategory === 'hospitals' && "Emergency room availability can fluctuate. Call ahead directly in an urgent scenario."}
            {activeCategory === 'labs' && "Diagnostic pricing and test panel availability may vary. Confirm directly with the laboratory."}
          </span>
        </div>
      </div>

      <section className="bg-slate-900 rounded-2xl p-5 text-white shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-brand-200 font-bold">Your care plan</p>
            <h2 className="text-lg font-bold">Upcoming appointments</h2>
          </div>
          <Calendar className="w-5 h-5 text-brand-200" />
        </div>
        {appointments.length === 0 ? (
          <p className="text-xs text-slate-300">No appointments yet. Choose a nearby doctor below to reserve a time.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {appointments.slice(0, 4).map((appointment) => (
              <div key={appointment.id} className="bg-white/10 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{appointment.provider_name}</p>
                  <p className="text-[11px] text-slate-300">{appointment.specialty || appointment.provider_type}</p>
                </div>
                <div className="text-right text-xs text-brand-100 whitespace-nowrap">
                  <p>{appointment.date}</p>
                  <p>{appointment.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* RESULTS LISTING */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Searching healthcare directory...</div>
      ) : (
        <div className="space-y-4">
          
          {/* DOCTORS CARDS */}
          {activeCategory === 'doctors' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map((doc) => (
                <div key={doc.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3.5">
                      <img
                        src={doc.image_url}
                        alt={doc.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
                      />
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-900 text-base">{doc.name}</h3>
                        <span className="inline-block text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                          {doc.specialty}
                        </span>
                        <p className="text-[11px] text-slate-500">{doc.qualifications}</p>
                        <p className="text-[11px] font-semibold text-emerald-700">Approx. {doc.distance_km ?? '—'} km away</p>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <p><strong>Hospital / Clinic:</strong> {doc.hospital_affiliation}</p>
                      <p><strong>Location:</strong> {doc.location}, {doc.city} ({doc.postal_code})</p>
                      <p><strong>Experience:</strong> {doc.experience_years} years in practice</p>
                      <p><strong>Languages:</strong> {doc.languages.join(', ')}</p>
                      <p><strong>Hours:</strong> {doc.available_hours}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {doc.consultation_types.includes('telehealth') && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                          <Video className="w-3 h-3" /> Telehealth Available
                        </span>
                      )}
                      {doc.consultation_types.includes('in_person') && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          In-Person Clinic
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <a
                      href={`tel:${doc.contact_phone}`}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{doc.contact_phone}</span>
                    </a>
                    <button
                      onClick={() => handleOpenBooking(doc, 'Doctor Consultation')}
                      className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg transition"
                    >
                      Request Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* HOSPITALS CARDS */}
          {activeCategory === 'hospitals' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hospitals.map((hosp) => (
                <div key={hosp.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{hosp.name}</h3>
                        <p className="text-xs text-slate-500">{hosp.hospital_type}</p>
                      </div>
                      {hosp.emergency_services ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-full shrink-0">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> 24/7 ER VERIFIED
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded shrink-0">
                          Non-Emergency / Elective
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 pt-1">
                      <p><strong>Address:</strong> {hosp.address}, {hosp.city}</p>
                      <p><strong>Distance:</strong> Approx. {hosp.distance_km} km away</p>
                      {hosp.trauma_level && <p><strong>Trauma Rating:</strong> {hosp.trauma_level}</p>}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 block">Key Clinical Specialties:</span>
                      <div className="flex flex-wrap gap-1">
                        {hosp.specialties.map((spec, idx) => (
                          <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <a href={`tel:${hosp.contact_phone}`} className="text-xs font-semibold text-slate-700 block hover:underline">
                        Tel: {hosp.contact_phone}
                      </a>
                      {hosp.emergency_phone && (
                        <a href={`tel:${hosp.emergency_phone}`} className="text-xs font-bold text-rose-700 block hover:underline">
                          ER Direct: {hosp.emergency_phone}
                        </a>
                      )}
                    </div>
                    <a
                      href={hosp.directions_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Directions</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DIAGNOSTIC LABS CARDS */}
          {activeCategory === 'labs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {labs.map((lab) => (
                <div key={lab.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{lab.name}</h3>
                        <p className="text-xs text-slate-500">{lab.address}, {lab.city}</p>
                      </div>
                      {lab.home_sample_collection && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Home Sample Collection
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <p><strong>Operating Hours:</strong> {lab.operating_hours}</p>
                      <p><strong>Accreditations:</strong> {lab.accreditations.join(' • ')}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 block">Available Test Panels:</span>
                      <div className="flex flex-wrap gap-1">
                        {lab.available_tests.map((test, idx) => (
                          <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded">
                            {test}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <a href={`tel:${lab.contact_phone}`} className="text-xs font-semibold text-slate-700 hover:underline">
                      {lab.contact_phone}
                    </a>
                    <button
                      onClick={() => handleOpenBooking(lab, 'Laboratory Test Slot')}
                      className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg transition"
                    >
                      {lab.home_sample_collection ? 'Request Home Collection' : 'Book Lab Slot'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Inquiry Modal */}
      {bookingModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Schedule with Provider</h3>
                <p className="text-xs text-slate-500">{bookingModal.providerName}</p>
              </div>
              <button
                onClick={() => setBookingModal({ isOpen: false, providerName: '', providerType: '', providerId: '' })}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-sm">Inquiry Received</h4>
                <p className="text-xs text-emerald-700">
                  Your request has been forwarded to {bookingModal.providerName}. The office reception will call to confirm scheduling.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    required
                    value={bookingPatientName}
                    onChange={(e) => setBookingPatientName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Available appointment</label>
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={`${slot.date}-${slot.time}`}
                          type="button"
                          onClick={() => { setBookingDate(slot.date); setBookingTime(slot.time); }}
                          className={`px-2 py-2 rounded-lg border text-left ${bookingDate === slot.date && bookingTime === slot.time ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-200 bg-white text-slate-700'}`}
                        >
                          <span className="block font-semibold">{slot.date}</span>
                          <span className="flex items-center gap-1 text-[11px] mt-0.5"><Clock3 className="w-3 h-3" /> {slot.time}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  )}
                </div>

                <div className="p-3 rounded-lg bg-slate-50 text-slate-600 text-[11px] border border-slate-200">
                  Demo scheduling data is for planning only. Confirm the appointment with the clinic before traveling.
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingModal({ isOpen: false, providerName: '', providerType: '', providerId: '' })}
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={availableSlots.length > 0 && !bookingDate}
                    className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold"
                  >
                    Confirm Appointment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
