const base = import.meta.env.VITE_API_BASE || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  registerUser: data => request('/users/register', { method: 'POST', body: JSON.stringify(data) }),
  loginUser: data => request('/users/login', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  registerHospital: data => request('/hospitals/register', { method: 'POST', body: JSON.stringify(data) }),
  loginHospital: data => request('/hospitals/login', { method: 'POST', body: JSON.stringify(data) }),
  updateHospital: (id, data) => request(`/hospitals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateDoctor: (id, data) => request(`/doctors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  searchDoctors: params => request(`/doctors/search?${new URLSearchParams(params).toString()}`),
  createAppointment: data => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  cancelAppointment: id => request(`/appointments/${id}/cancel`, { method: 'PUT' }),
  getInAppointment: id => request(`/appointments/${id}/get-in`, { method: 'PUT' }),
  completeAppointment: id => request(`/appointments/${id}/complete`, { method: 'PUT' }),
  listAppointments: params => request(`/appointments?${new URLSearchParams(params).toString()}`),
  listTodayAppointments: params => request(`/appointments/today?${new URLSearchParams(params).toString()}`),
  firstAid: data => request('/firstaid', { method: 'POST', body: JSON.stringify(data) })
};
