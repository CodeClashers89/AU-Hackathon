// City Services - Staff Dashboard JavaScript
let currentComplaintId = null;

document.addEventListener('DOMContentLoaded', () => {
    checkStaffAuth();
    initializeDashboard();
});

function checkStaffAuth() {
    const role = localStorage.getItem('userRole');
    if (role !== 'city_staff') {
        window.location.href = '/login/';
    }
}

async function initializeDashboard() {
    loadDashboardStats();
    loadComplaints();
}

async function loadDashboardStats() {
    try {
        const stats = await apiCall('/city/stats/');
        document.getElementById('pending-count').textContent = stats.pending_complaints;
        document.getElementById('resolved-count').textContent = stats.resolved_this_month;
        document.getElementById('progress-count').textContent = stats.in_progress;
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

async function loadComplaints() {
    try {
        const response = await apiCall('/city/complaints/');
        const container = document.getElementById('complaints-table-body');
        const allContainer = document.getElementById('all-complaints-table-body');

        const complaints = response.results || response || [];

        if (!container && !allContainer) return;

        const html = complaints.length === 0
            ? '<tr><td colspan="5" class="text-center">No complaints found.</td></tr>'
            : complaints.map(c => `
                <tr>
                    <td>${c.complaint_id}</td>
                    <td>
                        <strong>${c.citizen_name || 'Citizen'}</strong><br>
                        <small>${c.location}</small>
                    </td>
                    <td>
                        <div>${c.title}</div>
                        <span class="badge badge-secondary">${c.category_name}</span>
                    </td>
                    <td><span class="badge badge-${getStatusColor(c.status)}">${c.status}</span></td>
                    <td>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-sm btn-primary" onclick="viewComplaint(${c.id})">View</button>
                            <button class="btn btn-sm btn-secondary" onclick="openRespondModal(${c.id}, '${c.complaint_id}')">Respond</button>
                        </div>
                    </td>
                </tr>
            `).join('');

        if (container) container.innerHTML = html;
        if (allContainer) allContainer.innerHTML = html;

    } catch (error) {
        console.error('Failed to load complaints:', error);
        if (document.getElementById('complaints-table-body')) {
            document.getElementById('complaints-table-body').innerHTML = '<tr><td colspan="5" class="text-error">Failed to load data</td></tr>';
        }
    }
}

async function loadResponses() {
    const container = document.getElementById('responses-list');
    if (!container) return;

    try {
        const response = await apiCall('/city/responses/');
        const responses = response.results || response || [];

        if (responses.length === 0) {
            container.innerHTML = '<p class="empty-state">You haven\'t posted any responses yet.</p>';
            return;
        }

        container.innerHTML = responses.map(r => `
            <div class="request-card">
                <div style="display: flex; justify-content: space-between;">
                    <h4>Response to: ${r.complaint_id || 'Complaint'}</h4>
                    <span class="badge badge-info">${new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p style="margin: 0.5rem 0;">${r.message}</p>
                ${r.action_taken ? `<p><small><strong>Action:</strong> ${r.action_taken}</small></p>` : ''}
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p class="text-error">Failed to load response history</p>';
    }
}

function showSection(sectionName) {
    // Hide all
    document.querySelectorAll('.section-content').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

    // Show selected
    const target = document.getElementById(`${sectionName}-section`);
    if (target) target.classList.add('active');

    // Active link
    const link = document.querySelector(`.sidebar-link[href="#${sectionName}"]`);
    if (link) link.classList.add('active');

    // Load data
    if (sectionName === 'dashboard') {
        loadDashboardStats();
        loadComplaints();
    } else if (sectionName === 'complaints') {
        loadComplaints();
    } else if (sectionName === 'responses') {
        loadResponses();
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'submitted': return 'warning';
        case 'in_progress': return 'info';
        case 'resolved': return 'success';
        case 'closed': return 'secondary';
        default: return 'info';
    }
}

window.viewComplaint = async function (id) {
    currentComplaintId = id;
    const content = document.getElementById('view-content');
    content.innerHTML = '<div class="spinner"></div>';
    document.getElementById('view-modal').classList.add('active');

    try {
        const c = await apiCall(`/city/complaints/${id}/`);
        content.innerHTML = `
            <div class="card" style="box-shadow: none; border: 1px solid var(--border-color); background: var(--bg-secondary);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                        <h4 style="margin: 0;">${c.title}</h4>
                        <small style="color: var(--text-muted);">${c.complaint_id} | ${c.category_name}</small>
                    </div>
                    <span class="badge badge-${getStatusColor(c.status)}">${c.status}</span>
                </div>
                
                <p><strong>Reported By:</strong> ${c.citizen_name}</p>
                <p><strong>Location:</strong> ${c.location}</p>
                <p><strong>Priority:</strong> <span class="badge badge-${c.priority === 'high' || c.priority === 'urgent' ? 'danger' : 'info'}">${c.priority}</span></p>
                
                <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--border-color);">
                
                <p><strong>Description:</strong></p>
                <p style="white-space: pre-wrap; font-size: 0.95rem;">${c.description}</p>
                
                ${c.responses && c.responses.length > 0 ? `
                    <div style="margin-top: 1.5rem;">
                        <h5>Previous Updates</h5>
                        ${c.responses.map(r => `
                            <div style="padding: 0.75rem; background: white; border-radius: 0.4rem; margin-top: 0.5rem; border-left: 3px solid var(--primary-color);">
                                <p style="margin: 0; font-size: 0.9rem;">${r.message}</p>
                                <small style="color: var(--text-muted);">${r.staff_name} | ${new Date(r.created_at).toLocaleDateString()}</small>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        document.getElementById('view-respond-btn').onclick = () => {
            closeModal('view-modal');
            openRespondModal(id, c.complaint_id);
        };

        // Add Resolve button if not already resolved
        if (c.status !== 'resolved') {
            const btnGroup = document.getElementById('view-respond-btn').parentElement;
            let resolveBtn = document.getElementById('view-resolve-btn');
            if (!resolveBtn) {
                resolveBtn = document.createElement('button');
                resolveBtn.id = 'view-resolve-btn';
                resolveBtn.className = 'btn btn-success';
                resolveBtn.textContent = 'Mark as Resolved';
                btnGroup.insertBefore(resolveBtn, document.getElementById('view-respond-btn'));
            }
            resolveBtn.onclick = () => handleResolve(id);
        } else {
            const resolveBtn = document.getElementById('view-resolve-btn');
            if (resolveBtn) resolveBtn.remove();
        }
    } catch (error) {
        content.innerHTML = '<p class="text-error">Failed to load details.</p>';
    }
};

window.openRespondModal = function (id, ref) {
    currentComplaintId = id;
    document.getElementById('respond-modal-title').textContent = `Respond to Ref: ${ref}`;
    document.getElementById('respond-modal').classList.add('active');
};

window.closeModal = function (id) {
    document.getElementById(id).classList.remove('active');
};

window.handleRespond = async function (e) {
    e.preventDefault();
    const message = document.getElementById('response-message').value;
    const actionTaken = document.getElementById('action-taken').value;

    if (!message) return;

    try {
        await apiCall(`/city/complaints/${currentComplaintId}/respond/`, 'POST', {
            message,
            action_taken: actionTaken
        }, true);

        showNotification('Response submitted and status updated to In Progress', 'success');
        closeModal('respond-modal');
        initializeDashboard();

        // Clear form
        document.getElementById('response-message').value = '';
        document.getElementById('action-taken').value = '';
    } catch (error) {
        console.error('Response error:', error);
        showNotification('Failed to submit response: ' + error.message, 'error');
    }
};

window.handleResolve = async function (id) {
    if (!confirm('Are you sure you want to mark this complaint as resolved?')) return;

    try {
        await apiCall(`/city/complaints/${id}/resolve/`, 'POST', {}, true);
        showNotification('Complaint marked as resolved', 'success');
        closeModal('view-modal');
        initializeDashboard();
    } catch (error) {
        console.error('Resolve error:', error);
        showNotification('Failed to resolve: ' + error.message, 'error');
    }
};

// Main Nav
window.showSection = showSection;
window.logout = logout;
