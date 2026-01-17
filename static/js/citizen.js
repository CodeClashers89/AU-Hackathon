// Citizen Portal - Dedicated JavaScript

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    checkCitizenAuth();
    loadUserProfile();
    initializeCitizenPortal();
});

// Authentication check
function checkCitizenAuth() {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');

    if (!token) {
        window.location.href = '/login/';
        return;
    }

    if (role && role !== 'citizen') {
        showNotification('This portal is for citizens only', 'error');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    }
}

// Load user profile
async function loadUserProfile() {
    try {
        const userName = localStorage.getItem('userName') || 'Citizen';
        const userEmail = localStorage.getItem('userEmail') || '';

        document.getElementById('user-name').textContent = userName;
        document.getElementById('welcome-name').textContent = userName.split(' ')[0];

        if (userEmail) {
            document.getElementById('user-role').textContent = userEmail;
        }
    } catch (error) {
        console.error('Failed to load user profile:', error);
    }
}

// Initialize portal - load all data
async function initializeCitizenPortal() {
    await Promise.all([
        loadDoctors(),
        loadCropCategories(),
        loadComplaintCategories(),
        loadAppointments(),
        loadMedicalHistory(),
        loadMyQueries(),
        loadAgriUpdates(),
        loadComplaints()
    ]);

    updateActivityCounts();
}

// Section navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active from all sidebar links
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    const section = document.getElementById(`${sectionName}-section`);
    if (section) {
        section.classList.add('active');
    }

    // Add active to clicked link
    const activeLink = document.querySelector(`a[href="#${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Load section-specific data
    if (sectionName === 'my-requests') {
        loadAllRequests();
    }
}

// Update activity counts
function updateActivityCounts() {
    // Count appointments
    apiCall('/healthcare/appointments/', 'GET', null, true)
        .then(response => {
            const appointments = response.results || response || [];
            document.getElementById('my-appointments-count').textContent = appointments.length;
        })
        .catch(() => {
            document.getElementById('my-appointments-count').textContent = '0';
        });

    // Count queries
    apiCall('/agriculture/queries/', 'GET', null, true)
        .then(response => {
            const queries = response.results || response || [];
            document.getElementById('my-queries-count').textContent = queries.length;
        })
        .catch(() => {
            document.getElementById('my-queries-count').textContent = '0';
        });

    // Count complaints
    apiCall('/city/complaints/', 'GET', null, true)
        .then(response => {
            const complaints = response.results || response || [];
            document.getElementById('my-complaints-count').textContent = complaints.length;
        })
        .catch(() => {
            document.getElementById('my-complaints-count').textContent = '0';
        });
}

// ============ HEALTHCARE FUNCTIONS ============

// Book appointment
async function bookAppointment(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const data = {
        doctor: parseInt(formData.get('doctor')),
        appointment_date: formData.get('appointment_date'),
        appointment_time: formData.get('appointment_time'),
        reason: formData.get('reason')
    };

    try {
        showLoading();
        await apiCall('/healthcare/appointments/', 'POST', data, true);
        showNotification('Appointment booked successfully!', 'success');
        form.reset();
        await loadAppointments();
        updateActivityCounts();
    } catch (error) {
        showNotification(error.message || 'Failed to book appointment', 'error');
    } finally {
        hideLoading();
    }
}

// Cancel appointment
async function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
        return;
    }

    try {
        showLoading();
        await apiCall(`/healthcare/appointments/${appointmentId}/`, 'DELETE', null, true);
        showNotification('Appointment cancelled successfully', 'success');
        await loadAppointments();
        updateActivityCounts();
    } catch (error) {
        showNotification(error.message || 'Failed to cancel appointment', 'error');
    } finally {
        hideLoading();
    }
}

// Enhanced load appointments
async function loadAppointments() {
    try {
        const response = await apiCall('/healthcare/appointments/', 'GET', null, true);
        const container = document.getElementById('appointments-list');

        if (!container) return;

        const appointments = response.results || response || [];

        if (appointments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <p>No appointments yet</p>
                    <p style="font-size: 0.875rem;">Book your first appointment above</p>
                </div>
            `;
            return;
        }

        container.innerHTML = appointments.map(apt => `
            <div class="request-card">
                <h4>${apt.doctor_name || 'Doctor'}</h4>
                <p style="color: var(--text-secondary); margin: 0.5rem 0;">
                    ${apt.reason || 'General consultation'}
                </p>
                <div class="request-meta">
                    <span class="badge badge-info">📅 ${apt.appointment_date}</span>
                    <span class="badge badge-info">🕐 ${apt.appointment_time}</span>
                    <span class="badge badge-${apt.status === 'scheduled' ? 'warning' : apt.status === 'completed' ? 'success' : 'danger'}">
                        ${apt.status}
                    </span>
                </div>
                ${apt.status === 'scheduled' ? `
                    <button class="btn btn-sm btn-danger" style="margin-top: 0.5rem;" onclick="cancelAppointment(${apt.id})">
                        Cancel Appointment
                    </button>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load appointments:', error);
        const container = document.getElementById('appointments-list');
        if (container) {
            container.innerHTML = '<p class="empty-state">Unable to load appointments</p>';
        }
    }
}

