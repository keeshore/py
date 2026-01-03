import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';

export default function ReAppointment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadHistory = async () => {
    setError('');
    setLoading(true);
    try {
      const { appointments } = await api.listAppointments({ userId: user.id });
      setList(appointments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const rebook = async (appt) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = {
        userId: user.id,
        hospitalId: appt.hospital_id,
        doctorId: appt.doctor_id,
        problem: appt.problem || 'Follow-up',
        preferredTime: appt.preferred_time || 'soon'
      };
      await api.createAppointment(payload);
      setSuccess('Re-appointment booked with same doctor');
      setTimeout(() => navigate('/user/dashboard'), 700);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="panel-header" style={{ marginBottom: '1rem' }}>
        <div>
          <p className="eyebrow">Re-Appointment</p>
          <h2>Book again with one click</h2>
        </div>
      </div>

      {error && <div className="error-text" style={{ marginBottom: '1rem' }}>{error}</div>}
      {success && <div className="success-text" style={{ marginBottom: '1rem' }}>{success}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span className="muted">Reuse past descriptions and doctors</span>
        <button className="ghost" onClick={loadHistory} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
      </div>

      <div className="grid-2">
        {list.map(a => (
          <div key={a.id} className="card" style={{ border: '1px solid var(--border)' }}>
            <h3>{a.reason || 'Previous appointment'}</h3>
            <p className="muted">Doctor: {a.doctor_id || 'N/A'}</p>
            <p className="muted">Hospital: {a.hospital_id || 'N/A'}</p>
            <p className="muted">Status: {a.status}</p>
            <p className="muted">Preferred time: {a.preferred_time || 'N/A'}</p>
            <p className="muted">Description: {a.problem || 'N/A'}</p>
            <button style={{ marginTop: '0.5rem' }} onClick={() => rebook(a)} disabled={loading}>One-click Rebook</button>
          </div>
        ))}
      </div>

      {!list.length && <p className="muted">No previous appointments yet.</p>}
    </div>
  );
}
