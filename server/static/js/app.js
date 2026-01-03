(() => {
  const API_BASE = (window.API_BASE || '/api').replace(/\/$/, '');
  const RECAPTCHA_SITE_KEY = window.RECAPTCHA_SITE_KEY || '';
  const qs = (sel, scope = document) => scope.querySelector(sel);
  const qsa = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

  const storage = {
    get(key) {
      try { return JSON.parse(localStorage.getItem(key)); } catch (_err) { return null; }
    },
    set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
    remove(key) { localStorage.removeItem(key); }
  };

  const auth = {
    user: () => storage.get('user'),
    setUser: (u) => storage.set('user', u),
    hospital: () => storage.get('hospital'),
    setHospital: (h) => storage.set('hospital', h),
    clear() { storage.remove('user'); storage.remove('hospital'); }
  };

  function showAlert(id, type, message) {
    const el = qs(`#${id}`);
    if (!el) return;
    el.className = `alert alert-${type}`;
    el.textContent = message;
    el.classList.remove('d-none');
  }

  function hideAlert(id) {
    const el = qs(`#${id}`);
    if (el) el.classList.add('d-none');
  }

  async function request(path, { method = 'GET', body } = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    let data;
    try { data = await res.json(); } catch (_err) { data = {}; }
    if (!res.ok) {
      const msg = data?.error || 'Request failed';
      throw new Error(msg);
    }
    return data;
  }

  const api = {
    registerUser: (data) => request('/users/register', { method: 'POST', body: data }),
    loginUser: (data) => request('/users/login', { method: 'POST', body: data }),
    updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: data }),
    registerHospital: (data) => request('/hospitals/register', { method: 'POST', body: data }),
    loginHospital: (data) => request('/hospitals/login', { method: 'POST', body: data }),
    updateHospital: (id, data) => request(`/hospitals/${id}`, { method: 'PUT', body: data }),
    updateDoctor: (id, data) => request(`/doctors/${id}`, { method: 'PUT', body: data }),
    searchDoctors: (params) => request(`/doctors/search?${new URLSearchParams(params).toString()}`),
    createAppointment: (data) => request('/appointments', { method: 'POST', body: data }),
    cancelAppointment: (id) => request(`/appointments/${id}/cancel`, { method: 'PUT' }),
    getInAppointment: (id) => request(`/appointments/${id}/get-in`, { method: 'PUT' }),
    completeAppointment: (id) => request(`/appointments/${id}/complete`, { method: 'PUT' }),
    listAppointments: (params) => request(`/appointments?${new URLSearchParams(params).toString()}`),
    listTodayAppointments: (params) => request(`/appointments/today?${new URLSearchParams(params).toString()}`),
    firstAid: (data) => request('/firstaid', { method: 'POST', body: data }),
    getHospital: (id) => request(`/hospitals/${id}`)
  };

  const recaptchaWidgets = {};
  function initRecaptcha(containerId) {
    if (!RECAPTCHA_SITE_KEY) return null;
    const el = qs(`#${containerId}`);
    if (!el) return null;
    if (!window.grecaptcha) return null;
    const widgetId = window.grecaptcha.render(el, { sitekey: RECAPTCHA_SITE_KEY });
    recaptchaWidgets[containerId] = widgetId;
    return widgetId;
  }

  function getRecaptchaToken(containerId) {
    if (!RECAPTCHA_SITE_KEY) return '';
    const widgetId = recaptchaWidgets[containerId];
    if (widgetId === undefined || !window.grecaptcha) return '';
    return window.grecaptcha.getResponse(widgetId);
  }

  function geoFill(latEl, lngEl, hintEl) {
    if (!navigator.geolocation || !latEl || !lngEl) return;
    if (hintEl) hintEl.textContent = 'Getting location…';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        latEl.value = pos.coords.latitude.toFixed(6);
        lngEl.value = pos.coords.longitude.toFixed(6);
        if (hintEl) hintEl.textContent = 'Location captured';
      },
      () => { if (hintEl) hintEl.textContent = 'Could not fetch location'; },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function hydrateBadges() {
    const user = auth.user();
    const hosp = auth.hospital();
    const userBadge = qs('#user-badge');
    const hospBadge = qs('#hospital-badge');
    const logoutBtn = qs('#logout-btn');
    if (userBadge) {
      if (user?.name) {
        userBadge.textContent = `User: ${user.name}`;
        userBadge.classList.remove('d-none');
      } else userBadge.classList.add('d-none');
    }
    if (hospBadge) {
      if (hosp?.name) {
        hospBadge.textContent = `Hospital: ${hosp.name}`;
        hospBadge.classList.remove('d-none');
      } else hospBadge.classList.add('d-none');
    }
    if (logoutBtn) {
      if (user || hosp) logoutBtn.classList.remove('d-none');
      logoutBtn.onclick = () => { auth.clear(); location.href = '/'; };
    }
  }

  function requireUser() {
    const user = auth.user();
    if (!user) { location.href = '/user/login'; return null; }
    return user;
  }

  function requireHospital() {
    const hospital = auth.hospital();
    if (!hospital) { location.href = '/hospital/login'; return null; }
    return hospital;
  }

  function renderSummary(list, target) {
    if (!target) return;
    target.innerHTML = '';
    list.forEach(([label, value]) => {
      const row = document.createElement('div');
      row.className = 'row mb-2';
      row.innerHTML = `<dt class="col-5 text-muted">${label}</dt><dd class="col-7 mb-0">${value ?? 'Not set'}</dd>`;
      target.appendChild(row);
    });
  }

  function initUserRegister() {
    const form = qs('#user-register-form');
    if (!form) return;
    const alertId = 'user-register-alert';
    initRecaptcha('user-register-recaptcha');
    qs('#user-location-btn')?.addEventListener('click', () => {
      geoFill(form.elements['latitude'], form.elements['longitude']);
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(alertId);
      const body = Object.fromEntries(new FormData(form).entries());
      body.recaptchaToken = getRecaptchaToken('user-register-recaptcha');
      body.emergency = body.emergency === 'yes';
      try {
        const { user } = await api.registerUser(body);
        auth.setUser(user);
        location.href = '/user/dashboard';
      } catch (err) {
        showAlert(alertId, 'danger', err.message);
      }
    });
  }

  function initUserLogin() {
    const form = qs('#user-login-form');
    if (!form) return;
    const alertId = 'user-login-alert';
    initRecaptcha('user-login-recaptcha');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(alertId);
      const body = Object.fromEntries(new FormData(form).entries());
      body.recaptchaToken = getRecaptchaToken('user-login-recaptcha');
      try {
        const { user } = await api.loginUser(body);
        auth.setUser(user);
        location.href = '/user/dashboard';
      } catch (err) {
        showAlert(alertId, 'danger', err.message);
      }
    });
  }

  function initUserDashboard() {
    const form = qs('#user-profile-form');
    if (!form) return;
    const user = requireUser();
    if (!user) return;
    const alertId = 'user-dashboard-alert';
    const summary = qs('#user-summary');
    const fillForm = (data) => {
      ['name','email','mobile','dob','height','weight','address','latitude','longitude'].forEach((f) => {
        if (form.elements[f]) form.elements[f].value = data[f] ?? '';
      });
    };
    fillForm(user);
    renderSummary([
      ['Name', user.name],
      ['Email', user.email],
      ['Mobile', user.mobile],
      ['DOB', user.dob],
      ['Age', user.age ? `${user.age} years` : 'Not set'],
      ['Height', user.height ? `${user.height} cm` : 'Not set'],
      ['Weight', user.weight ? `${user.weight} kg` : 'Not set'],
      ['Address', user.address],
      ['Location', user.latitude && user.longitude ? `${user.latitude}, ${user.longitude}` : 'Not set'],
      ['User ID', user.id]
    ], summary);

    qs('#user-dash-location-btn')?.addEventListener('click', () => {
      geoFill(form.elements['latitude'], form.elements['longitude'], qs('#user-dash-location-hint'));
    });

    qs('#user-profile-reset')?.addEventListener('click', () => {
      fillForm(auth.user() || {});
      hideAlert(alertId);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(alertId);
      const body = Object.fromEntries(new FormData(form).entries());
      try {
        const { user: updated } = await api.updateUser(user.id, body);
        auth.setUser(updated);
        renderSummary([
          ['Name', updated.name],
          ['Email', updated.email],
          ['Mobile', updated.mobile],
          ['DOB', updated.dob],
          ['Age', updated.age ? `${updated.age} years` : 'Not set'],
          ['Height', updated.height ? `${updated.height} cm` : 'Not set'],
          ['Weight', updated.weight ? `${updated.weight} kg` : 'Not set'],
          ['Address', updated.address],
          ['Location', updated.latitude && updated.longitude ? `${updated.latitude}, ${updated.longitude}` : 'Not set'],
          ['User ID', updated.id]
        ], summary);
        showAlert(alertId, 'success', 'Profile updated');
      } catch (err) {
        showAlert(alertId, 'danger', err.message);
      }
    });
  }

  function initHospitalRegister() {
    const form = qs('#hospital-register-form');
    if (!form) return;
    const alertId = 'hospital-register-alert';
    initRecaptcha('hospital-register-recaptcha');
    qs('#hospital-location-btn')?.addEventListener('click', () => {
      geoFill(form.elements['latitude'], form.elements['longitude']);
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(alertId);
      const body = Object.fromEntries(new FormData(form).entries());
      body.emergency = body.emergency === 'yes';
      body.recaptchaToken = getRecaptchaToken('hospital-register-recaptcha');
      try {
        const { hospital } = await api.registerHospital(body);
        auth.setHospital(hospital);
        location.href = '/hospital/dashboard';
      } catch (err) {
        showAlert(alertId, 'danger', err.message);
      }
    });
  }

  function initHospitalLogin() {
    const form = qs('#hospital-login-form');
    if (!form) return;
    const alertId = 'hospital-login-alert';
    initRecaptcha('hospital-login-recaptcha');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(alertId);
      const body = Object.fromEntries(new FormData(form).entries());
      body.recaptchaToken = getRecaptchaToken('hospital-login-recaptcha');
      try {
        const { hospital } = await api.loginHospital(body);
        auth.setHospital(hospital);
        location.href = '/hospital/dashboard';
      } catch (err) {
        showAlert(alertId, 'danger', err.message);
      }
    });
  }

  function initHospitalDashboard() {
    const hosp = requireHospital();
    const hospForm = qs('#hospital-profile-form');
    if (!hospForm || !hosp) return;
    const docForm = qs('#doctor-profile-form');
    const alertId = 'hospital-dashboard-alert';
    const fillHosp = (data) => {
      ['name','email','address','morning_from','morning_to','evening_from','evening_to','latitude','longitude'].forEach((f) => {
        if (hospForm.elements[f]) hospForm.elements[f].value = data[f] ?? '';
      });
      if (hospForm.elements['emergency']) hospForm.elements['emergency'].value = data.emergency ? 'yes' : 'no';
    };
    const fillDoc = (data) => {
      ['name','qualification','specialization','description'].forEach((f) => {
        if (docForm?.elements[f]) docForm.elements[f].value = data[f] ?? '';
      });
    };
    fillHosp(hosp);
    fillDoc(hosp.doctor || {});

    qs('#hospital-dash-location-btn')?.addEventListener('click', () => {
      geoFill(hospForm.elements['latitude'], hospForm.elements['longitude']);
    });
    qs('#hospital-profile-reset')?.addEventListener('click', () => { fillHosp(auth.hospital() || {}); hideAlert(alertId); });
    qs('#doctor-profile-reset')?.addEventListener('click', () => { fillDoc((auth.hospital() || {}).doctor || {}); hideAlert(alertId); });

    hospForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(alertId);
      const body = Object.fromEntries(new FormData(hospForm).entries());
      body.emergency = body.emergency === 'yes';
      try {
        const { hospital, doctor } = await api.updateHospital(hosp.id, body);
        hospital.doctor = doctor;
        auth.setHospital(hospital);
        showAlert(alertId, 'success', 'Hospital updated');
        fillHosp(hospital);
        fillDoc(doctor || {});
      } catch (err) {
        showAlert(alertId, 'danger', err.message);
      }
    });

    docForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(alertId);
      const body = Object.fromEntries(new FormData(docForm).entries());
      const doctorId = (auth.hospital() || {}).doctor?.id;
      if (!doctorId) { showAlert(alertId, 'danger', 'Doctor not found'); return; }
      try {
        const { doctor } = await api.updateDoctor(doctorId, body);
        const updated = { ...auth.hospital(), doctor };
        auth.setHospital(updated);
        showAlert(alertId, 'success', 'Doctor updated');
      } catch (err) {
        showAlert(alertId, 'danger', err.message);
      }
    });
  }

  function initBook() {
    const form = qs('#book-form');
    if (!form) return;
    const user = requireUser();
    if (!user) return;
    const alertId = 'book-alert';
    const results = qs('#book-results');
    const empty = qs('#book-empty');
    let selected = null;

    const renderResults = (doctors) => {
      results.innerHTML = '';
      doctors.forEach((doc) => {
        const col = document.createElement('div');
        col.className = 'col-md-6';
        col.innerHTML = `
          <div class="card h-100" data-id="${doc.id}">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h5 class="mb-1">${doc.name || 'Doctor'}</h5>
                  <p class="text-muted mb-1">${doc.specialization || 'General'} · ${doc.qualification || ''}</p>
                  <p class="text-muted mb-1">${doc.hospital_name || 'Hospital'}</p>
                  <p class="text-muted mb-1">${doc.hospital_address || ''}</p>
                  ${doc.distance_km !== undefined && doc.distance_km !== null ? `<p class="text-muted mb-1">${doc.distance_km.toFixed(1)} km away</p>` : ''}
                </div>
                <span class="badge bg-secondary">Queue live</span>
              </div>
              <button class="btn btn-outline-primary btn-sm mt-2 select-doc" type="button">Select</button>
            </div>
          </div>`;
        results.appendChild(col);
      });
      empty.classList.toggle('d-none', doctors.length > 0);
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(alertId);
      const body = Object.fromEntries(new FormData(form).entries());
      const params = {};
      if (body.reason && body.reason !== 'Other') params.specialization = body.reason;
      if (user.latitude && user.longitude) {
        params.userLat = user.latitude;
        params.userLng = user.longitude;
      }
      try {
        const { doctors } = await api.searchDoctors(params);
        const filtered = body.search ? (doctors || []).filter((d) => {
          const text = `${d.name || ''} ${d.hospital_name || ''} ${d.specialization || ''}`.toLowerCase();
          return text.includes(body.search.toLowerCase());
        }) : doctors || [];
        renderResults(filtered);
        selected = null;
      } catch (err) {
        showAlert(alertId, 'danger', err.message);
      }
    });

    results.addEventListener('click', (e) => {
      if (!e.target.classList.contains('select-doc')) return;
      const card = e.target.closest('.card');
      qsa('.card', results).forEach((c) => c.classList.remove('border-primary'));
      card.classList.add('border-primary');
      selected = card.dataset.id;
      const doc = qsa('.card', results).find((c) => c.dataset.id === selected);
      if (doc) showAlert(alertId, 'info', 'Doctor selected. Add problem and confirm.');
    });

    qs('#book-confirm')?.addEventListener('click', async () => {
      hideAlert(alertId);
      if (!selected) { showAlert(alertId, 'danger', 'Select a doctor first'); return; }
      const problem = qs('#book-problem')?.value || 'N/A';
      const body = Object.fromEntries(new FormData(form).entries());
      const doctorCard = qsa('.card', results).find((c) => c.dataset.id === selected);
      const doctorData = doctorCard ? (doctorCard.querySelector('h5')?.textContent || '') : '';
      try {
        const all = await api.searchDoctors({});
        const doc = (all.doctors || []).find((d) => d.id === selected);
        if (!doc) throw new Error('Doctor not found');
        const payload = {
          userId: user.id,
          hospitalId: doc.hospital_id,
          doctorId: doc.id,
          problem,
          preferredTime: `${body.date || 'soon'} ${body.slot || ''}`.trim()
        };
        await api.createAppointment(payload);
        showAlert(alertId, 'success', 'Appointment booked');
        setTimeout(() => { location.href = '/user/dashboard'; }, 800);
      } catch (err) {
        showAlert(alertId, 'danger', err.message);
      }
    });
  }

  function initRebook() {
    const listEl = qs('#rebook-list');
    if (!listEl) return;
    const user = requireUser();
    if (!user) return;
    const alertId = 'rebook-alert';
    const empty = qs('#rebook-empty');

    const render = (items) => {
      listEl.innerHTML = '';
      items.forEach((a) => {
        const col = document.createElement('div');
        col.className = 'col-md-6';
        col.innerHTML = `
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">${a.reason || 'Previous appointment'}</h5>
              <p class="text-muted mb-1">Doctor: ${a.doctor_id || 'N/A'}</p>
              <p class="text-muted mb-1">Hospital: ${a.hospital_id || 'N/A'}</p>
              <p class="text-muted mb-1">Status: ${a.status}</p>
              <p class="text-muted mb-1">Preferred: ${a.preferred_time || 'N/A'}</p>
              <p class="text-muted mb-1">Problem: ${a.problem || 'N/A'}</p>
              <button class="btn btn-primary btn-sm mt-2 rebook-btn" data-id="${a.id}" type="button">Rebook</button>
            </div>
          </div>`;
        listEl.appendChild(col);
      });
      empty.classList.toggle('d-none', items.length > 0);
    };

    async function loadHistory() {
      hideAlert(alertId);
      try {
        const { appointments } = await api.listAppointments({ userId: user.id });
        render(appointments || []);
      } catch (err) {
        showAlert(alertId, 'danger', err.message);
      }
    }

    listEl.addEventListener('click', async (e) => {
      if (!e.target.classList.contains('rebook-btn')) return;
      hideAlert(alertId);
      const id = e.target.dataset.id;
      try {
        const { appointments } = await api.listAppointments({ userId: user.id });
        const appt = (appointments || []).find((a) => a.id === id);
        if (!appt) throw new Error('Appointment not found');
        await api.createAppointment({
          userId: user.id,
          hospitalId: appt.hospital_id,
          doctorId: appt.doctor_id,
          problem: appt.problem || 'Follow-up',
          preferredTime: appt.preferred_time || 'soon'
        });
        showAlert(alertId, 'success', 'Re-appointment booked');
        setTimeout(() => location.href = '/user/dashboard', 700);
      } catch (err) {
        showAlert(alertId, 'danger', err.message);
      }
    });

    qs('#rebook-refresh')?.addEventListener('click', loadHistory);
    loadHistory();
  }

  function initFirstAid() {
    const promptEl = qs('#firstaid-prompt');
    if (!promptEl) return;
    const alertId = 'firstaid-alert';
    const responseEl = qs('#firstaid-response');
    qs('#firstaid-submit')?.addEventListener('click', async () => {
      hideAlert(alertId);
      responseEl.innerHTML = '';
      const prompt = promptEl.value.trim();
      if (!prompt) return;
      try {
        const user = auth.user();
        const { response } = await api.firstAid({ userId: user?.id, prompt });
        responseEl.innerHTML = `<div class="card"><div class="card-body">${response.replace(/\n/g, '<br>')}</div></div>`;
      } catch (err) {
        showAlert(alertId, 'danger', err.message);
      }
    });
  }

  function initQR() {
    const input = qs('#qr-input');
    if (!input) return;
    const msg = qs('#qr-message');
    const alertId = 'qr-alert';
    qs('#qr-open')?.addEventListener('click', () => {
      hideAlert(alertId);
      msg.textContent = '';
      const value = input.value.trim();
      if (!value) { showAlert(alertId, 'warning', 'Paste the QR link or hospital code'); return; }
      try {
        const url = new URL(value);
        const hospId = url.searchParams.get('h');
        if (hospId) {
          msg.textContent = 'Opening hospital page…';
          location.href = `/hospital/${hospId}`;
        } else {
          msg.textContent = 'No hospital id found in QR';
        }
      } catch (_err) {
        msg.textContent = 'Invalid QR code';
      }
    });
  }

  function initDoctorDashboard() {
    const waitingEl = qs('#doctor-waiting');
    if (!waitingEl) return;
    const alertId = 'doctor-alert';
    const hospital = requireHospital();
    const doctor = hospital?.doctor;
    if (!doctor) { location.href = '/hospital/login'; return; }
    const countsList = qs('#doctor-today-counts');
    const todayList = qs('#doctor-today-list');
    const apptList = qs('#doctor-appt-list');
    const todayEmpty = qs('#doctor-today-empty');
    const apptEmpty = qs('#doctor-appt-empty');
    const loadingText = qs('#doctor-loading');

    qs('#doctor-name').textContent = `${doctor.name} · ${doctor.specialization || 'Specialist'}`;
    qs('#doctor-hospital').textContent = `Hospital: ${hospital.name}`;
    qs('#doctor-availability').textContent = `Emergency: ${hospital.emergency ? 'ON' : 'OFF'}`;

    const templates = [
      'List immediate red flags to rule out and when to escalate to emergency care.',
      'Suggest a focused physical exam sequence for the presenting symptoms.',
      'Recommend initial labs or imaging with brief rationale and urgency.',
      'Give a plain-language explanation and home-care advice for the current problem.',
      'Outline a safe follow-up schedule and warning signs to revisit sooner.'
    ];
    const tplWrap = qs('#doctor-ai-templates');
    templates.forEach((t) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-outline-secondary btn-sm';
      btn.textContent = t.split(' ')[0] + '…';
      btn.onclick = () => { const area = qs('#doctor-ai-prompt'); area.value = area.value ? `${area.value}\n${t}` : t; };
      tplWrap?.appendChild(btn);
    });

    async function loadAppointments() {
      loadingText.textContent = 'Loading…';
      hideAlert(alertId);
      try {
        const [{ appointments = [] }, { appointments: today = [] }] = await Promise.all([
          api.listAppointments({ doctorId: doctor.id }),
          api.listTodayAppointments({ doctorId: doctor.id })
        ]);
        const counts = { Booked: 0, 'In Consultation': 0, Completed: 0, Cancelled: 0 };
        appointments.forEach((a) => { counts[a.status] = (counts[a.status] || 0) + 1; });
        waitingEl.textContent = counts['Booked'] || 0;
        countsList.innerHTML = '';
        Object.entries(counts).forEach(([label, value]) => {
          const li = document.createElement('li');
          li.textContent = `${label}: ${value}`;
          countsList.appendChild(li);
        });

        const renderCards = (container, items, emptyEl, withActions) => {
          container.innerHTML = '';
          items.forEach((a) => {
            const col = document.createElement('div');
            col.className = 'col-md-6';
            col.innerHTML = `
              <div class="card h-100">
                <div class="card-body">
                  <h5 class="card-title">${a.reason || 'Visit'}</h5>
                  <p class="text-muted mb-1">Patient: ${a.user_name || a.user_id || 'N/A'}</p>
                  <p class="text-muted mb-1">Contact: ${a.user_email || 'N/A'} · ${a.user_mobile || 'N/A'}</p>
                  <p class="text-muted mb-1">Time: ${a.preferred_time || 'N/A'}</p>
                  <p class="text-muted mb-1">Status: ${a.status}</p>
                  <p class="text-muted mb-1">Problem: ${a.problem || 'N/A'}</p>
                  ${withActions ? `
                  <div class="d-flex gap-2 flex-wrap mt-2">
                    <button class="btn btn-outline-primary btn-sm appt-action" data-id="${a.id}" data-action="get-in" ${a.status === 'In Consultation' || a.status === 'Completed' ? 'disabled' : ''}>Get-in</button>
                    <button class="btn btn-success btn-sm appt-action" data-id="${a.id}" data-action="complete" ${a.status === 'Completed' ? 'disabled' : ''}>Complete</button>
                    <button class="btn btn-outline-danger btn-sm appt-action" data-id="${a.id}" data-action="cancel" ${a.status === 'Cancelled' ? 'disabled' : ''}>Cancel</button>
                  </div>` : ''}
                </div>
              </div>`;
            container.appendChild(col);
          });
          emptyEl.classList.toggle('d-none', items.length > 0);
        };

        renderCards(todayList, today, todayEmpty, false);
        renderCards(apptList, appointments, apptEmpty, true);
      } catch (err) {
        showAlert(alertId, 'danger', err.message);
      } finally {
        loadingText.textContent = '';
      }
    }

    apptList?.addEventListener('click', async (e) => {
      if (!e.target.classList.contains('appt-action')) return;
      const id = e.target.dataset.id;
      const action = e.target.dataset.action;
      hideAlert(alertId);
      try {
        if (action === 'get-in') await api.getInAppointment(id);
        if (action === 'complete') await api.completeAppointment(id);
        if (action === 'cancel') await api.cancelAppointment(id);
        await loadAppointments();
      } catch (err) {
        showAlert(alertId, 'danger', err.message);
      }
    });

    qs('#doctor-ai-submit')?.addEventListener('click', async () => {
      const prompt = qs('#doctor-ai-prompt')?.value || '';
      if (!prompt.trim()) return;
      hideAlert(alertId);
      try {
        const { response } = await api.firstAid({ prompt, userId: null });
        qs('#doctor-ai-response').textContent = response;
      } catch (err) {
        showAlert(alertId, 'danger', err.message);
      }
    });

    loadAppointments();
  }

  function initHospitalView() {
    const holder = qs('#hospital-view-id');
    if (!holder) return;
    const hospitalId = holder.dataset.hospitalId;
    const alertId = 'hospital-view-alert';
    (async () => {
      try {
        const { hospital, doctor } = await api.getHospital(hospitalId);
        qs('#hospital-view-name').textContent = hospital.name || 'Hospital';
        qs('#hospital-view-address').textContent = hospital.address || '';
        qs('#hospital-view-meta').innerHTML = `
          <p class="mb-1 text-muted">Emergency: ${hospital.emergency ? 'Yes' : 'No'}</p>
          <p class="mb-1 text-muted">Timing: ${(hospital.morning_from || '')} - ${(hospital.morning_to || '')}, ${(hospital.evening_from || '')} - ${(hospital.evening_to || '')}</p>
          <p class="mb-1 text-muted">Location: ${(hospital.latitude ?? '')}, ${(hospital.longitude ?? '')}</p>`;
        qs('#hospital-view-doctor').innerHTML = doctor ? `
          <div class="border rounded p-3">
            <p class="mb-1 fw-semibold">Doctor: ${doctor.name}</p>
            <p class="mb-1 text-muted">${doctor.specialization || 'Specialist'} · ${doctor.qualification || ''}</p>
            <p class="mb-0 text-muted">${doctor.description || ''}</p>
          </div>` : '';
      } catch (err) {
        showAlert(alertId, 'danger', err.message);
      }
    })();
  }

  function initFirstPageRouting() {
    const page = document.body.dataset.page;
    hydrateBadges();
    if (page === 'user-register') initUserRegister();
    if (page === 'user-login') initUserLogin();
    if (page === 'user-dashboard') initUserDashboard();
    if (page === 'book') initBook();
    if (page === 'rebook') initRebook();
    if (page === 'firstaid') initFirstAid();
    if (page === 'qr') initQR();
    if (page === 'hospital-register') initHospitalRegister();
    if (page === 'hospital-login') initHospitalLogin();
    if (page === 'hospital-dashboard') initHospitalDashboard();
    if (page === 'doctor-dashboard') initDoctorDashboard();
    if (page === 'hospital-view') initHospitalView();
  }

  window.addEventListener('load', () => {
    if (RECAPTCHA_SITE_KEY && window.grecaptcha && window.grecaptcha.ready) {
      window.grecaptcha.ready(() => {
        ['user-register-recaptcha','user-login-recaptcha','hospital-register-recaptcha','hospital-login-recaptcha'].forEach(initRecaptcha);
        initFirstPageRouting();
      });
    } else {
      initFirstPageRouting();
    }
  });
})();
