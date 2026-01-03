import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import MapPicker from '../components/MapPicker.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6Lcg2D4sAAAAAPadVQ3DtJzFjb4kwy_qtTsyyeIP';

export default function UserRegister() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    height: '',
    weight: '',
    dob: '',
    address: '',
    latitude: '',
    longitude: ''
  });

  const age = useMemo(() => {
    if (!form.dob) return '';
    const diff = Date.now() - new Date(form.dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  }, [form.dob]);

  const onSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!recaptchaToken) throw new Error('Please complete reCAPTCHA');
      const { user } = await api.registerUser({ ...form, recaptchaToken });
      setUser(user);
      navigate('/user/dashboard');
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
          <p className="eyebrow">User Onboarding</p>
          <h2>Create your profile</h2>
        </div>
        <div className="chip">Auto-sync to SQLite</div>
      </div>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>Full Name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        <label>Email<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
        <label>Mobile<input value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} /></label>
        <label>Password<input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
        <label>Height (cm)<input value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} /></label>
        <label>Weight (kg)<input value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} /></label>
        <label>Date of Birth<input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} /></label>
        <label>Age (auto)<input value={age} readOnly /></label>
        <label className="wide">Address<textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
        <div className="wide">
          <p className="muted">Pin your location</p>
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
        <button className="primary" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Register & Go'}</button>
      </form>
    </div>
  );
}
