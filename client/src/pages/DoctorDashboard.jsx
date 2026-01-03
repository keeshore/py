import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { api } from '../lib/api.js';

const statusColor = count => {
  if (count <= 3) return 'green';
  if (count <= 7) return 'yellow';
  return 'red';
};

const aiTemplates = [
  { label: 'Triage / red flags', value: 'List immediate red flags to rule out and when to escalate to emergency care.' },
  { label: 'Exam plan', value: 'Suggest a focused physical exam sequence for the presenting symptoms.' },
  { label: 'Investigations', value: 'Recommend initial labs or imaging with brief rationale and urgency.' },
  { label: 'Patient counseling', value: 'Give a plain-language explanation and home-care advice for the current problem.' },
  { label: 'Follow-up plan', value: 'Outline a safe follow-up schedule and warning signs to revisit sooner.' }
];

export default function DoctorDashboard() {
  const { hospital } = useAuth();
  const doctor = hospital?.doctor;
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!doctor) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [{ appointments: list = [] }, { appointments: today = [] }] = await Promise.all([
          api.listAppointments({ doctorId: doctor.id }),
          api.listTodayAppointments({ doctorId: doctor.id })
        ]);
        setAppointments(list);
        setTodayAppointments(today);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [doctor]);

  const counts = useMemo(() => {
    const grouped = { Booked: 0, 'In Consultation': 0, Completed: 0, Cancelled: 0 };
    appointments.forEach(a => {
      if (grouped[a.status] === undefined) grouped[a.status] = 0;
      grouped[a.status] += 1;
    });
    return grouped;
  }, [appointments]);

  const waiting = useMemo(() => counts['Booked'] || 0, [counts]);

  const mutateAppt = async (id, action) => {
    setError('');
    try {
      if (action === 'get-in') await api.getInAppointment(id);
      if (action === 'complete') await api.completeAppointment(id);
      if (action === 'cancel') await api.cancelAppointment(id);
      const [{ appointments: list = [] }, { appointments: today = [] }] = await Promise.all([
        api.listAppointments({ doctorId: doctor.id }),
        api.listTodayAppointments({ doctorId: doctor.id })
      ]);
      setAppointments(list);
      setTodayAppointments(today);
    } catch (err) {
      setError(err.message);
    }
  };

  const askAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setError('');
    try {
      const { response } = await api.firstAid({ prompt: aiPrompt, userId: null, doctorId: doctor?.id });
      setAiResponse(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const addTemplate = text => {
    setAiPrompt(prev => (prev ? `${prev}\n${text}` : text));
  };

  if (!doctor) {
    return (
      <div className="card" style={{ maxWidth: '700px', margin: '2rem auto' }}>
        <p className="muted">Doctor session not found. Please login as hospital to access doctor dashboard.</p>
        <button onClick={() => navigate('/hospital/login')}>Go to Hospital Login</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="panel-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <p className="eyebrow">Doctor Dashboard</p>
          <h2>{doctor.name} · {doctor.specialization || 'Specialist'}</h2>
          <p className="muted">Hospital: {hospital.name}</p>
        </div>
        <div className="chip">Availability: {hospital.emergency ? 'ON' : 'OFF'}</div>
      </div>

      {error && <div className="error-text" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="grid-3" style={{ marginBottom: '1rem' }}>
        <div className="card">
          <p className="muted">Waiting Queue</p>
          <div className={`queue-ring queue-${statusColor(waiting)}`}>
            <span>{waiting}</span>
          </div>
        </div>
        <div className="card">
          <p className="muted">Today</p>
          <p>Booked: {counts['Booked'] || 0}</p>
          <p>In Consultation: {counts['In Consultation'] || 0}</p>
          <p>Completed: {counts['Completed'] || 0}</p>
          <p>Cancelled: {counts['Cancelled'] || 0}</p>
        </div>
        <div className="card">
          <p className="muted">AI Assist</p>
          <div className="muted" style={{ margin: '0.5rem 0' }}>Quick prompts</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {aiTemplates.map(t => (
              <button
                key={t.label}
                className="ghost"
                style={{ padding: '0.35rem 0.6rem' }}
                onClick={() => addTemplate(t.value)}
                disabled={aiLoading}
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Describe patient problem" />
          <button style={{ marginTop: '0.5rem' }} onClick={askAI} disabled={aiLoading}>{aiLoading ? 'Asking…' : 'Ask Gemini'}</button>
          {aiResponse && <p className="muted" style={{ marginTop: '0.5rem' }}>{aiResponse}</p>}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="panel-header" style={{ marginBottom: '0.75rem' }}>
          <div>
            <p className="eyebrow">Today</p>
            <h3>Appointments with patient details</h3>
          </div>
          <a className="ghost" href="https://calendar.google.com/calendar/u/0/r" target="_blank" rel="noreferrer" style={{ padding: '0.45rem 0.75rem' }}>
            Open Google Calendar
          </a>
        </div>
        <div className="grid-2">
          {todayAppointments.map(appt => (
            <div key={appt.id} className="card" style={{ border: '1px solid var(--border)' }}>
              <h4>{appt.reason || 'Visit'}</h4>
              <p className="muted">Patient: {appt.user_name || appt.user_id || 'N/A'}</p>
              <p className="muted">Contact: {appt.user_email || 'N/A'} · {appt.user_mobile || 'N/A'}</p>
              <p className="muted">Time: {appt.preferred_time || 'N/A'}</p>
              <p className="muted">Status: {appt.status}</p>
              <p className="muted">Problem: {appt.problem || 'N/A'}</p>
            </div>
          ))}
        </div>
        {!todayAppointments.length && <p className="muted">No appointments created today.</p>}
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="panel-header" style={{ marginBottom: '1rem' }}>
          <div>
            <p className="eyebrow">Appointments</p>
            <h3>Today</h3>
          </div>
          {loading && <span className="muted">Loading…</span>}
        </div>
        <div className="grid-2">
          {appointments.map(appt => (
            <div key={appt.id} className="card" style={{ border: '1px solid var(--border)' }}>
              <h4>{appt.reason || 'Visit'}</h4>
              <p className="muted">Patient: {appt.user_name || appt.user_id || 'N/A'}</p>
              <p className="muted">Contact: {appt.user_email || 'N/A'} · {appt.user_mobile || 'N/A'}</p>
              <p className="muted">Time: {appt.preferred_time || 'N/A'}</p>
              <p className="muted">Status: {appt.status}</p>
              <p className="muted">Problem: {appt.problem || 'N/A'}</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => mutateAppt(appt.id, 'get-in')} disabled={appt.status === 'In Consultation' || appt.status === 'Completed'}>GET-IN</button>
                <button onClick={() => mutateAppt(appt.id, 'complete')} disabled={appt.status === 'Completed'}>Complete</button>
                <button className="ghost" onClick={() => mutateAppt(appt.id, 'cancel')} disabled={appt.status === 'Cancelled'}>Cancel</button>
              </div>
            </div>
          ))}
        </div>
        {!appointments.length && <p className="muted">No appointments yet.</p>}
      </div>
    </div>
  );
}
