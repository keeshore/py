import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { api } from '../lib/api.js';
import MapPicker from '../components/MapPicker.jsx';

export default function HospitalDashboard() {
  const { hospital, setHospital } = useAuth();
  const navigate = useNavigate();
  const [editingHospital, setEditingHospital] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [hospitalForm, setHospitalForm] = useState({
    name: hospital.name || '',
    email: hospital.email || '',
    emergency: hospital.emergency === 1,
    morning_from: hospital.morning_from || '',
    morning_to: hospital.morning_to || '',
    evening_from: hospital.evening_from || '',
    evening_to: hospital.evening_to || '',
    address: hospital.address || '',
    latitude: hospital.latitude || '',
    longitude: hospital.longitude || ''
  });

  const [doctorForm, setDoctorForm] = useState({
    name: hospital.doctor?.name || '',
    qualification: hospital.doctor?.qualification || '',
    specialization: hospital.doctor?.specialization || '',
    description: hospital.doctor?.description || ''
  });

  const handleSaveHospital = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { hospital: updated, doctor } = await api.updateHospital(hospital.id, hospitalForm);
      setHospital({ ...updated, doctor });
      setSuccess('Hospital profile updated successfully!');
      setEditingHospital(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { doctor } = await api.updateDoctor(hospital.doctor.id, doctorForm);
      setHospital({ ...hospital, doctor });
      setSuccess('Doctor profile updated successfully!');
      setEditingDoctor(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelHospital = () => {
    setHospitalForm({
      name: hospital.name || '',
      email: hospital.email || '',
      emergency: hospital.emergency === 1,
      morning_from: hospital.morning_from || '',
      morning_to: hospital.morning_to || '',
      evening_from: hospital.evening_from || '',
      evening_to: hospital.evening_to || '',
      address: hospital.address || '',
      latitude: hospital.latitude || '',
      longitude: hospital.longitude || ''
    });
    setEditingHospital(false);
    setError('');
    setSuccess('');
  };

  const handleCancelDoctor = () => {
    setDoctorForm({
      name: hospital.doctor?.name || '',
      qualification: hospital.doctor?.qualification || '',
      specialization: hospital.doctor?.specialization || '',
      description: hospital.doctor?.description || ''
    });
    setEditingDoctor(false);
    setError('');
    setSuccess('');
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Hospital Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome, {hospital.name}!</p>
        </div>
      </div>

      {success && <div className="success-text" style={{ marginBottom: '1rem', fontSize: '1rem' }}>{success}</div>}
      {error && <div className="error-text" style={{ marginBottom: '1rem', fontSize: '1rem' }}>{error}</div>}

      {/* Hospital Information Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="card-title">Hospital Information</h2>
          {!editingHospital && (
            <button onClick={() => setEditingHospital(true)}>Edit Hospital</button>
          )}
        </div>

        {!editingHospital ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="grid-2">
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Hospital Name</label>
                <p style={{ marginTop: '0.25rem' }}>{hospital.name || 'Not set'}</p>
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Email</label>
                <p style={{ marginTop: '0.25rem' }}>{hospital.email || 'Not set'}</p>
              </div>
            </div>
            <div className="grid-2">
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Emergency Service</label>
                <p style={{ marginTop: '0.25rem' }}>{hospital.emergency === 1 ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Location</label>
                <p style={{ marginTop: '0.25rem' }}>
                  {hospital.latitude && hospital.longitude ? `${hospital.latitude}, ${hospital.longitude}` : 'Not set'}
                </p>
              </div>
            </div>
            <div className="grid-2">
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Morning Timing</label>
                <p style={{ marginTop: '0.25rem' }}>
                  {hospital.morning_from && hospital.morning_to 
                    ? `${hospital.morning_from} - ${hospital.morning_to}` 
                    : 'Not set'}
                </p>
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Evening Timing</label>
                <p style={{ marginTop: '0.25rem' }}>
                  {hospital.evening_from && hospital.evening_to 
                    ? `${hospital.evening_from} - ${hospital.evening_to}` 
                    : 'Not set'}
                </p>
              </div>
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Address</label>
              <p style={{ marginTop: '0.25rem' }}>{hospital.address || 'Not set'}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveHospital}>
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Hospital Name</label>
                  <input
                    required
                    value={hospitalForm.name}
                    onChange={e => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    required
                    type="email"
                    value={hospitalForm.email}
                    onChange={e => setHospitalForm({ ...hospitalForm, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Emergency Service</label>
                <select
                  value={hospitalForm.emergency ? 'yes' : 'no'}
                  onChange={e => setHospitalForm({ ...hospitalForm, emergency: e.target.value === 'yes' })}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="grid-2">
                <div>
                  <label style={{ marginBottom: '0.5rem', display: 'block' }}>Morning Timing</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem' }}>From</label>
                      <input
                        type="time"
                        value={hospitalForm.morning_from}
                        onChange={e => setHospitalForm({ ...hospitalForm, morning_from: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem' }}>To</label>
                      <input
                        type="time"
                        value={hospitalForm.morning_to}
                        onChange={e => setHospitalForm({ ...hospitalForm, morning_to: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ marginBottom: '0.5rem', display: 'block' }}>Evening Timing</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem' }}>From</label>
                      <input
                        type="time"
                        value={hospitalForm.evening_from}
                        onChange={e => setHospitalForm({ ...hospitalForm, evening_from: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem' }}>To</label>
                      <input
                        type="time"
                        value={hospitalForm.evening_to}
                        onChange={e => setHospitalForm({ ...hospitalForm, evening_to: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={hospitalForm.address}
                  onChange={e => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Pin Location</label>
                <MapPicker
                  value={{ lat: hospitalForm.latitude, lng: hospitalForm.longitude }}
                  onChange={({ lat, lng }) => setHospitalForm({ ...hospitalForm, latitude: lat, longitude: lng })}
                />
                <div className="grid-2" style={{ marginTop: '1rem' }}>
                  <div>
                    <label>Latitude</label>
                    <input value={hospitalForm.latitude} readOnly />
                  </div>
                  <div>
                    <label>Longitude</label>
                    <input value={hospitalForm.longitude} readOnly />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Hospital Changes'}
                </button>
                <button type="button" className="ghost" onClick={handleCancelHospital}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Doctor Information Card */}
      <div className="card mt-3">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <h2 className="card-title">Doctor Information</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="ghost" onClick={() => navigate('/doctor/dashboard')}>Open Doctor Dashboard</button>
            {!editingDoctor && (
              <button onClick={() => setEditingDoctor(true)}>Edit Doctor</button>
            )}
          </div>
        </div>

        {!editingDoctor ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="grid-2">
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Doctor Name</label>
                <p style={{ marginTop: '0.25rem' }}>{hospital.doctor?.name || 'Not set'}</p>
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Qualification</label>
                <p style={{ marginTop: '0.25rem' }}>{hospital.doctor?.qualification || 'Not set'}</p>
              </div>
            </div>
            <div className="grid-2">
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Specialization</label>
                <p style={{ marginTop: '0.25rem' }}>{hospital.doctor?.specialization || 'Not set'}</p>
              </div>
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Description</label>
              <p style={{ marginTop: '0.25rem' }}>{hospital.doctor?.description || 'Not set'}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveDoctor}>
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Doctor Name</label>
                  <input
                    required
                    value={doctorForm.name}
                    onChange={e => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Qualification</label>
                  <input
                    value={doctorForm.qualification}
                    placeholder="e.g., MBBS, MD"
                    onChange={e => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Specialization</label>
                <input
                  value={doctorForm.specialization}
                  placeholder="e.g., Cardiology, Pediatrics"
                  onChange={e => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={doctorForm.description}
                  onChange={e => setDoctorForm({ ...doctorForm, description: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Doctor Changes'}
                </button>
                <button type="button" className="ghost" onClick={handleCancelDoctor}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="card mt-3">
        <h2 className="card-title">Account Details</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Hospital ID: <code style={{ color: 'var(--accent)' }}>{hospital.id}</code>
        </p>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Doctor ID: <code style={{ color: 'var(--accent)' }}>{hospital.doctor?.id}</code>
        </p>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Account created: {new Date(hospital.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
