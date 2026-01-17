// Digital Public Infrastructure - Main JavaScript

// API Base URL
const API_BASE = '/api';

// Authentication token storage
let authToken = localStorage.getItem('authToken');

// Check if user is logged in
function isLoggedIn() {
    return !!localStorage.getItem('authToken');
}

// Get user role
function getUserRole() {
    return localStorage.getItem('userRole');
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = '/login/';
}

// API Helper Functions
async function apiCall(endpoint, method = 'GET', data = null, requireAuth = false) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const token = localStorage.getItem('authToken');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    } else if (requireAuth) {
        window.location.href = '/login/';
        return;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);

        // Handle 401 Unauthorized
        if (response.status === 401 && requireAuth) {
            localStorage.clear();
            window.location.href = '/login/';
            return;
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || result.detail || 'API request failed');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        if (error.message !== 'API request failed') {
            showNotification(error.message, 'error');
        }
        throw error;
    }
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Form Helpers
function getFormData(formId) {
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    return data;
}

// Dashboard Stats Loader
async function loadDashboardStats() {
    try {
        const stats = await apiCall('/core/dashboard/stats/');

        // Update stat cards
        if (document.getElementById('total-users')) {
            document.getElementById('total-users').textContent = stats.total_users.toLocaleString();
        }
        if (document.getElementById('total-services')) {
            document.getElementById('total-services').textContent = stats.total_services;
        }
        if (document.getElementById('total-requests')) {
            document.getElementById('total-requests').textContent = stats.total_requests.toLocaleString();
        }
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
    }
}

// Healthcare Functions
async function loadDoctors() {
    try {
        const doctors = await apiCall('/healthcare/doctors/available/');
        const select = document.getElementById('doctor-select');

        if (select) {
            select.innerHTML = '<option value="">Select a doctor</option>';
            const doctorsArray = doctors.results || doctors || [];

            doctorsArray.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.id;

                // Securely get doctor name
                let name = 'Unknown Doctor';
                if (doctor.user_details && doctor.user_details.full_name) {
                    name = doctor.user_details.full_name;
                } else if (doctor.user) {
                    name = `${doctor.user.first_name} ${doctor.user.last_name}`;
                } else if (doctor.full_name) {
                    name = doctor.full_name;
                }

                option.textContent = `Dr. ${name} - ${doctor.specialization || 'General'}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load doctors:', error);
    }
}

async function loadAppointments() {
    try {
        const response = await apiCall('/healthcare/appointments/');
        const container = document.getElementById('appointments-list');

        if (container) {
            // Handle both array and paginated response
            const appointments = response.results || response;

            if (!appointments || appointments.length === 0) {
                container.innerHTML = '<p>No appointments found.</p>';
                return;
            }

            container.innerHTML = appointments.map(apt => `
                <div class="card mb-2">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4>${apt.doctor_name || 'Doctor'}</h4>
                            <p>${apt.appointment_date} at ${apt.appointment_time}</p>
                            <span class="badge badge-${apt.status === 'scheduled' ? 'info' : 'success'}">
                                ${apt.status}
                            </span>
                        </div>
                        <div>
                            ${apt.status === 'scheduled' ? '<button class="btn btn-sm btn-danger" onclick="cancelAppointment(' + apt.id + ')">Cancel</button>' : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load appointments:', error);
        const container = document.getElementById('appointments-list');
        if (container) {
            container.innerHTML = '<p>No appointments available.</p>';
        }
    }
}

// Agriculture Functions
async function loadAgriUpdates() {
    try {
        const response = await apiCall('/agriculture/updates/');
        const container = document.getElementById('agri-updates-list');

        if (container) {
            const updates = response.results || response;

            if (!updates || updates.length === 0) {
                container.innerHTML = '<p>No updates available.</p>';
                return;
            }

            container.innerHTML = updates.map(update => `
                <div class="card mb-2">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4>${update.title}</h4>
                            <p>${update.content}</p>
                            <span class="badge badge-${update.is_urgent ? 'danger' : 'info'}">
                                ${update.update_type}
                            </span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load agri updates:', error);
        const container = document.getElementById('agri-updates-list');
        if (container) {
            container.innerHTML = '<p>No updates available.</p>';
        }
    }
}

// City Services Functions
async function loadComplaints() {
    try {
        const response = await apiCall('/city/complaints/');
        const container = document.getElementById('complaints-list');

        if (container) {
            const complaints = response.results || response;

            if (!complaints || complaints.length === 0) {
                container.innerHTML = '<p>No complaints found.</p>';
                return;
            }

            container.innerHTML = complaints.map(complaint => `
                <div class="card mb-2">
                    <div>
                        <h4>${complaint.title}</h4>
                        <p>${complaint.description}</p>
                        <div class="flex gap-2 mt-2">
                            <span class="badge badge-info">${complaint.complaint_id || 'N/A'}</span>
                            <span class="badge badge-${complaint.status === 'resolved' ? 'success' : 'warning'}">
                                ${complaint.status}
                            </span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load complaints:', error);
        const container = document.getElementById('complaints-list');
        if (container) {
            container.innerHTML = '<p>No complaints available.</p>';
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load dashboard stats if on home page
    if (document.getElementById('total-users')) {
        loadDashboardStats();
    }

    // Load doctors if on healthcare page
    if (document.getElementById('doctor-select')) {
        loadDoctors();
    }

    // Load appointments if container exists
    if (document.getElementById('appointments-list')) {
        loadAppointments();
    }

    // Load agri updates if container exists
    if (document.getElementById('agri-updates-list')) {
        loadAgriUpdates();
    }

    // Load complaints if container exists
    if (document.getElementById('complaints-list')) {
        loadComplaints();
    }
});
