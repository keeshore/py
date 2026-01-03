import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';

export default function HospitalLogin() {
  const { setHospital } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { hospital, doctor } = await api.loginHospital(form);
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
        {error && <div className="error">{error}</div>}
        <button className="primary" type="submit" disabled={loading}>{loading ? 'Checking…' : 'Login'}</button>
      </form>
    </div>
  );
}
