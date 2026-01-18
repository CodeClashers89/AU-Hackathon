/**
 * Seva Setu - Doctor Terminal Logic
 * Refined and Optimized Version
 */

// State Management
let currentSection = 'dashboard';
let appointments = [];
let activeAppointmentId = null;
let patients = [];
let records = [];
let unavailabilityPeriods = [];
let doctorProfile = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeSidebarNavigation();
    loadDoctorProfile();
    loadDashboardData();
    setupEventListeners();
});

function initializeSidebarNavigation() {
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('onclick')) return;
            e.preventDefault();
            const section = link.getAttribute('data-section');
            if (section) switchSection(section);
        });
    });
}

function switchSection(section) {
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
    document.querySelectorAll('.section-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${section}-section`)?.classList.add('active');
    currentSection = section;
    loadSectionData(section);
}

function loadSectionData(sec) {
    if (sec === 'dashboard') loadDashboardData();
    else if (sec === 'appointments') loadAllAppointments();
    else if (sec === 'patients') loadPatients();
    else if (sec === 'records') loadMedicalRecords();
    else if (sec === 'unavailability') loadUnavailability();
    else if (sec === 'profile') updateProfileDisplay();
}

// Data Fetching & Display
async function loadDoctorProfile() {
    try {
        const r = await fetch(`${API_BASE}/doctors/me/`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (r.ok) {
            doctorProfile = await r.json();
            updateProfileDisplay();
        }
    } catch (e) { console.error('Profile fetch failed:', e); }
}

function updateProfileDisplay() {
    if (!doctorProfile) return;
    const initials = (doctorProfile.user.first_name[0] + doctorProfile.user.last_name[0]).toUpperCase();
    if (document.getElementById('profile-avatar')) document.getElementById('profile-avatar').textContent = initials;
    if (document.getElementById('profile-full-name')) document.getElementById('profile-full-name').textContent = `${doctorProfile.user.first_name} ${doctorProfile.user.last_name}`;
    if (document.getElementById('doctor-name')) document.getElementById('doctor-name').textContent = `${doctorProfile.user.first_name} ${doctorProfile.user.last_name}`;
    if (document.getElementById('profile-specialization')) document.getElementById('profile-specialization').textContent = doctorProfile.specialization;
    if (document.getElementById('profile-email')) document.getElementById('profile-email').textContent = doctorProfile.user.email;
    if (document.getElementById('profile-phone')) document.getElementById('profile-phone').textContent = doctorProfile.user.phone_number || 'N/A';
    if (document.getElementById('profile-license')) document.getElementById('profile-license').textContent = doctorProfile.license_number;
    if (document.getElementById('profile-qualification')) document.getElementById('profile-qualification').textContent = doctorProfile.qualification;
    if (document.getElementById('profile-experience')) document.getElementById('profile-experience').textContent = doctorProfile.experience_years;
    if (document.getElementById('profile-fee')) document.getElementById('profile-fee').textContent = doctorProfile.consultation_fee;
    if (document.getElementById('profile-hospital')) document.getElementById('profile-hospital').textContent = doctorProfile.hospital_affiliation || 'N/A';

    const b = document.getElementById('profile-availability');
    if (b) {
        b.textContent = doctorProfile.is_available ? 'Available' : 'Unavailable';
        b.className = `badge ${doctorProfile.is_available ? 'badge-success' : 'badge-danger'}`;
    }
}

async function loadDashboardData() {
    await loadAllAppointments();
    updateDashboardStats();
    displayTodaySchedule();
}

function updateDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const tApts = appointments.filter(a => a.appointment_date === today);
    const pApts = appointments.filter(a => a.status === 'scheduled');
    const cApts = appointments.filter(a => a.appointment_date === today && a.status === 'completed');
    const uPts = new Set(appointments.map(a => a.patient.id));

    if (document.getElementById('today-appointments')) document.getElementById('today-appointments').textContent = tApts.length;
    if (document.getElementById('total-patients')) document.getElementById('total-patients').textContent = uPts.size;
    if (document.getElementById('pending-appointments')) document.getElementById('pending-appointments').textContent = pApts.length;
    if (document.getElementById('completed-today')) document.getElementById('completed-today').textContent = cApts.length;
}

function displayTodaySchedule() {
    const today = new Date().toISOString().split('T')[0];
    const tApts = appointments.filter(a => a.appointment_date === today).sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
    const tbody = document.getElementById('today-schedule');
    if (!tbody) return;

    if (tApts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:3rem; opacity:0.5;">No appointments scheduled for today</td></tr>';
        return;
    }
    tbody.innerHTML = tApts.map(a => `
        <tr>
            <td>${formatTime(a.appointment_time)}</td>
            <td>${a.patient.first_name} ${a.patient.last_name}</td>
            <td>${a.reason}</td>
            <td>${getStatusBadge(a.status)}</td>
            <td>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn btn-sm btn-primary" onclick="viewAppointment(${a.id})">View</button>
                    ${a.status === 'scheduled' ? `<button class="btn btn-sm btn-success" onclick="completeAppointment(${a.id})">Complete</button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadAllAppointments() {
    try {
        const r = await fetch(`${API_BASE}/appointments/`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (r.ok) {
            const d = await r.json();
            appointments = d.results || d;
            displayAppointments();
        }
    } catch (e) { showNotification('Error loading appointments', 'error'); }
}

function displayAppointments() {
    const tbody = document.getElementById('appointments-table');
    if (!tbody) return;
    let fApts = [...appointments];
    const s = document.getElementById('appointment-status-filter')?.value;
    const d = document.getElementById('appointment-date-filter')?.value;
    const q = document.getElementById('appointment-search')?.value.toLowerCase();

    if (s) fApts = fApts.filter(a => a.status === s);
    if (d) fApts = fApts.filter(a => a.appointment_date === d);
    if (q) fApts = fApts.filter(a => `${a.patient.first_name} ${a.patient.last_name}`.toLowerCase().includes(q));

    if (fApts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:3rem; opacity:0.5;">No matching appointments found</td></tr>';
        return;
    }
    tbody.innerHTML = fApts.map(a => `
        <tr>
            <td>${formatDate(a.appointment_date)} ${formatTime(a.appointment_time)}</td>
            <td>${a.patient.first_name} ${a.patient.last_name}</td>
            <td>${a.patient.phone_number || 'N/A'}</td>
            <td>${a.reason}</td>
            <td>${getStatusBadge(a.status)}</td>
            <td>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn btn-sm btn-primary" onclick="viewAppointment(${a.id})">Details</button>
                    ${a.status === 'scheduled' ? `
                        <button class="btn btn-sm btn-success" onclick="completeAppointment(${a.id})">Complete</button>
                        <button class="btn btn-sm btn-danger" onclick="cancelAppointment(${a.id})">Cancel</button>
                    `: ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function viewAppointment(id) {
    const a = appointments.find(x => x.id === id);
    if (!a) return;
    const d = document.getElementById('appointment-details');
    if (d) {
        d.innerHTML = `
            <div style="margin-bottom:2rem;">
                <h4 style="margin-bottom:1rem; color:var(--gov-blue);">SUBJECT PROFILE</h4>
                <p><strong>Name:</strong> ${a.patient.first_name} ${a.patient.last_name}</p>
                <p><strong>Email:</strong> ${a.patient.email}</p>
                <p><strong>Phone:</strong> ${a.patient.phone_number || 'N/A'}</p>
            </div>
            <div>
                <h4 style="margin-bottom:1rem; color:var(--gov-blue);">SESSION INTEL</h4>
                <p><strong>Timing:</strong> ${formatDate(a.appointment_date)} @ ${formatTime(a.appointment_time)}</p>
                <p><strong>Reason:</strong> ${a.reason}</p>
                <p><strong>Status:</strong> ${getStatusBadge(a.status)}</p>
                ${a.notes ? `<p><strong>Notes:</strong> ${a.notes}</p>` : ''}
            </div>
            ${a.medical_record_id ? `<button class="btn btn-success" style="margin-top:2rem; width:100%;" onclick="printPrescription(${a.medical_record_id})">📄 GET PRESCRIPTION PDF</button>` : ''}
        `;
        openModal('appointment-modal');
    }
}

function openModal(id) { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

async function completeAppointment(id) {
    if (!confirm('Initialize Diagnostic Archive for this subject?')) return;
    const a = appointments.find(x => x.id === id);
    if (!a) return;
    activeAppointmentId = id;
    const s = document.getElementById('record-patient');
    if (s) {
        s.innerHTML = `<option value="${a.patient.id}">${a.patient.first_name} ${a.patient.last_name}</option>`;
        s.value = a.patient.id;
        s.disabled = true;
    }
    openModal('create-record-modal');
}

async function cancelAppointment(id) {
    if (!confirm('Abort this planned session?')) return;
    try {
        const r = await fetch(`${API_BASE}/appointments/${id}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'cancelled' })
        });
        if (r.ok) {
            showNotification('Session Aborted', 'success');
            loadAllAppointments();
            updateDashboardStats();
        }
    } catch (e) { showNotification('Abort failed', 'error'); }
}

