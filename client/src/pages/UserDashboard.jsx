import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { api } from '../lib/api.js';
import MapPicker from '../components/MapPicker.jsx';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    mobile: user.mobile || '',
    height: user.height || '',
    weight: user.weight || '',
    dob: user.dob || '',
    address: user.address || '',
    latitude: user.latitude || '',
    longitude: user.longitude || ''
  });
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');

  const age = useMemo(() => {
    if (!form.dob) return '';
    const diff = Date.now() - new Date(form.dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  }, [form.dob]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { user: updated } = await api.updateUser(user.id, form);
      setUser(updated);
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported in this browser.');
      return;
    }
    setLocError('');
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setForm({ ...form, latitude: lat, longitude: lng });
        setLocLoading(false);
      },
      err => {
        setLocError('Could not fetch location. Please allow location access.');
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCancel = () => {
    setForm({
      name: user.name || '',
      email: user.email || '',
      mobile: user.mobile || '',
      height: user.height || '',
      weight: user.weight || '',
      dob: user.dob || '',
      address: user.address || '',
      latitude: user.latitude || '',
      longitude: user.longitude || ''
    });
    setEditing(false);
    setError('');
    setSuccess('');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>User Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user.name}!</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)}>Edit Profile</button>
        )}
      </div>

      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/user/book')}>Book Appointment</button>
        <button onClick={() => navigate('/user/rebook')}>Re-Appointment</button>
        <button onClick={() => navigate('/user/dashboard')}>View Dashboard</button>
        <button onClick={() => navigate('/user/qr')}>QR Scanner</button>
        <button onClick={() => navigate('/user/firstaid')}>First Aid (AI)</button>
        <button onClick={() => setEditing(true)}>Profile</button>
      </div>

      {success && <div className="success-text" style={{ marginBottom: '1rem', fontSize: '1rem' }}>{success}</div>}
      {error && <div className="error-text" style={{ marginBottom: '1rem', fontSize: '1rem' }}>{error}</div>}

      <div className="card">
        <h2 className="card-title">Profile Information</h2>
        {!editing ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="grid-2">
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Full Name</label>
                <p style={{ marginTop: '0.25rem' }}>{user.name || 'Not set'}</p>
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Email</label>
                <p style={{ marginTop: '0.25rem' }}>{user.email || 'Not set'}</p>
              </div>
            </div>
            <div className="grid-2">
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Mobile</label>
                <p style={{ marginTop: '0.25rem' }}>{user.mobile || 'Not set'}</p>
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Date of Birth</label>
                <p style={{ marginTop: '0.25rem' }}>{user.dob || 'Not set'}</p>
              </div>
            </div>
            <div className="grid-2">
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Age</label>
                <p style={{ marginTop: '0.25rem' }}>{user.age || 'Not set'} years</p>
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Height</label>
                <p style={{ marginTop: '0.25rem' }}>{user.height ? `${user.height} cm` : 'Not set'}</p>
              </div>
            </div>
            <div className="grid-2">
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Weight</label>
                <p style={{ marginTop: '0.25rem' }}>{user.weight ? `${user.weight} kg` : 'Not set'}</p>
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Location</label>
                <p style={{ marginTop: '0.25rem' }}>
                  {user.latitude && user.longitude ? `${user.latitude}, ${user.longitude}` : 'Not set'}
                </p>
              </div>
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Address</label>
              <p style={{ marginTop: '0.25rem' }}>{user.address || 'Not set'}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Mobile</label>
                  <input
                    value={form.mobile}
                    onChange={e => setForm({ ...form, mobile: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={e => setForm({ ...form, dob: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Age (auto-calculated)</label>
                  <input value={age} readOnly />
                </div>
                <div className="form-group">
                  <label>Height (cm)</label>
                  <input
                    type="number"
                    value={form.height}
                    onChange={e => setForm({ ...form, height: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    value={form.weight}
                    onChange={e => setForm({ ...form, weight: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Pin Location</label>
                <MapPicker
                  value={{ lat: form.latitude, lng: form.longitude }}
                  onChange={({ lat, lng }) => setForm({ ...form, latitude: lat, longitude: lng })}
                />
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.75rem' }}>
                  <button type="button" onClick={handleCurrentLocation} disabled={locLoading}>
                    {locLoading ? 'Detecting…' : 'Use Current Location'}
                  </button>
                  {locError && <span className="error-text" style={{ marginTop: 0 }}>{locError}</span>}
                </div>
                <div className="grid-2" style={{ marginTop: '1rem' }}>
                  <div>
                    <label>Latitude</label>
                    <input value={form.latitude} readOnly />
                  </div>
                  <div>
                    <label>Longitude</label>
                    <input value={form.longitude} readOnly />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="ghost" onClick={handleCancel}>
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
          User ID: <code style={{ color: 'var(--accent)' }}>{user.id}</code>
        </p>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Account created: {new Date(user.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
