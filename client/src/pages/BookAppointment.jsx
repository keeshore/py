import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';

const reasons = ['Eye', 'ENT', 'General', 'Other'];

export default function BookAppointment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [reason, setReason] = useState('General');
  const [searchText, setSearchText] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { appointments } = await api.listAppointments({ userId: user.id });
        setHistory(appointments || []);
      } catch (_err) {
        // ignore
      }
    };
    loadHistory();
  }, [user.id]);

  const preferredScores = useMemo(() => {
    const score = {};
    history.forEach(a => {
      if (a.doctor_id) score[a.doctor_id] = (score[a.doctor_id] || 0) + 1;
      if (a.hospital_id) score[a.hospital_id] = (score[a.hospital_id] || 0) + 0.5;
    });
    return score;
  }, [history]);

  const fetchDoctors = async () => {
    setError('');
    setLoading(true);
    try {
      const params = {};
      if (reason && reason !== 'Other') params.specialization = reason;
      if (user.latitude && user.longitude) {
        params.userLat = user.latitude;
        params.userLng = user.longitude;
      }
      const { doctors: list } = await api.searchDoctors(params);
      const filtered = searchText
        ? (list || []).filter(d =>
            (d.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
            (d.hospital_name || '').toLowerCase().includes(searchText.toLowerCase()) ||
            (d.specialization || '').toLowerCase().includes(searchText.toLowerCase())
          )
        : list || [];
      setDoctors(filtered);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!selectedDoctor) {
      setError('Select a doctor first');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = {
        userId: user.id,
        hospitalId: selectedDoctor.hospital_id,
        doctorId: selectedDoctor.id,
        problem: description || 'N/A',
        preferredTime: `${date || 'soon'} ${slot || ''}`.trim()
      };
      const { appointment } = await api.createAppointment(payload);
      setSuccess('Appointment booked successfully');
      setStep(6);
      setSelectedDoctor(null);
      setDescription('');
      if (appointment?.id) setTimeout(() => navigate('/user/dashboard'), 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const mostPreferredId = useMemo(() => {
    return Object.entries(preferredScores).sort((a, b) => b[1] - a[1])?.[0]?.[0];
  }, [preferredScores]);

  return (
    <div className="card" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="panel-header" style={{ marginBottom: '1rem' }}>
        <div>
          <p className="eyebrow">Online Appointment Booking</p>
          <h2>Step {step}: Guided flow</h2>
        </div>
      </div>

      {error && <div className="error-text" style={{ marginBottom: '1rem' }}>{error}</div>}
      {success && <div className="success-text" style={{ marginBottom: '1rem' }}>{success}</div>}

      {step === 1 && (
        <div className="grid-2">
          <div className="form-group">
            <label>Appointment Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Hospital Time Slot</label>
            <select value={slot} onChange={e => setSlot(e.target.value)}>
              <option value="">Select slot</option>
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
              <option value="Any">Any</option>
            </select>
          </div>
          <div className="form-group">
            <label>Reason</label>
            <select value={reason} onChange={e => setReason(e.target.value)}>
              {reasons.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Search (hospital/doctor/specialty)</label>
            <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="e.g., City Hospital, Dr. Rao, Eye" />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" onClick={() => setStep(2)}>Next: Find Hospitals</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="muted" style={{ marginBottom: '1rem' }}>Searching nearby and long-distance hospitals…</p>
          <button type="button" onClick={fetchDoctors} disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <p className="muted">Select a preferred hospital/doctor (shows nearby first; highlights past preferences).</p>
          <div className="grid-2" style={{ marginTop: '1rem' }}>
            {doctors.map(doc => {
              const preferred = doc.id === mostPreferredId || doc.hospital_id === mostPreferredId;
              return (
                <div key={doc.id} className="card" style={{ border: selectedDoctor?.id === doc.id ? '2px solid var(--accent)' : '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3>{doc.name}</h3>
                      <p className="muted">{doc.specialization || 'General'} · {doc.qualification || 'MBBS'}</p>
                      <p className="muted">{doc.hospital_name || 'Hospital'} · {doc.hospital_address || 'Address N/A'}</p>
                      {doc.distance_km !== undefined && (
                        <p className="muted">Distance: {doc.distance_km.toFixed(1)} km</p>
                      )}
                    </div>
                    {preferred && <span className="chip">Preferred</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <span className="chip">Queue: live</span>
                    <span className="chip">Rating: N/A</span>
                  </div>
                  <button style={{ marginTop: '0.75rem' }} onClick={() => { setSelectedDoctor(doc); setStep(4); }}>Select</button>
                </div>
              );
            })}
          </div>
          {!doctors.length && <p className="muted">No doctors found yet. Try another specialty or search text.</p>}
        </div>
      )}

      {step === 4 && selectedDoctor && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>Doctor Card</h3>
          <p><strong>Name:</strong> {selectedDoctor.name}</p>
          <p><strong>Hospital:</strong> {selectedDoctor.hospital_name}</p>
          <p><strong>Speciality:</strong> {selectedDoctor.specialization || 'General'}</p>
          <p><strong>Experience:</strong> Not captured</p>
          <p><strong>Rating:</strong> Not captured</p>
          <p><strong>Live queue:</strong> Visible on arrival</p>
          <button style={{ marginTop: '0.75rem' }} onClick={() => setStep(5)}>Next: Describe Problem</button>
        </div>
      )}

      {step === 5 && (
        <div className="form-group">
          <label>Short problem description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe symptoms briefly" />
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button type="button" onClick={confirm} disabled={loading}>{loading ? 'Booking…' : 'Confirm Appointment'}</button>
            <button type="button" className="ghost" onClick={() => setStep(3)}>Back</button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="success-text" style={{ marginTop: '1rem' }}>
          Appointment saved with hospital and doctor. Status: Booked.
        </div>
      )}
    </div>
  );
}