async function loadPatients() {
    patients = appointments.map(a => a.patient).filter((p, i, self) => i === self.findIndex(x => x.id === p.id));
    displayPatients();
}

function displayPatients() {
    const c = document.getElementById('patients-list');
    if (!c) return;
    let fP = [...patients];
    const q = document.getElementById('patient-search')?.value.toLowerCase();
    if (q) fP = fP.filter(p => `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));

    if (fP.length === 0) {
        c.innerHTML = '<div style="text-align:center; padding:4rem; opacity:0.5;">No subjects found in database</div>';
        return;
    }
    c.innerHTML = fP.map(p => `
        <div class="patient-card">
            <div>
                <h4 style="color:var(--gov-blue);">${p.first_name} ${p.last_name}</h4>
                <p style="font-size:0.9rem; opacity:0.6;">${p.email} | ${p.phone_number || 'N/A'}</p>
            </div>
            <button class="btn btn-sm btn-primary" onclick="viewPatientHistory(${p.id})">ACCESS LOGS</button>
        </div>
    `).join('');
}

async function viewPatientHistory(pid) {
    try {
        const r = await fetch(`${API_BASE}/medical-records/patient_history/?patient_id=${pid}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (r.ok) {
            const h = await r.json();
            const p = patients.find(x => x.id === pid);
            if (document.getElementById('patient-history-name')) document.getElementById('patient-history-name').textContent = `${p.first_name} ${p.last_name}`;
            const c = document.getElementById('patient-history-content');
            if (!c) return;

            if (h.length === 0) {
                c.innerHTML = '<p style="text-align:center; padding:3rem; opacity:0.5;">No archived logs for this subject</p>';
            } else {
                c.innerHTML = h.map(x => `
                    <div style="border:1px solid #f1f5f9; padding:2rem; margin-bottom:1.5rem; background:#fafafa;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                            <h4 style="color:var(--gov-blue);">${formatDate(x.created_at)}</h4>
                            <span class="badge badge-info">Dr. ${x.doctor_name || 'System'}</span>
                        </div>
                        <p><strong>Diagnosis:</strong> ${x.diagnosis}</p>
                        <p><strong>Symptoms:</strong> ${x.symptoms}</p>
                        <p style="margin-top:1rem;"><strong>Treatment:</strong> ${x.treatment_plan}</p>
                        ${x.prescriptions && x.prescriptions.length > 0 ? `
                            <div style="margin-top:1.5rem; background:white; padding:1rem; border-radius:4px;">
                                <label style="font-size:0.7rem; font-weight:800; opacity:0.5;">PHARMACEUTICALS</label>
                                ${x.prescriptions.map(m => `<div style="padding:0.5rem 0; border-bottom:1px solid #f1f5f9;"><strong>${m.medication_name}</strong> - ${m.dosage} (${m.frequency})</div>`).join('')}
                            </div>
                        `: ''}
                        <button class="btn btn-sm btn-success" style="margin-top:1.5rem;" onclick="printPrescription(${x.id})">PRINT LOG</button>
                    </div>
                `).join('');
            }
            openModal('patient-history-modal');
        }
    } catch (e) { showNotification('Access Denied', 'error'); }
}

