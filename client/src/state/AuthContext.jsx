import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [hospital, setHospital] = useState(() => {
    const saved = localStorage.getItem('hospital');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    if (hospital) localStorage.setItem('hospital', JSON.stringify(hospital));
    else localStorage.removeItem('hospital');
  }, [hospital]);

  return (
    <AuthContext.Provider value={{ user, setUser, hospital, setHospital }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
