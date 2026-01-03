import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { api } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6Lcg2D4sAAAAAPadVQ3DtJzFjb4kwy_qtTsyyeIP';

export default function HospitalLogin() {
  const { setHospital } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');

  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!recaptchaToken) throw new Error('Please complete reCAPTCHA');
      const { hospital, doctor } = await api.loginHospital({ ...form, recaptchaToken });
      setHospital({ ...hospital, doctor });
      navigate('/hospital/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel small">
      <p className="eyebrow">Hospital Login</p>
      <h2>Access your dashboard</h2>
      <form className="form-grid" onSubmit={submit}>
        <label>Email<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
        {recaptchaSiteKey && (
          <div className="wide" style={{ marginTop: '0.5rem' }}>
            <ReCAPTCHA sitekey={recaptchaSiteKey} onChange={setRecaptchaToken} />
          </div>
        )}
        {error && <div className="error">{error}</div>}
        <button className="primary" type="submit" disabled={loading}>{loading ? 'Checking…' : 'Login'}</button>
      </form>
    </div>
  );
}