async function loadMedicalRecords() {
    try {
        const r = await fetch(`${API_BASE}/medical-records/`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (r.ok) {
            const d = await r.json();
            records = d.results || d;
            displayMedicalRecords();
        }
    } catch (e) { showNotification('Archive failure', 'error'); }
}

function displayMedicalRecords() {
    const c = document.getElementById('records-list');
    if (!c) return;
    if (records.length === 0) {
        c.innerHTML = '<div style="text-align:center; padding:4rem; opacity:0.5;">Archive is empty</div>';
        return;
    }
    c.innerHTML = records.map(r => `
        <div class="ultra-card" style="padding:1.5rem; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h4 style="color:var(--gov-blue);">${r.patient ? `${r.patient.first_name} ${r.patient.last_name}` : 'Unknown Subject'}</h4>
                <p style="opacity:0.6; font-size:0.9rem;">${formatDate(r.created_at)} | ${r.diagnosis}</p>
            </div>
            <button class="btn btn-sm btn-success" onclick="printPrescription(${r.id})">📄 GET PDF</button>
        </div>
    `).join('');
}

function openCreateRecordModal() {
    activeAppointmentId = null;
    const s = document.getElementById('record-patient');
    if (s) {
        s.innerHTML = '<option value="">Select Subject</option>' + patients.map(p => `<option value="${p.id}">${p.first_name} ${p.last_name}</option>`).join('');
        s.disabled = false;
    }
    document.getElementById('create-record-form')?.reset();
    if (document.getElementById('prescriptions-container')) document.getElementById('prescriptions-container').innerHTML = '';
    openModal('create-record-modal');
}

async function loadUnavailability() {
    try {
        const r = await fetch(`${API_BASE}/unavailability/`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (r.ok) {
            const d = await r.json();
            unavailabilityPeriods = d.results || d;
            displayUnavailability();
        }
    } catch (e) { }
}

function displayUnavailability() {
    const c = document.getElementById('unavailability-list');
    if (!c) return;
    if (unavailabilityPeriods.length === 0) {
        c.innerHTML = '<div style="text-align:center; padding:4rem; opacity:0.5;">No blocks active</div>';
        return;
    }
    c.innerHTML = unavailabilityPeriods.map(p => `
        <div class="unavailability-item" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h4 style="color:var(--gov-blue);">${p.reason}</h4>
                <p style="font-size:0.9rem; opacity:0.7;">${formatDate(p.start_date)} to ${formatDate(p.end_date)}</p>
                ${p.start_time ? `<p style="font-size:0.8rem; opacity:0.5;">Time: ${formatTime(p.start_time)} - ${formatTime(p.end_time)}</p>` : ''}
            </div>
            <button class="btn btn-sm btn-danger" onclick="deleteUnavailability(${p.id})">REMOVE</button>
        </div>
    `).join('');
}

function openUnavailabilityModal() { openModal('unavailability-modal'); }

async function deleteUnavailability(id) {
    if (!confirm('Lift this schedule block?')) return;
    try {
        const r = await fetch(`${API_BASE}/unavailability/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (r.ok) { showNotification('Block Lifted', 'success'); loadUnavailability(); }
    } catch (e) { }
}

function setupEventListeners() {
    ['appointment-status-filter', 'appointment-date-filter', 'appointment-search'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', displayAppointments);
        document.getElementById(id)?.addEventListener('input', displayAppointments);
    });
    document.getElementById('patient-search')?.addEventListener('input', displayPatients);

    document.getElementById('create-record-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await finalizeRecord();
    });

    document.getElementById('unavailability-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await finalizeUnavailability();
    });
}

async function finalizeRecord() {
    const data = {
        patient_id: document.getElementById('record-patient').value,
        symptoms: document.getElementById('record-symptoms').value,
        diagnosis: document.getElementById('record-diagnosis').value,
        treatment_plan: document.getElementById('record-treatment').value,
        notes: document.getElementById('record-notes').value,
        appointment: activeAppointmentId,
        prescriptions: getPrescriptions()
    };
    try {
        const r = await fetch(`${API_BASE}/medical-records/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (r.ok) {
            if (activeAppointmentId) await fetch(`${API_BASE}/appointments/${activeAppointmentId}/complete/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            showNotification('Archive Entry Finalized', 'success');
            closeModal('create-record-modal');
            loadMedicalRecords(); loadAllAppointments(); updateDashboardStats();
        }
    } catch (e) { showNotification('Entry failed', 'error'); }
}

async function finalizeUnavailability() {
    const data = {
        start_date: document.getElementById('unavail-start').value,
        end_date: document.getElementById('unavail-end').value,
        reason: document.getElementById('unavail-reason').value,
        start_time: document.getElementById('unavail-start-time').value || null,
        end_time: document.getElementById('unavail-end-time').value || null,
        is_recurring: document.getElementById('unavail-recurrence').value !== 'none',
        recurrence_pattern: document.getElementById('unavail-recurrence').value
    };
    try {
        const r = await fetch(`${API_BASE}/unavailability/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (r.ok) {
            showNotification('Block Initialized', 'success');
            closeModal('unavailability-modal');
            loadUnavailability();
        }
    } catch (e) { showNotification('Block failed', 'error'); }
}

function addMedicineRow() {
    const t = document.getElementById('medicine-row-template');
    const c = document.getElementById('prescriptions-container');
    if (!t || !c) return;
    const clone = t.content.cloneNode(true);
    const sel = clone.querySelector('.medicine-frequency');
    if (sel) sel.onchange = function () { updateTimingOptions(this); };
    c.appendChild(clone);
}

function updateTimingOptions(sel) {
    const row = sel.closest('.medicine-row');
    const cont = row.querySelector('.medicine-timings-container');
    if (!cont) return;
    const val = sel.value;
    let n = 1;
    if (val === 'Twice daily') n = 2;
    else if (val === 'Thrice daily') n = 3;
    cont.innerHTML = '';
    for (let i = 0; i < n; i++) {
        const s = document.createElement('select');
        s.className = 'form-select medicine-timing';
        s.innerHTML = `
            <option value="After breakfast">After breakfast</option>
            <option value="After lunch">After lunch</option>
            <option value="After dinner">After dinner</option>
            <option value="At bedtime">At bedtime</option>
            <option value="Empty stomach">Empty stomach</option>
        `;
        cont.appendChild(s);
    }
}

function removeMedicineRow(btn) { btn.closest('.medicine-row').remove(); }

function getPrescriptions() {
    const rx = [];
    document.querySelectorAll('.medicine-row').forEach(row => {
        const name = row.querySelector('.medicine-name').value.trim();
        if (name) {
            const tims = Array.from(row.querySelectorAll('.medicine-timing')).map(s => s.value).filter(v => v).join(', ');
            const dur = `${row.querySelector('.medicine-duration-value').value} ${row.querySelector('.medicine-duration-unit').value}`;
            rx.push({
                medication_name: name,
                dosage: row.querySelector('.medicine-dosage').value || 'As directed',
                frequency: row.querySelector('.medicine-frequency').value || 'As directed',
                duration: dur,
                instructions: `${tims}. ${row.querySelector('.medicine-instructions').value}`.trim()
            });
        }
    });
    return rx;
}

async function printPrescription(rid) {
    showNotification('Generating PDF...', 'info');
    try {
        const r = await fetch(`${API_BASE}/medical-records/${rid}/prescription_pdf/`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (r.ok) {
            const b = await r.blob();
            const u = window.URL.createObjectURL(b);
            window.open(u, '_blank');
        }
    } catch (e) { showNotification('PDF generation failed', 'error'); }
}

async function logout() {
    if (confirm('Terminate authenticated session?')) {
        localStorage.removeItem('authToken');
        window.location.href = '/login/';
    }
}

function showNotification(msg, type = 'success') {
    const n = document.getElementById('notification');
    if (!n) {
        // Fallback for standard alert
        alert(msg);
        return;
    }
    n.textContent = msg;
    n.className = `notification ${type}`;
    n.style.display = 'block';
    setTimeout(() => n.style.display = 'none', 3000);
}

function formatDate(s) {
    const d = new Date(s);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(s) {
    if (!s) return 'N/A';
    const [h, m] = s.split(':');
    const hr = parseInt(h);
    const am = hr >= 12 ? 'PM' : 'AM';
    return `${hr % 12 || 12}:${m} ${am}`;
}

function getStatusBadge(s) {
    const m = { 'scheduled': 'info', 'completed': 'success', 'cancelled': 'danger', 'no_show': 'warning' };
    return `<span class="badge badge-${m[s] || 'secondary'}">${s}</span>`;
}
