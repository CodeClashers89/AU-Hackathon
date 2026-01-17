/**
 * Admin Dashboard - Digital Public Infrastructure
 * Handles system stats, service provider approvals, and service health.
 */

// Global state for admin data
let pendingApprovals = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    initializeAdminDashboard();
});

// Protection for admin route
function checkAdminAuth() {
    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('authToken');

    if (!token || role !== 'admin') {
        showNotification('Unauthorized access', 'error');
        window.location.href = '/login/';
    }
}

// Main initialization
async function initializeAdminDashboard() {
    await Promise.all([
        loadAdminStats(),
        loadApprovals()
    ]);
}

// Load System Statistics
async function loadAdminStats() {
    try {
        const stats = await apiCall('/core/dashboard/stats/', 'GET', null, true);

        // Update stats cards
        const totalUsersEl = document.getElementById('admin-total-users');
        const pendingApprovalsEl = document.getElementById('admin-pending-approvals');

        if (totalUsersEl) totalUsersEl.textContent = stats.total_users.toLocaleString();
        if (pendingApprovalsEl) pendingApprovalsEl.textContent = stats.pending_approvals;

        // Use live totals for Requests too if available
        const totalRequestsEl = document.querySelector('.stat-card.danger .stat-value');
        if (totalRequestsEl) totalRequestsEl.textContent = stats.total_requests.toLocaleString();

    } catch (error) {
        console.error('Failed to load admin stats:', error);
    }
}

