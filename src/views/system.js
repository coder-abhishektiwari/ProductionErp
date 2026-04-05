import { db, formatDate } from '../store/db.js';
import { SyncEngine } from '../store/supabase-sync.js';
import { isSupabaseConfigured } from '../store/supabase-config.js';

export default function SystemView() {
    const c = document.createElement('div');
    c.className = 'animate-fade-in mx-auto lg:p-6';
    c.style.maxWidth = '1100px';

    if (localStorage.getItem('role') !== 'ADMIN') {
        c.innerHTML = '<div class="alert alert-danger" style="margin:20px">Access Denied: Admin privileges required.</div>';
        return c;
    }

    const state = { activeTab: 'users', companies: [], expandedUser: null };

    // ── Company-level users (stored in db.data.companyUsers) ──
    function getCompanyUsers() {
        return db.data.companyUsers || [];
    }

    function saveCompanyUser(user) {
        if (!db.data.companyUsers) db.data.companyUsers = [];
        const idx = db.data.companyUsers.findIndex(u => u.username === user.username);
        if (idx >= 0) {
            db.data.companyUsers[idx] = { ...db.data.companyUsers[idx], ...user };
        } else {
            // New user defaults
            db.data.companyUsers.push({
                createdAt: new Date().toISOString(),
                lastLogin: null,
                isActive: true,
                isLoggedIn: false,
                activityLog: [],
                ...user,
            });
        }
        db.saveData();
    }

    function toggleUserActive(username) {
        const u = (db.data.companyUsers || []).find(u => u.username === username);
        if (!u) return;
        u.isActive = !u.isActive;
        if (!u.isActive) u.isLoggedIn = false; // force logout when deactivating
        db.saveData();
    }

    function forceLogout(username) {
        const u = (db.data.companyUsers || []).find(u => u.username === username);
        if (!u) return;
        u.isLoggedIn = false;
        db.saveData();
    }

    function deleteCompanyUser(username) {
        if (!db.data.companyUsers) return;
        db.data.companyUsers = db.data.companyUsers.filter(u => u.username !== username);
        db.saveData();
    }

    // ── Count today's activity for a user ────────────────────
    function getTodayActivity(username) {
        const today = formatDate(new Date());
        const u = (db.data.companyUsers || []).find(u => u.username === username);
        if (!u || !u.activityLog) return { count: 0, items: [] };
        const todayItems = u.activityLog.filter(a => a.date === today);
        return { count: todayItems.length, items: todayItems };
    }

    // ── Time ago helper ──────────────────────────────────────
    function timeAgo(dateStr) {
        if (!dateStr) return 'Never';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 30) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString('en-IN');
    }

    // ── Load companies ───────────────────────────────────────
    const loadCompanies = async () => {
        if (!isSupabaseConfigured()) { state.companies = []; return; }
        try {
            const owner = localStorage.getItem('master_username') || '';
            state.companies = await SyncEngine.fetchCompanies(owner);
        } catch(e) {
            console.error('Failed to load companies:', e);
            state.companies = [];
        }
    };

    // ══════════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════════
    const render = () => {
        const companyUsers = getCompanyUsers();
        const companyName = localStorage.getItem('company_name') || 'Current Company';

        c.innerHTML = `
            <div class="tabs mb-4">
                <div class="tab ${state.activeTab === 'users' ? 'active' : ''}" data-tab="users">
                    <i class="ph ph-users"></i> Company Users
                    ${companyUsers.length ? `<span class="badge" style="background:var(--accent-primary);color:white;font-size:9px;margin-left:6px;padding:2px 6px;">${companyUsers.length}</span>` : ''}
                </div>
                <div class="tab ${state.activeTab === 'companies' ? 'active' : ''}" data-tab="companies">
                    <i class="ph ph-buildings"></i> Companies
                </div>
            </div>
            <div id="sys-content"></div>
        `;

        const content = c.querySelector('#sys-content');

        // ══════════════════════════════════════════════════
        // TAB: COMPANY USERS
        // ══════════════════════════════════════════════════
        if (state.activeTab === 'users') {
            const activeCount = companyUsers.filter(u => u.isActive !== false).length;
            const loggedInCount = companyUsers.filter(u => u.isLoggedIn).length;

            content.innerHTML = `
                <!-- Stats Row -->
                <div class="flex gap-4 mb-4" style="flex-wrap:wrap;">
                    <div class="stat-card flex-1" style="min-width:140px;border-left:4px solid var(--accent-primary);padding:12px 16px;">
                        <div class="stat-value" style="font-size:1.4rem;">${companyUsers.length}</div>
                        <div class="stat-label">Total Users</div>
                    </div>
                    <div class="stat-card flex-1" style="min-width:140px;border-left:4px solid var(--accent-success);padding:12px 16px;">
                        <div class="stat-value" style="font-size:1.4rem;color:var(--accent-success);">${activeCount}</div>
                        <div class="stat-label">Active</div>
                    </div>
                    <div class="stat-card flex-1" style="min-width:140px;border-left:4px solid #f59e0b;padding:12px 16px;">
                        <div class="stat-value" style="font-size:1.4rem;color:#f59e0b;">${loggedInCount}</div>
                        <div class="stat-label">Logged In</div>
                    </div>
                </div>

                <!-- Add User Form -->
                <div class="card mb-4" style="border-top: 4px solid var(--accent-primary);">
                    <div class="section-title mb-2">
                        <i class="ph ph-user-plus"></i> Add User to: ${companyName}
                    </div>
                    <p class="text-xs text-muted mb-4">Company-specific users (operators, accountants). Not the software master login.</p>
                    <form id="form-user" class="grid-3 mb-2">
                        <div class="form-group">
                            <label class="form-label">Username</label>
                            <input type="text" id="su-name" class="form-control" required placeholder="Ex: sales_amit">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Password</label>
                            <input type="text" id="su-pass" class="form-control" required placeholder="Assign password">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Role</label>
                            <select id="su-role" class="form-control">
                                <option value="ADMIN">ADMIN (Full Access)</option>
                                <option value="ACCOUNTANT">ACCOUNTANT (Finance & Data)</option>
                                <option value="SALES">SALES (Orders & Invoices)</option>
                                <option value="OPERATOR" selected>OPERATOR (Production)</option>
                            </select>
                        </div>
                    </form>
                    <div class="flex justify-end">
                        <button type="submit" form="form-user" class="btn btn-primary"><i class="ph ph-user-plus"></i> Add User</button>
                    </div>
                </div>

                <!-- Users Table -->
                <div class="card">
                    <div class="section-title mb-4"><i class="ph ph-users-three"></i> Users in ${companyName}</div>
                    ${companyUsers.length === 0 ? `
                        <div class="text-center py-6 text-muted">
                            <i class="ph ph-users" style="font-size:2rem;opacity:0.3;"></i>
                            <p class="text-sm mt-2">No company users yet. The master login has full access.</p>
                        </div>
                    ` : `
                        <div class="flex flex-col gap-3">
                            ${companyUsers.map(u => {
                                const isActive = u.isActive !== false;
                                const isOnline = !!u.isLoggedIn;
                                const todayAct = getTodayActivity(u.username);
                                const isExpanded = state.expandedUser === u.username;

                                return `
                                <div class="user-card" style="border:1px solid var(--border);border-radius:8px;overflow:hidden;opacity:${isActive ? '1' : '0.55'};">
                                    <!-- User Header Row -->
                                    <div class="flex items-center justify-between" style="padding:12px 16px;cursor:pointer;${isExpanded ? 'border-bottom:1px solid var(--border);' : ''}" data-expand="${u.username}">
                                        <div class="flex items-center gap-3">
                                            <!-- Status Dot -->
                                            <div style="width:10px;height:10px;border-radius:50%;background:${isOnline ? '#22c55e' : isActive ? '#94a3b8' : '#ef4444'};${isOnline ? 'box-shadow:0 0 6px rgba(34,197,94,0.5);' : ''}"></div>
                                            <!-- Avatar -->
                                            <div style="width:36px;height:36px;border-radius:8px;background:${getRoleBadgeColor(u.role)};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;">
                                                ${u.username.charAt(0).toUpperCase()}
                                            </div>
                                            <!-- Info -->
                                            <div>
                                                <div class="font-bold" style="font-size:13px;">${u.username} ${!isActive ? '<span style="color:var(--accent-danger);font-weight:400;font-size:11px;">(Disabled)</span>' : ''}</div>
                                                <div class="flex items-center gap-3" style="font-size:11px;color:var(--text-muted);">
                                                    <span class="badge" style="background:${getRoleBadgeColor(u.role)};color:white;font-size:9px;padding:1px 6px;">${u.role}</span>
                                                    <span><i class="ph ph-clock"></i> ${timeAgo(u.lastLogin)}</span>
                                                    ${todayAct.count > 0 ? `<span style="color:var(--accent-primary);"><i class="ph ph-lightning"></i> ${todayAct.count} today</span>` : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <!-- Quick Status -->
                                        <div class="flex items-center gap-2">
                                            <span style="font-size:11px;color:${isOnline ? 'var(--accent-success)' : 'var(--text-muted)'};">
                                                ${isOnline ? '● Online' : '○ Offline'}
                                            </span>
                                            <i class="ph ${isExpanded ? 'ph-caret-up' : 'ph-caret-down'}" style="font-size:14px;color:var(--text-muted);"></i>
                                        </div>
                                    </div>

                                    <!-- Expanded Details -->
                                    ${isExpanded ? `
                                    <div style="padding:12px 16px;background:rgba(99,102,241,0.03);">
                                        <div class="grid-2 gap-4 mb-3" style="font-size:12px;">
                                            <div>
                                                <span class="text-muted"><i class="ph ph-calendar"></i> Created:</span>
                                                <span class="font-medium">${u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}</span>
                                            </div>
                                            <div>
                                                <span class="text-muted"><i class="ph ph-sign-in"></i> Last Login:</span>
                                                <span class="font-medium">${u.lastLogin ? new Date(u.lastLogin).toLocaleString('en-IN') : 'Never'}</span>
                                            </div>
                                            <div>
                                                <span class="text-muted"><i class="ph ph-lightning"></i> Today's Actions:</span>
                                                <span class="font-medium">${todayAct.count}</span>
                                            </div>
                                            <div>
                                                <span class="text-muted"><i class="ph ph-shield-check"></i> Status:</span>
                                                <span class="font-medium" style="color:${isActive ? 'var(--accent-success)' : 'var(--accent-danger)'};">${isActive ? 'Active' : 'Disabled'}</span>
                                            </div>
                                        </div>

                                        ${todayAct.count > 0 ? `
                                        <div style="margin-bottom:12px;">
                                            <div class="text-xs font-bold text-muted mb-2"><i class="ph ph-list-bullets"></i> Today's Activity</div>
                                            <div style="max-height:120px;overflow-y:auto;font-size:11px;background:var(--bg-main);border-radius:6px;padding:8px;">
                                                ${todayAct.items.slice(-10).reverse().map(a => `
                                                    <div style="padding:3px 0;border-bottom:1px solid var(--border);">
                                                        <span class="text-muted">${a.time || ''}</span> — ${a.action || a.type || 'Activity'}
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                        ` : ''}

                                        <!-- Action Buttons -->
                                        <div class="flex gap-2 flex-wrap">
                                            ${isOnline ? `
                                                <button class="btn btn-sm btn-warning btn-force-logout" data-user="${u.username}">
                                                    <i class="ph ph-sign-out"></i> Force Logout
                                                </button>
                                            ` : ''}
                                            <button class="btn btn-sm ${isActive ? 'btn-secondary' : 'btn-success'} btn-toggle-active" data-user="${u.username}">
                                                <i class="ph ${isActive ? 'ph-prohibit' : 'ph-check-circle'}"></i>
                                                ${isActive ? 'Disable' : 'Enable'}
                                            </button>
                                            <button class="btn btn-sm btn-ghost btn-edit-user" data-user="${u.username}" data-role="${u.role}" data-pass="${u.password || ''}">
                                                <i class="ph ph-pencil"></i> Edit
                                            </button>
                                            <button class="btn btn-sm btn-danger btn-delete-user" data-user="${u.username}">
                                                <i class="ph ph-trash"></i> Remove
                                            </button>
                                        </div>
                                    </div>
                                    ` : ''}
                                </div>`;
                            }).join('')}
                        </div>
                    `}
                </div>
            `;

            // ── Event Bindings ────────────────────────────
            content.querySelector('#form-user').addEventListener('submit', (e) => {
                e.preventDefault();
                const username = content.querySelector('#su-name').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
                const password = content.querySelector('#su-pass').value;
                const role = content.querySelector('#su-role').value;
                if (!username || !password) { alert('Fill all fields'); return; }

                const existing = getCompanyUsers().find(u => u.username === username);
                if (existing) {
                    if (!confirm(`User "${username}" already exists. Update?`)) return;
                }
                saveCompanyUser({ username, password, role });
                render();
            });

            // Expand/collapse user cards
            content.querySelectorAll('[data-expand]').forEach(el => {
                el.addEventListener('click', () => {
                    const user = el.dataset.expand;
                    state.expandedUser = state.expandedUser === user ? null : user;
                    render();
                });
            });

            // Force logout
            content.querySelectorAll('.btn-force-logout').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    forceLogout(e.currentTarget.dataset.user);
                    render();
                });
            });

            // Toggle active/disabled
            content.querySelectorAll('.btn-toggle-active').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const user = e.currentTarget.dataset.user;
                    const u = getCompanyUsers().find(u => u.username === user);
                    const action = u?.isActive !== false ? 'Disable' : 'Enable';
                    if (confirm(`${action} user "${user}"?`)) {
                        toggleUserActive(user);
                        render();
                    }
                });
            });

            // Edit user
            content.querySelectorAll('.btn-edit-user').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const user = e.currentTarget.dataset.user;
                    const currentRole = e.currentTarget.dataset.role;
                    const currentPass = e.currentTarget.dataset.pass;
                    const newRole = prompt(`Change role for "${user}"\n\nOptions: ADMIN, ACCOUNTANT, SALES, OPERATOR\n\nCurrent:`, currentRole);
                    if (newRole && ['ADMIN','ACCOUNTANT','SALES','OPERATOR'].includes(newRole.toUpperCase())) {
                        const newPass = prompt(`New password for "${user}" (leave empty to keep current):`, '');
                        const updates = { username: user, role: newRole.toUpperCase() };
                        if (newPass) updates.password = newPass;
                        saveCompanyUser(updates);
                        render();
                    } else if (newRole) {
                        alert('Invalid role. Use: ADMIN, ACCOUNTANT, SALES, or OPERATOR');
                    }
                });
            });

            // Delete user
            content.querySelectorAll('.btn-delete-user').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const user = e.currentTarget.dataset.user;
                    if (confirm(`Permanently remove "${user}"? This cannot be undone.`)) {
                        deleteCompanyUser(user);
                        render();
                    }
                });
            });

        // ══════════════════════════════════════════════════
        // TAB: COMPANIES
        // ══════════════════════════════════════════════════
        } else {
            const currentCompanyId = localStorage.getItem('company_id') || '';
            content.innerHTML = `
                <div class="card">
                    <div class="section-title mb-4"><i class="ph ph-buildings"></i> Your Company Workspaces</div>
                    <div class="alert alert-info mb-4" style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);color:var(--text-main);">
                        <i class="ph ph-info" style="color:var(--accent-primary);"></i>
                        Each company maintains its own isolated data. Click <strong>Open</strong> to switch.
                    </div>
                    ${state.companies.length === 0 ? `
                        <p class="text-center text-muted py-4">${isSupabaseConfigured() ? 'No companies found.' : 'Supabase not configured — manage companies from Login screen.'}</p>
                    ` : `
                        <table class="table">
                            <thead><tr><th>Company Name</th><th>Code</th><th style="text-align:center;">Status</th></tr></thead>
                            <tbody>${state.companies.map(cp => {
                                const isActive = cp.id === currentCompanyId;
                                return `
                                <tr style="${isActive ? 'background:rgba(99,102,241,0.06);' : ''}">
                                    <td><div class="font-bold">${cp.name}</div></td>
                                    <td class="text-muted font-mono" style="font-size:11px;">${cp.id}</td>
                                    <td style="text-align:center;">
                                        ${isActive
                                            ? '<span class="badge" style="background:var(--accent-success);color:white;font-size:10px;padding:4px 10px;"><i class="ph ph-check-circle"></i> Active</span>'
                                            : `<button class="btn btn-sm btn-primary btn-open-comp" data-id="${cp.id}" data-name="${cp.name}" style="font-size:11px;padding:4px 14px;">
                                                <i class="ph ph-folder-open"></i> Open
                                               </button>`
                                        }
                                    </td>
                                </tr>`;
                            }).join('')}</tbody>
                        </table>
                    `}
                </div>
            `;

            content.querySelectorAll('.btn-open-comp').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const cid = e.currentTarget.dataset.id;
                    const cname = e.currentTarget.dataset.name;
                    if (!confirm(`Switch to "${cname}"?\n\nCurrent company data will be saved and closed.`)) return;
                    db.saveData();
                    localStorage.setItem('company_id', cid);
                    localStorage.setItem('company_name', cname);
                    window.location.hash = 'dashboard';
                    window.location.reload();
                });
            });
        }
    };

    function getRoleBadgeColor(role) {
        const map = { 'ADMIN': '#6366f1', 'ACCOUNTANT': '#0ea5e9', 'SALES': '#f59e0b', 'OPERATOR': '#10b981' };
        return map[role] || '#6366f1';
    }

    c.addEventListener('click', e => {
        const t = e.target.closest('.tab');
        if (t && c.contains(t)) {
            state.activeTab = t.dataset.tab;
            if (state.activeTab === 'companies') loadCompanies().then(render);
            else render();
        }
    });

    render();
    return c;
}
