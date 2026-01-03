import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import MapPicker from '../components/MapPicker.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6Lcg2D4sAAAAAPadVQ3DtJzFjb4kwy_qtTsyyeIP';

export default function HospitalRegister() {
  const { setHospital } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    doctorName: '',
    doctorQualification: '',
    doctorSpecialization: '',
    doctorDescription: 'Experienced specialist ready to help.',
    emergency: true,
    morningFrom: '08:00',
    morningTo: '12:00',
    eveningFrom: '16:00',
    eveningTo: '20:00',
    address: '',
    latitude: '',
    longitude: ''
  });

  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!recaptchaToken) throw new Error('Please complete reCAPTCHA');
      const { hospital, doctor } = await api.registerHospital({ ...form, recaptchaToken });
      setHospital({ ...hospital, doctor });
      navigate('/hospital/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Hospital Onboarding</p>
          <h2>Register your clinic</h2>
        </div>
        <div className="chip">Maps + SQLite synced</div>
      </div>
      <form className="form-grid" onSubmit={submit}>
        <label>Hospital / Clinic Name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        <label>Login Email<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
        <label>Doctor Name<input required value={form.doctorName} onChange={e => setForm({ ...form, doctorName: e.target.value })} /></label>
        <label>Doctor Qualification<input value={form.doctorQualification} onChange={e => setForm({ ...form, doctorQualification: e.target.value })} placeholder="MBBS, MD, MS" /></label>
        <label>Doctor Specialization<input value={form.doctorSpecialization} onChange={e => setForm({ ...form, doctorSpecialization: e.target.value })} placeholder="Eye, ENT, General…" /></label>
        <label className="wide">Doctor Description<textarea value={form.doctorDescription} onChange={e => setForm({ ...form, doctorDescription: e.target.value })} /></label>
        <label>Emergency Service<select value={form.emergency ? 'yes' : 'no'} onChange={e => setForm({ ...form, emergency: e.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select></label>
        <div className="time-block">
          <p className="muted">Morning Time</p>
          <div className="inline">
            <label>From<input type="time" value={form.morningFrom} onChange={e => setForm({ ...form, morningFrom: e.target.value })} /></label>
            <label>To<input type="time" value={form.morningTo} onChange={e => setForm({ ...form, morningTo: e.target.value })} /></label>
          </div>
        </div>
        <div className="time-block">
          <p className="muted">Evening Time</p>
          <div className="inline">
            <label>From<input type="time" value={form.eveningFrom} onChange={e => setForm({ ...form, eveningFrom: e.target.value })} /></label>
            <label>To<input type="time" value={form.eveningTo} onChange={e => setForm({ ...form, eveningTo: e.target.value })} /></label>
          </div>
        </div>
        <label className="wide">Address<textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
        <div className="wide">
          <p className="muted">Pin hospital location</p>
          <MapPicker value={{ lat: form.latitude, lng: form.longitude }} onChange={({ lat, lng }) => setForm({ ...form, latitude: lat, longitude: lng })} />
          <div className="inline">
            <label>Latitude<input value={form.latitude} readOnly /></label>
            <label>Longitude<input value={form.longitude} readOnly /></label>
          </div>
        </div>
        {recaptchaSiteKey && (
          <div className="wide" style={{ marginTop: '0.5rem' }}>
            <ReCAPTCHA sitekey={recaptchaSiteKey} onChange={setRecaptchaToken} />
          </div>
        )}
        {error && <div className="error">{error}</div>}
        <button className="primary" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Register Hospital'}</button>
      </form>
    </div>
  );
}