// Load Pending Approvals
async function loadApprovals() {
    const tableBody = document.getElementById('approvals-table');
    if (!tableBody) return;

    try {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner"></div></td></tr>';

        const response = await apiCall('/accounts/approvals/', 'GET', null, true);
        pendingApprovals = response.results || response || [];

        // Filter for pending only
        const pending = pendingApprovals.filter(a => a.status === 'pending');

        if (pending.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No pending approvals found.</td></tr>';
            return;
        }

        tableBody.innerHTML = pending.map(req => `
            <tr>
                <td>
                    <strong>${req.user.first_name} ${req.user.last_name}</strong><br>
                    <small style="color: var(--text-muted);">${req.user.username} | ${req.user.email}</small>
                </td>
                <td><span class="badge badge-info">${formatRole(req.request_type)}</span></td>
                <td>${new Date(req.requested_at).toLocaleDateString()}</td>
                <td><span class="badge badge-warning">${req.status}</span></td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm btn-success" onclick="handleApprovalAction(${req.id}, 'approve')">Approve</button>
                        <button class="btn btn-sm btn-danger" onclick="handleApprovalAction(${req.id}, 'reject')">Reject</button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Failed to load approvals:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-error text-center">Failed to load approval requests.</td></tr>';
    }
}

// Handle Approve/Reject
async function handleApprovalAction(requestId, actionType) {
    const actionVerb = actionType === 'approve' ? 'approve' : 'reject';
    const confirmMsg = `Are you sure you want to ${actionVerb} this request?`;

    if (!confirm(confirmMsg)) return;

    try {
        await apiCall(`/accounts/approvals/${requestId}/${actionVerb}/`, 'POST', {}, true);
        showNotification(`Request ${actionVerb}d successfully`, 'success');

        // Refresh dashboard
        initializeAdminDashboard();
    } catch (error) {
        console.error(`${actionType} error:`, error);
        showNotification(`Failed to ${actionVerb} request: ${error.message}`, 'error');
    }
}

// Utility: Format role name
function formatRole(role) {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Section Management
function showSection(sectionId) {
    // Update sidebar links
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick')?.includes(sectionId)) {
            link.classList.add('active');
        }
    });

    // Toggle sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });

    const activeSection = document.getElementById(`section-${sectionId}`);
    if (activeSection) {
        activeSection.classList.add('active');
    }

    // Load data based on section
    if (sectionId === 'dashboard') {
        loadAdminStats();
    } else if (sectionId === 'approvals') {
        loadApprovals();
    } else if (sectionId === 'services') {
        loadServices();
    } else if (sectionId === 'users') {
        loadUsers();
    } else if (sectionId === 'analytics') {
        loadAnalytics();
    }
}

// Load Services
async function loadServices() {
    const tableBody = document.getElementById('services-table');
    if (!tableBody) return;

    try {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner"></div></td></tr>';
        const response = await apiCall('/core/services/', 'GET', null, true);
        const services = response.results || response || [];

        if (services.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No services found.</td></tr>';
            return;
        }

        tableBody.innerHTML = services.map(service => `
            <tr>
                <td><span style="font-size: 1.5rem;">${service.icon || '🛠️'}</span></td>
                <td>
                    <strong>${service.name}</strong><br>
                    <small style="color: var(--text-muted);">${service.description || ''}</small>
                </td>
                <td><code>${service.endpoint_url}</code></td>
                <td><span class="badge badge-${service.is_active ? 'success' : 'danger'}">${service.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm btn-outline" onclick="openServiceModal(${service.id})">Edit</button>
                        <button class="btn btn-sm btn-${service.is_active ? 'warning' : 'success'}" onclick="toggleServiceStatus(${service.id}, ${service.is_active})">
                            ${service.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load services:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-error text-center">Failed to load services.</td></tr>';
    }
}

// Open Service Modal (Create or Edit)
async function openServiceModal(serviceId = null) {
    const modalTitle = document.getElementById('service-modal-title');
    const form = document.getElementById('service-form');

    if (!form) return;

    form.reset();
    document.getElementById('service-id').value = serviceId || '';

    if (serviceId) {
        modalTitle.textContent = 'Edit Service';
        try {
            const service = await apiCall(`/core/services/${serviceId}/`, 'GET', null, true);
            document.getElementById('service-name').value = service.name;
            document.getElementById('service-url').value = service.endpoint_url;
            document.getElementById('service-icon').value = service.icon || '';
            document.getElementById('service-description').value = service.description || '';
        } catch (error) {
            showNotification('Failed to load service details', 'error');
            return;
        }
    } else {
        modalTitle.textContent = 'Add New Service';
    }

    openModal('service-form-modal');
}

// Save Service (Create or Update)
async function saveService(event) {
    event.preventDefault();
    const serviceId = document.getElementById('service-id').value;
    const data = {
        name: document.getElementById('service-name').value,
        endpoint_url: document.getElementById('service-url').value,
        icon: document.getElementById('service-icon').value,
        description: document.getElementById('service-description').value
    };

    try {
        let response;
        if (serviceId) {
            response = await apiCall(`/core/services/${serviceId}/`, 'PATCH', data, true);
        } else {
            response = await apiCall('/core/services/', 'POST', data, true);
        }

        showNotification(serviceId ? 'Service updated' : 'Service created', 'success');
        closeModal('service-form-modal');
        loadServices(); // Refresh list
    } catch (error) {
        console.error('Save service error:', error);
        showNotification('Failed to save service: ' + error.message, 'error');
    }
}

// Toggle Service Status
async function toggleServiceStatus(serviceId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this service?`)) return;

    try {
        await apiCall(`/core/services/${serviceId}/`, 'PATCH', { is_active: !currentStatus }, true);
        showNotification(`Service ${action}d successfully`, 'success');
        loadServices();
    } catch (error) {
        showNotification(`Failed to ${action} service`, 'error');
    }
}

// Load Users
async function loadUsers() {
    const tableBody = document.getElementById('users-table');
    if (!tableBody) return;

    try {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner"></div></td></tr>';
        const response = await apiCall('/accounts/users/', 'GET', null, true);
        const users = response.results || response || [];

        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No users found.</td></tr>';
            return;
        }

        tableBody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <strong>${user.first_name} ${user.last_name}</strong><br>
                    <small style="color: var(--text-muted);">${user.username}</small>
                </td>
                <td>${user.email}</td>
                <td><span class="badge badge-info">${formatRole(user.role)}</span></td>
                <td><span class="badge badge-${user.is_approved ? 'success' : 'warning'}">${user.is_approved ? 'Approved' : 'Pending'}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="showUserDetails(${user.id})">View</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load users:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-error text-center">Failed to load users.</td></tr>';
    }
}

// Show User Details Modal
async function showUserDetails(userId) {
    const modalContent = document.getElementById('user-details-content');
    const modalTitle = document.getElementById('modal-user-name');

    if (!modalContent) return;

    try {
        modalContent.innerHTML = '<div class="text-center"><div class="spinner"></div></div>';
        openModal('user-details-modal');

        const user = await apiCall(`/accounts/users/${userId}/`, 'GET', null, true);

        modalTitle.textContent = `${user.first_name} ${user.last_name}`;

        const profile = user.profile || {};

        modalContent.innerHTML = `
            <div class="user-profile-detail">
                <div style="display: flex; gap: 1.5rem; margin-bottom: 2rem; align-items: center;">
                    <div style="width: 80px; height: 80px; background: var(--bg-tertiary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem;">
                        ${user.first_name.charAt(0)}${user.last_name.charAt(0)}
                    </div>
                    <div>
                        <h3 style="margin:0">${user.first_name} ${user.last_name}</h3>
                        <p style="color: var(--text-muted); margin:0">@${user.username} • ${formatRole(user.role)}</p>
                        <span class="badge badge-${user.is_approved ? 'success' : 'warning'}" style="margin-top:0.5rem; display:inline-block;">
                            ${user.is_approved ? 'Approved' : 'Pending Approval'}
                        </span>
                    </div>
                </div>

                <div class="grid grid-2 gap-2">
                    <div class="detail-group">
                        <label style="display:block; font-size:0.875rem; color:var(--text-muted);">Email Address</label>
                        <p><strong>${user.email}</strong></p>
                    </div>
                    <div class="detail-group">
                        <label style="display:block; font-size:0.875rem; color:var(--text-muted);">Phone Number</label>
                        <p><strong>${user.phone_number || 'Not provided'}</strong></p>
                    </div>
                    <div class="detail-group" style="grid-column: span 2;">
                        <label style="display:block; font-size:0.875rem; color:var(--text-muted);">Residential Address</label>
                        <p><strong>${user.address || 'Not provided'}</strong></p>
                    </div>
                    <div class="detail-group">
                        <label style="display:block; font-size:0.875rem; color:var(--text-muted);">City</label>
                        <p><strong>${profile.city || 'N/A'}</strong></p>
                    </div>
                    <div class="detail-group">
                        <label style="display:block; font-size:0.875rem; color:var(--text-muted);">State</label>
                        <p><strong>${profile.state || 'N/A'}</strong></p>
                    </div>
                </div>

                <div class="detail-group mt-2">
                    <label style="display:block; font-size:0.875rem; color:var(--text-muted);">Bio</label>
                    <p>${profile.bio || 'No bio available.'}</p>
                </div>

                <div class="mt-2 pt-2" style="border-top: 1px solid var(--border-color);">
                    <small style="color: var(--text-muted);">Member since: ${new Date(user.created_at).toLocaleDateString()}</small>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load user details:', error);
        modalContent.innerHTML = '<p class="text-error">Failed to load user information.</p>';
    }
}

// Load Analytics
async function loadAnalytics() {
    const container = document.getElementById('analytics-content');
    if (!container) return;

    try {
        container.innerHTML = '<div class="text-center"><div class="spinner"></div></div>';
        const stats = await apiCall('/core/dashboard/stats/', 'GET', null, true);

        // User Role Cards
        let roleHtml = '<div class="grid grid-3 gap-1 mt-1">';
        for (const [role, count] of Object.entries(stats.role_breakdown || {})) {
            roleHtml += `
                <div class="card p-1 text-center" style="background: var(--bg-secondary); border: 1px solid var(--border-color);">
                    <h2 style="margin:0; color: var(--primary-color);">${count}</h2>
                    <small style="color:var(--text-muted); text-transform: uppercase; font-weight: bold;">${formatRole(role)}s</small>
                </div>
            `;
        }
        roleHtml += '</div>';

        // Service Utilization Progress Bars
        let usageHtml = '<div class="mt-1">';
        for (const [service, count] of Object.entries(stats.service_usage || {})) {
            const percentage = stats.total_requests > 0 ? (count / stats.total_requests * 100).toFixed(1) : 0;
            usageHtml += `
                <div style="margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="text-transform: capitalize; font-weight: 500;">${service.replace('_', ' ')}</span>
                        <span style="font-weight: bold;">${count} requests (${percentage}%)</span>
                    </div>
                    <div style="height: 10px; background: var(--bg-tertiary); border-radius: 5px; overflow: hidden;">
                        <div style="height: 100%; width: ${percentage}%; background: linear-gradient(90deg, var(--primary-color), #4f46e5); transition: width 1s ease-out;"></div>
                    </div>
                </div>
            `;
        }
        usageHtml += '</div>';

        // Activity Bar Chart (CSS-based)
        const maxActivity = Math.max(...(stats.daily_activity || []).map(d => d.count), 1);
        let activityHtml = '<div style="display: flex; align-items: flex-end; justify-content: space-between; height: 180px; padding: 20px 10px; background: var(--bg-tertiary); border-radius: 12px; margin-top: 1rem;">';
        (stats.daily_activity || []).forEach(day => {
            const barHeight = (day.count / maxActivity) * 100;
            activityHtml += `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                    <div style="position: relative; width: 30px; height: ${barHeight}%; background: var(--primary-color); border-radius: 6px 6px 0 0; transition: height 0.5s ease-out;" title="${day.count} requests">
                        <span style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 0.75rem; font-weight: bold;">${day.count}</span>
                    </div>
                    <span style="font-size: 0.7rem; color: var(--text-muted); white-space: nowrap;">${day.date}</span>
                </div>
            `;
        });
        activityHtml += '</div>';

        // Performance Metrics (Completion Time)
        let perfHtml = '<div class="grid grid-3 gap-1 mt-1">';
        for (const [service, time] of Object.entries(stats.performance || {})) {
            perfHtml += `
                <div class="card p-1 text-center" style="background: var(--bg-tertiary);">
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: capitalize;">${service.replace('_', ' ')}</div>
                    <div style="font-size: 1.25rem; font-weight: bold; color: ${time < 60 ? '#10b981' : '#f59e0b'};">${time}m</div>
                    <small style="color: var(--text-muted);">Avg Completion</small>
                </div>
            `;
        }
        perfHtml += '</div>';

        // System Health (CPU, Memory, Response Time)
        const health = stats.system_health || { cpu_usage: 0, memory_usage: 0, avg_response_time: 0 };
        const healthHtml = `
            <div class="grid grid-3 gap-1 mt-1">
                <div class="card p-1 text-center" style="background: var(--bg-secondary); border: 1px solid var(--border-color);">
                    <div style="font-size: 1.25rem; font-weight: bold; color: var(--primary-color);">${health.cpu_usage}%</div>
                    <small style="color: var(--text-muted);">CPU Usage</small>
                </div>
                <div class="card p-1 text-center" style="background: var(--bg-secondary); border: 1px solid var(--border-color);">
                    <div style="font-size: 1.25rem; font-weight: bold; color: var(--primary-color);">${health.memory_usage}%</div>
                    <small style="color: var(--text-muted);">Memory</small>
                </div>
                <div class="card p-1 text-center" style="background: var(--bg-secondary); border: 1px solid var(--border-color);">
                    <div style="font-size: 1.25rem; font-weight: bold; color: #10b981;">${health.avg_response_time}ms</div>
                    <small style="color: var(--text-muted);">API Latency</small>
                </div>
            </div>
        `;

        container.innerHTML = `
            <div class="grid grid-2 gap-2">
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>System Activity (7 Days)</h3>
                        <span class="badge badge-success">Live</span>
                    </div>
                    <p style="color: var(--text-muted); font-size: 0.875rem;">Real platform engagement across all service nodes.</p>
                    ${activityHtml}
                </div>
                <div class="card">
                    <h3>Service Utilization</h3>
                    <p style="color: var(--text-muted); font-size: 0.875rem;">Volume distribution of processing requests.</p>
                    ${usageHtml}
                </div>
            </div>

            <div class="grid grid-2 gap-2 mt-2">
                <div class="card">
                    <h3>User Distribution</h3>
                    <p style="color: var(--text-muted); font-size: 0.875rem;">Growth breakdown by ecosystem role.</p>
                    ${roleHtml}
                </div>
                <div class="card">
                    <h3>Infrastructure Health</h3>
                    <p style="color: var(--text-muted); font-size: 0.875rem;">System response times and node latency.</p>
                    ${healthHtml}
                    <h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem;">Service Performance</h4>
                    <p style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 1rem;">Average time from request creation to completion.</p>
                    ${perfHtml}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load analytics:', error);
        container.innerHTML = '<p class="text-error">Failed to load analytics data.</p>';
    }
}

// Export functions to window
window.handleApprovalAction = handleApprovalAction;
window.initializeAdminDashboard = initializeAdminDashboard;
window.showSection = showSection;
window.loadServices = loadServices;
window.loadUsers = loadUsers;
window.loadAnalytics = loadAnalytics;
window.showUserDetails = showUserDetails;
window.openServiceModal = openServiceModal;
window.saveService = saveService;
window.toggleServiceStatus = toggleServiceStatus;
window.showUserDetails = showUserDetails;
