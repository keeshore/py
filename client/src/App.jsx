import React from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import UserRegister from './pages/UserRegister.jsx';
import UserLogin from './pages/UserLogin.jsx';
import HospitalRegister from './pages/HospitalRegister.jsx';
import HospitalLogin from './pages/HospitalLogin.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import HospitalDashboard from './pages/HospitalDashboard.jsx';
import BookAppointment from './pages/BookAppointment.jsx';
import ReAppointment from './pages/ReAppointment.jsx';
import FirstAidAI from './pages/FirstAidAI.jsx';
import QRScanner from './pages/QRScanner.jsx';
import DoctorDashboard from './pages/DoctorDashboard.jsx';
import { useAuth } from './state/AuthContext.jsx';

export default function App() {
  const { user, hospital, setUser, setHospital } = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    setUser(null);
    setHospital(null);
    navigate('/');
  };

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="logo">PulseCare</div>
        <div className="top-actions">
          {user && <span className="chip">User: {user.name}</span>}
          {hospital && <span className="chip">Hospital: {hospital.name}</span>}
          {(user || hospital) && (
            <button className="ghost" onClick={logout}>Logout</button>
          )}
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/user/register" element={<UserRegister />} />
          <Route path="/user/login" element={<UserLogin />} />
          <Route path="/hospital/register" element={<HospitalRegister />} />
          <Route path="/hospital/login" element={<HospitalLogin />} />
          <Route path="/user/dashboard" element={user ? <UserDashboard /> : <Navigate to="/user/login" replace />} />
          <Route path="/user/book" element={user ? <BookAppointment /> : <Navigate to="/user/login" replace />} />
          <Route path="/user/rebook" element={user ? <ReAppointment /> : <Navigate to="/user/login" replace />} />
          <Route path="/user/firstaid" element={user ? <FirstAidAI /> : <Navigate to="/user/login" replace />} />
          <Route path="/user/qr" element={user ? <QRScanner /> : <Navigate to="/user/login" replace />} />
          <Route path="/hospital/dashboard" element={hospital ? <HospitalDashboard /> : <Navigate to="/hospital/login" replace />} />
          <Route path="/doctor/dashboard" element={hospital?.doctor ? <DoctorDashboard /> : <Navigate to="/hospital/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}
