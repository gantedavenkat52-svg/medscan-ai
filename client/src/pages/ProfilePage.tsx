import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, HeartPulse, LockKeyhole, Save, ShieldCheck, UserRound } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { Profile } from '../types.js';

const splitList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
const joinList = (value?: string[]) => value?.join(', ') || '';

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile, logout } = useAuth();
  const [form, setForm] = useState<Profile | null>(profile);
  const [allergies, setAllergies] = useState(joinList(profile?.allergies));
  const [conditions, setConditions] = useState(joinList(profile?.existing_conditions));
  const [medications, setMedications] = useState(joinList(profile?.medications));
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setForm(profile);
    setAllergies(joinList(profile.allergies));
    setConditions(joinList(profile.existing_conditions));
    setMedications(joinList(profile.medications));
  }, [profile]);

  const updateField = (field: keyof Profile, value: string | number | undefined) => {
    setForm((current) => current ? { ...current, [field]: value } : current);
    setSaved(false);
  };

  const updateEmergency = (field: 'name' | 'relationship' | 'phone', value: string) => {
    setForm((current) => current ? {
      ...current,
      emergency_contact: { name: '', relationship: '', phone: '', ...current.emergency_contact, [field]: value }
    } : current);
    setSaved(false);
  };

  const updatePrivacy = (field: 'share_with_research' | 'store_history', value: boolean) => {
    setForm((current) => current ? {
      ...current,
      privacy_settings: { share_with_research: false, store_history: true, ...current.privacy_settings, [field]: value }
    } : current);
    setSaved(false);
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.updateProfile({
        ...form,
        age: form.age || undefined,
        allergies: splitList(allergies),
        existing_conditions: splitList(conditions),
        medications: splitList(medications)
      });
      await refreshProfile();
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    setExporting(true);
    setError(null);
    try {
      await api.exportHealthData();
    } catch (err: any) {
      setError(err.message || 'Unable to export health data');
    } finally {
      setExporting(false);
    }
  };

  if (!form) return <div className="py-16 text-center text-sm text-slate-500">Loading your profile...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <header className="rounded-2xl bg-slate-950 text-white p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-200"><UserRound className="w-4 h-4" /> Account and health profile</div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold">Your profile</h1>
            <p className="mt-2 text-sm text-slate-300">Keep your care preferences and health context current for better visits.</p>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-300"><p className="font-semibold text-white">{user?.email}</p><p className="mt-1">{user?.isDemo ? 'Demo patient account' : 'Patient account'}</p></div>
        </div>
      </header>

      {error && <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"><AlertCircle className="w-4 h-4" />{error}</div>}
      {saved && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700"><CheckCircle2 className="w-4 h-4" />Profile saved successfully.</div>}

      <form onSubmit={saveProfile} className="space-y-6">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5"><UserRound className="w-5 h-5 text-brand-600" /><div><h2 className="font-bold text-slate-900">Personal details</h2><p className="text-xs text-slate-500 mt-0.5">Used to personalize your health workspace.</p></div></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" value={form.name} onChange={(value) => updateField('name', value)} required />
            <Field label="Date of birth" type="date" value={form.date_of_birth || ''} onChange={(value) => updateField('date_of_birth', value)} />
            <Field label="Age" type="number" value={form.age?.toString() || ''} onChange={(value) => updateField('age', value ? Number(value) : undefined)} />
            <SelectField label="Gender" value={form.gender || ''} options={['Female', 'Male', 'Non-binary', 'Prefer not to say']} onChange={(value) => updateField('gender', value)} />
            <SelectField label="Blood group" value={form.blood_group || ''} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} onChange={(value) => updateField('blood_group', value)} />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5"><HeartPulse className="w-5 h-5 text-rose-600" /><div><h2 className="font-bold text-slate-900">Health context</h2><p className="text-xs text-slate-500 mt-0.5">Separate items with commas. You can update these anytime.</p></div></div>
          <div className="space-y-4"><TextAreaField label="Allergies" value={allergies} onChange={setAllergies} placeholder="Penicillin, peanuts" /><TextAreaField label="Existing conditions" value={conditions} onChange={setConditions} placeholder="Seasonal allergies, hypertension" /><TextAreaField label="Current medications" value={medications} onChange={setMedications} placeholder="Medication name and dose" /></div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5"><ShieldCheck className="w-5 h-5 text-emerald-600" /><div><h2 className="font-bold text-slate-900">Emergency contact</h2><p className="text-xs text-slate-500 mt-0.5">A person your care team can contact if needed.</p></div></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><Field label="Name" value={form.emergency_contact?.name || ''} onChange={(value) => updateEmergency('name', value)} /><Field label="Relationship" value={form.emergency_contact?.relationship || ''} onChange={(value) => updateEmergency('relationship', value)} /><Field label="Phone" type="tel" value={form.emergency_contact?.phone || ''} onChange={(value) => updateEmergency('phone', value)} /></div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5"><LockKeyhole className="w-5 h-5 text-slate-700" /><div><h2 className="font-bold text-slate-900">Privacy controls</h2><p className="text-xs text-slate-500 mt-0.5">Choose how MedScan stores and uses your information.</p></div></div>
          <div className="space-y-3"><Toggle label="Keep health history in my account" description="Allows reports, symptom checks, and timeline entries to remain available." checked={form.privacy_settings?.store_history ?? true} onChange={(value) => updatePrivacy('store_history', value)} /><Toggle label="Share de-identified data for research" description="Optional. Your name and direct identifiers are not included." checked={form.privacy_settings?.share_with_research ?? false} onChange={(value) => updatePrivacy('share_with_research', value)} /></div>
        </section>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50 transition"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save profile'}</button><div className="flex flex-wrap gap-2"><button type="button" onClick={exportData} disabled={exporting} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"><Download className="w-4 h-4" />{exporting ? 'Preparing export...' : 'Download health data'}</button><button type="button" onClick={logout} className="rounded-xl px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 transition">Log out</button></div></div>
      </form>
    </div>
  );
};

const Field: React.FC<{ label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }> = ({ label, value, onChange, type = 'text', required }) => <label className="block text-xs font-semibold text-slate-700">{label}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></label>;
const SelectField: React.FC<{ label: string; value: string; options: string[]; onChange: (value: string) => void }> = ({ label, value, options, onChange }) => <label className="block text-xs font-semibold text-slate-700">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"><option value="">Select</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
const TextAreaField: React.FC<{ label: string; value: string; onChange: (value: string) => void; placeholder: string }> = ({ label, value, onChange, placeholder }) => <label className="block text-xs font-semibold text-slate-700">{label}<textarea rows={2} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></label>;
const Toggle: React.FC<{ label: string; description: string; checked: boolean; onChange: (value: boolean) => void }> = ({ label, description, checked, onChange }) => <label className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4 cursor-pointer"><span><span className="block text-sm font-semibold text-slate-800">{label}</span><span className="block mt-1 text-xs leading-relaxed text-slate-500">{description}</span></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" /></label>;
