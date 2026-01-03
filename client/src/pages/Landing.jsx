import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="landing">
      <h1 className="landing-title">PulseCare</h1>
      <p className="landing-subtitle">Doctor Appointment Web Application</p>
      
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>Get Started</h2>
        
        <div className="grid-2">
          <div className="card">
            <h3 className="card-title">For Patients</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Register and manage your health profile
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/user/register"><button>Register</button></Link>
              <Link to="/user/login"><button className="ghost">Login</button></Link>
            </div>
          </div>
          
          <div className="card">
            <h3 className="card-title">For Hospitals</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Register your hospital and doctor details
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/hospital/register"><button>Register</button></Link>
              <Link to="/hospital/login"><button className="ghost">Login</button></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