// ============ MEDICAL HISTORY FUNCTIONS ============

// Load Medical History
async function loadMedicalHistory() {
    try {
        const response = await apiCall('/healthcare/medical-records/', 'GET', null, true);
        const container = document.getElementById('medical-history-list');

        if (!container) return;

        const records = response.results || response || [];

        if (records.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <p>No medical records yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = records.map(record => `
            <div class="request-card">
                <h4>Diagnosis: ${record.diagnosis}</h4>
                <div style="margin: 0.5rem 0; font-size: 0.9rem;">
                    <p><strong>Doctor:</strong> ${record.doctor_name || 'Unknown'} | <strong>Date:</strong> ${new Date(record.created_at).toLocaleDateString()}</p>
                    
                    ${record.symptoms ? `<p><strong>Symptoms:</strong> ${record.symptoms}</p>` : ''}
                    ${record.treatment_plan ? `<p><strong>Treatment:</strong> ${record.treatment_plan}</p>` : ''}
                    
                    ${record.prescriptions && record.prescriptions.length > 0 ? `
                        <div style="margin-top: 0.5rem;">
                            <strong>Medicines:</strong>
                            <ul style="margin: 0.2rem 0 0 1.2rem; color: var(--text-secondary);">
                                ${record.prescriptions.map(p => `<li>${p.medication_name} - ${p.dosage} (${p.frequency})</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                <div class="request-meta">
                   <button class="btn btn-sm btn-primary" onclick="downloadPrescription(${record.id})">Download Prescription PDF</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load medical history:', error);
        const container = document.getElementById('medical-history-list');
        if (container) {
            container.innerHTML = '<p class="empty-state">Unable to load medical history</p>';
        }
    }
}

// Download Prescription
async function downloadPrescription(recordId) {
    try {
        const token = localStorage.getItem('authToken');
        showLoading();
        const response = await fetch(`/api/healthcare/medical-records/${recordId}/prescription_pdf/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        } else {
            showNotification('Failed to download PDF', 'error');
        }
    } catch (error) {
        console.error('PDF download error:', error);
        showNotification('Error downloading PDF', 'error');
    } finally {
        hideLoading();
    }
}

// ============ AGRICULTURE FUNCTIONS ============

// Load crop categories
async function loadCropCategories() {
    try {
        const categories = await apiCall('/agriculture/crop-categories/');
        const select = document.getElementById('crop-category-select');

        if (select) {
            const categoriesArray = categories.results || categories || [];
            select.innerHTML = '<option value="">Other / General Query</option>' +
                categoriesArray.map(cat =>
                    `<option value="${cat.id}">${cat.name}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Failed to load crop categories:', error);
    }
}

// Submit farmer query
async function submitFarmerQuery(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const cropCategoryValue = formData.get('crop_category');
    const data = {
        crop_category: cropCategoryValue ? parseInt(cropCategoryValue) : null,
        title: formData.get('title'),
        description: formData.get('description'),
        location: formData.get('location') || ''
    };

    try {
        showLoading();
        await apiCall('/agriculture/queries/', 'POST', data, true);
        showNotification('Query submitted successfully!', 'success');
        form.reset();
        await loadMyQueries();
        updateActivityCounts();
    } catch (error) {
        showNotification(error.message || 'Failed to submit query', 'error');
    } finally {
        hideLoading();
    }
}

// Load my queries
async function loadMyQueries() {
    try {
        const response = await apiCall('/agriculture/queries/', 'GET', null, true);
        const container = document.getElementById('my-queries-list');

        if (!container) return;

        const queries = response.results || response || [];

        // Store queries globally for viewing details
        window.myQueries = queries;

        if (queries.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🌾</div>
                    <p>No queries yet</p>
                    <p style="font-size: 0.875rem;">Submit your first query above</p>
                </div>
            `;
            return;
        }

        container.innerHTML = queries.map(query => `
            <div class="request-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h4>${query.title}</h4>
                    <span class="badge badge-${query.status === 'answered' ? 'success' : query.status === 'under_review' ? 'warning' : 'info'}">
                        ${query.status}
                    </span>
                </div>
                <p style="color: var(--text-secondary); margin: 0.5rem 0;">
                    ${query.description}
                </p>
                <div class="request-meta">
                    <span class="badge badge-info">${query.query_id || 'Pending ID'}</span>
                    ${query.location ? `<span class="badge badge-secondary">📍 ${query.location}</span>` : ''}
                    <span class="badge badge-secondary">📅 ${new Date(query.created_at).toLocaleDateString()}</span>
                </div>
                
                ${query.status === 'answered' ? `
                    <button class="btn btn-sm btn-primary" style="margin-top: 1rem;" onclick="viewQueryResponse(${query.id})">
                        View Response
                    </button>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load queries:', error);
        const container = document.getElementById('my-queries-list');
        if (container) {
            container.innerHTML = '<p class="empty-state">Unable to load queries</p>';
        }
    }
}

// View Query Response
function viewQueryResponse(queryId) {
    const query = window.myQueries ? window.myQueries.find(q => q.id === queryId) : null;
    if (!query) return;

    const modal = document.getElementById('response-modal');
    const content = document.getElementById('response-content');

    if (!modal || !content) return;

    const advisory = (query.advisories && query.advisories.length > 0) ? query.advisories[0] : null;

    content.innerHTML = `
        <div class="card" style="box-shadow: none; border: 1px solid var(--border-color);">
            <p><strong>Query:</strong> ${query.title}</p>
            <p><strong>Ref ID:</strong> ${query.query_id}</p>
            <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--border-color);">
            ${advisory ? `
                <h4 style="color: var(--success-color);">Expert Advice</h4>
                <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
                    ${advisory.advice}
                </div>
                <div class="request-meta">
                    <span class="badge badge-info">👤 Officer: ${advisory.officer_name || 'Agri Officer'}</span>
                    <span class="badge badge-info">📅 Answered on: ${new Date(advisory.created_at).toLocaleDateString()}</span>
                    ${advisory.is_validated ? '<span class="badge badge-success">✅ Verified Advice</span>' : ''}
                </div>
            ` : '<p class="text-error">Response is being finalized. Please check back soon.</p>'}
        </div>
    `;

    modal.classList.add('active');
}

function closeResponseModal() {
    const modal = document.getElementById('response-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Expose to window
window.viewQueryResponse = viewQueryResponse;
window.closeResponseModal = closeResponseModal;
window.cancelAppointment = cancelAppointment;
window.downloadPrescription = downloadPrescription;
window.submitFarmerQuery = submitFarmerQuery;
window.bookAppointment = bookAppointment;
window.submitComplaint = submitComplaint;
window.showSection = showSection;
window.logout = logout;


// Enhanced load agri updates
async function loadAgriUpdates() {
    try {
        const response = await apiCall('/agriculture/updates/');
        const container = document.getElementById('agri-updates-list');

        if (!container) return;

        const updates = response.results || response || [];

        if (updates.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📢</div>
                    <p>No updates available</p>
                </div>
            `;
            return;
        }

        container.innerHTML = updates.slice(0, 5).map(update => `
            <div class="request-card">
                <h4>${update.title}</h4>
                <p style="color: var(--text-secondary); margin: 0.5rem 0;">
                    ${update.content}
                </p>
                <div class="request-meta">
                    <span class="badge badge-${update.is_urgent ? 'danger' : 'info'}">
                        ${update.update_type}
                    </span>
                    ${update.is_urgent ? '<span class="badge badge-danger">⚠️ Urgent</span>' : ''}
                    ${update.district ? `<span class="badge badge-secondary">📍 ${update.district}</span>` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load agri updates:', error);
        const container = document.getElementById('agri-updates-list');
        if (container) {
            container.innerHTML = '<p class="empty-state">Unable to load updates</p>';
        }
    }
}

// ============ CITY SERVICES FUNCTIONS ============

// Load complaint categories
async function loadComplaintCategories() {
    try {
        const categories = await apiCall('/city/categories/');
        const select = document.getElementById('complaint-category-select');

        if (select) {
            const categoriesArray = categories.results || categories || [];
            select.innerHTML = '<option value="">Select category</option>' +
                categoriesArray.map(cat =>
                    `<option value="${cat.id}">${cat.name}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Failed to load complaint categories:', error);
    }
}

// Submit complaint
async function submitComplaint(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const data = {
        category: parseInt(formData.get('category')),
        title: formData.get('title'),
        description: formData.get('description'),
        location: formData.get('location')
    };

    try {
        showLoading();
        await apiCall('/city/complaints/', 'POST', data, true);
        showNotification('Complaint submitted successfully!', 'success');
        form.reset();
        await loadComplaints();
        updateActivityCounts();
    } catch (error) {
        showNotification(error.message || 'Failed to submit complaint', 'error');
    } finally {
        hideLoading();
    }
}

// Enhanced load complaints
async function loadComplaints() {
    try {
        const response = await apiCall('/city/complaints/', 'GET', null, true);
        const container = document.getElementById('complaints-list');

        if (!container) return;

        const complaints = response.results || response || [];

        // Store city complaints globally
        window.cityComplaints = complaints;

        if (complaints.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏙️</div>
                    <p>No complaints yet</p>
                    <p style="font-size: 0.875rem;">Report your first complaint above</p>
                </div>
            `;
            return;
        }

        container.innerHTML = complaints.map(complaint => `
            <div class="request-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h4>${complaint.title}</h4>
                    <span class="badge badge-${complaint.status === 'resolved' ? 'success' : complaint.status === 'in_progress' ? 'warning' : 'info'}">
                        ${complaint.status}
                    </span>
                </div>
                <p style="color: var(--text-secondary); margin: 0.5rem 0;">
                    ${complaint.description}
                </p>
                <div class="request-meta">
                    <span class="badge badge-info">${complaint.complaint_id || 'Pending ID'}</span>
                    ${complaint.location ? `<span class="badge badge-secondary">📍 ${complaint.location}</span>` : ''}
                    <span class="badge badge-secondary">📅 ${new Date(complaint.created_at).toLocaleDateString()}</span>
                </div>
                
                ${(complaint.status === 'in_progress' || complaint.status === 'resolved') ? `
                    <button class="btn btn-sm btn-primary" style="margin-top: 1rem;" onclick="viewResponse('city', ${complaint.id})">
                        View Response
                    </button>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load complaints:', error);
        const container = document.getElementById('complaints-list');
        if (container) {
            container.innerHTML = '<p class="empty-state">Unable to load complaints</p>';
        }
    }
}

// Unified View Response
function viewResponse(type, id) {
    let data = null;
    let modalTitle = 'Expert Response';

    if (type === 'agriculture') {
        data = window.myQueries ? window.myQueries.find(q => q.id === id) : null;
    } else if (type === 'city') {
        data = window.cityComplaints ? window.cityComplaints.find(c => c.id === id) : null;
        modalTitle = 'City Services Response';
    }

    if (!data) return;

    const modal = document.getElementById('response-modal');
    const content = document.getElementById('response-content');
    const title = modal.querySelector('h3');

    if (!modal || !content) return;
    if (title) title.textContent = modalTitle;

    let responseHtml = '';

    if (type === 'agriculture') {
        const advisory = (data.advisories && data.advisories.length > 0) ? data.advisories[0] : null;
        responseHtml = `
            <div class="card" style="box-shadow: none; border: 1px solid var(--border-color);">
                <p><strong>Query:</strong> ${data.title}</p>
                <p><strong>Ref ID:</strong> ${data.query_id}</p>
                <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--border-color);">
                ${advisory ? `
                    <h4 style="color: var(--success-color);">Expert Advice</h4>
                    <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
                        ${advisory.advice}
                    </div>
                    <div class="request-meta">
                        <span class="badge badge-info">👤 Officer: ${advisory.officer_name || 'Agri Officer'}</span>
                        <span class="badge badge-info">📅 ${new Date(advisory.created_at).toLocaleDateString()}</span>
                    </div>
                ` : '<p class="text-error">Response is being finalized.</p>'}
            </div>
        `;
    } else if (type === 'city') {
        const responses = data.responses || [];
        responseHtml = `
            <div class="card" style="box-shadow: none; border: 1px solid var(--border-color);">
                <p><strong>Complaint:</strong> ${data.title}</p>
                <p><strong>Ref ID:</strong> ${data.complaint_id}</p>
                <p><strong>Status:</strong> <span class="badge badge-${data.status === 'resolved' ? 'success' : 'warning'}">${data.status}</span></p>
                <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--border-color);">
                
                ${responses.length > 0 ? `
                    <h4 style="color: var(--primary-color);">Official Staff Updates</h4>
                    ${responses.map(r => `
                        <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: 0.5rem; margin: 0.5rem 0; border-left: 4px solid var(--primary-color);">
                            <p style="margin-bottom: 0.5rem;">${r.message}</p>
                            <div class="request-meta">
                                <span class="badge badge-info">👤 Staff: ${r.staff_name || 'City Official'}</span>
                                <span class="badge badge-info">📅 ${new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    `).join('')}
                ` : `
                    <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; text-align: center;">
                        <p style="margin: 0; color: var(--text-secondary);">Our staff is currently reviewing your complaint.</p>
                    </div>
                `}
            </div>
        `;
    }

    content.innerHTML = responseHtml;
    modal.classList.add('active');
}

// Redirecting old call to new one
window.viewQueryResponse = (id) => viewResponse('agriculture', id);
window.viewResponse = viewResponse;


// ============ MY REQUESTS SECTION ============

async function loadAllRequests() {
    // Load all data for My Requests section
    const appointmentsContainer = document.getElementById('requests-appointments');
    const queriesContainer = document.getElementById('requests-queries');
    const complaintsContainer = document.getElementById('requests-complaints');

    if (appointmentsContainer) {
        appointmentsContainer.innerHTML = '<div class="spinner"></div>';
        try {
            const response = await apiCall('/healthcare/appointments/', 'GET', null, true);
            const appointments = (response.results || response || []).slice(0, 3);

            if (appointments.length === 0) {
                appointmentsContainer.innerHTML = '<p class="empty-state">No appointments</p>';
            } else {
                appointmentsContainer.innerHTML = appointments.map(apt => `
                    <div class="request-card">
                        <h4>${apt.doctor_name || 'Doctor'}</h4>
                        <p>${apt.appointment_date} at ${apt.appointment_time}</p>
                        <span class="badge badge-${apt.status === 'scheduled' ? 'warning' : 'success'}">${apt.status}</span>
                    </div>
                `).join('');
            }
        } catch (error) {
            appointmentsContainer.innerHTML = '<p class="empty-state">Unable to load</p>';
        }
    }

    if (queriesContainer) {
        queriesContainer.innerHTML = '<div class="spinner"></div>';
        try {
            const response = await apiCall('/agriculture/queries/', 'GET', null, true);
            const queries = (response.results || response || []).slice(0, 3);

            if (queries.length === 0) {
                queriesContainer.innerHTML = '<p class="empty-state">No queries</p>';
            } else {
                queriesContainer.innerHTML = queries.map(query => `
                    <div class="request-card">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <h4>${query.title}</h4>
                            <span class="badge badge-${query.status === 'answered' ? 'success' : 'warning'}">${query.status}</span>
                        </div>
                        <p>${query.description.substring(0, 80)}${query.description.length > 80 ? '...' : ''}</p>
                        ${query.status === 'answered' ? `
                            <button class="btn btn-sm btn-primary" style="margin-top: 0.5rem;" onclick="viewQueryResponse(${query.id})">
                                View Response
                            </button>
                        ` : ''}
                    </div>
                `).join('');
            }
        } catch (error) {
            queriesContainer.innerHTML = '<p class="empty-state">Unable to load</p>';
        }
    }

    if (complaintsContainer) {
        complaintsContainer.innerHTML = '<div class="spinner"></div>';
        try {
            const response = await apiCall('/city/complaints/', 'GET', null, true);
            const complaints = (response.results || response || []).slice(0, 3);

            if (complaints.length === 0) {
                complaintsContainer.innerHTML = '<p class="empty-state">No complaints</p>';
            } else {
                complaintsContainer.innerHTML = complaints.map(complaint => `
                    <div class="request-card">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <h4>${complaint.title}</h4>
                            <span class="badge badge-${complaint.status === 'resolved' ? 'success' : 'warning'}">${complaint.status}</span>
                        </div>
                        <p>${complaint.description.substring(0, 100)}${complaint.description.length > 100 ? '...' : ''}</p>
                        ${(complaint.status === 'in_progress' || complaint.status === 'resolved') ? `
                            <button class="btn btn-sm btn-primary" style="margin-top: 0.5rem;" onclick="viewResponse('city', ${complaint.id})">
                                View Response
                            </button>
                        ` : ''}
                    </div>
                `).join('');
            }
        } catch (error) {
            complaintsContainer.innerHTML = '<p class="empty-state">Unable to load</p>';
        }
    }
}

// ============ UTILITY FUNCTIONS ============

function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Set minimum date for appointments (today)
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('appointment-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
});
