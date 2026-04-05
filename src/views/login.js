import { SyncEngine } from '../store/supabase-sync.js';
import { isSupabaseConfigured } from '../store/supabase-config.js';

export default function LoginView() {
    const c = document.createElement('div');
    c.className = 'login-container';
    c.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem;';

    let state = {
        // Views: 'master_login' → 'master_register' → 'companies' → 'create_company'
        view: 'master_login',
        masterUser: null,       // { username, displayName } - after master login
        companies: [],
        errorMsg: '',
        loading: false,
        companiesLoaded: false, // prevents infinite re-fetch when 0 companies exist
    };

    // Check if already logged in as master
    const savedMaster = localStorage.getItem('master_username');
    if (savedMaster) {
        state.masterUser = { username: savedMaster, displayName: savedMaster };
        state.view = 'companies';
    }

    // ── Offline Login ──────────────────────────────────────
    const doOfflineLogin = () => {
        localStorage.setItem('token', 'offline_' + Date.now());
        localStorage.setItem('role', 'ADMIN');
        localStorage.setItem('username', 'offline');
        localStorage.setItem('master_username', 'offline');
        localStorage.setItem('company_id', 'OFFLINE_LOCAL');
        localStorage.setItem('company_name', 'Offline Company');
        window.location.hash = 'dashboard';
        window.location.reload();
    };

    // ── Fetch companies for logged-in master user ──────────
    const loadCompanies = async () => {
        if (!state.masterUser) return;
        state.loading = true;
        state.errorMsg = '';
        render();
        try {
            state.companies = await SyncEngine.fetchCompanies(state.masterUser.username);
            state.loading = false;
            state.companiesLoaded = true;
            render();
        } catch (e) {
            state.loading = false;
            state.errorMsg = e.message;
            render();
        }
    };

    // ── Render ─────────────────────────────────────────────
    const render = () => {
        const configured = isSupabaseConfigured();

        // ══════════════════════════════════════════════════
        // VIEW: MASTER LOGIN (Software-level auth)
        // ══════════════════════════════════════════════════
        if (state.view === 'master_login') {
            c.innerHTML = `
                <div class="card" style="width:100%;max-width:420px;">
                    <div class="text-center mb-6">
                        <div style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:1.5rem;font-weight:700;color:white;box-shadow:0 8px 24px rgba(99,102,241,0.4);">R</div>
                        <h2 style="font-size:1.4rem;font-weight:700;margin:0;">RubberERP</h2>
                        <p class="text-sm text-muted" style="margin-top:4px;">Software Login</p>
                    </div>

                    ${!configured ? `
                        <div class="alert alert-warning mb-4" style="flex-direction:column;align-items:flex-start;gap:6px;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <i class="ph ph-cloud-slash" style="font-size:1.1rem;"></i>
                                <strong>Cloud Not Connected</strong>
                            </div>
                            <p class="text-xs" style="opacity:0.8;">Add Supabase credentials in <code>supabase-config.js</code></p>
                        </div>
                        <button class="btn btn-warning w-full" id="btn-offline">
                            <i class="ph ph-hard-drive"></i> Continue Offline
                        </button>
                    ` : `
                        <form id="master-login-form">
                            <div class="form-group">
                                <label class="form-label">Username</label>
                                <input type="text" class="form-control" id="ml-user" required placeholder="Enter your username" autofocus>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Password</label>
                                <input type="password" class="form-control" id="ml-pass" required placeholder="Enter password">
                            </div>
                            <button type="submit" class="btn btn-primary w-full" style="padding:12px;" id="btn-master-login">
                                <i class="ph ph-sign-in"></i> Login
                            </button>
                        </form>
                        <div id="ml-error" class="text-sm text-center mt-3" style="color:var(--accent-danger);min-height:20px;">${state.errorMsg}</div>
                        <div class="divider"></div>
                        <div class="flex gap-2">
                            <button class="btn btn-ghost btn-sm flex-1" id="btn-register-switch">
                                <i class="ph ph-user-plus"></i> New Account
                            </button>
                            <button class="btn btn-ghost btn-sm flex-1" id="btn-offline">
                                <i class="ph ph-hard-drive"></i> Offline Mode
                            </button>
                        </div>
                    `}
                </div>
            `;

            c.querySelector('#btn-offline')?.addEventListener('click', doOfflineLogin);
            c.querySelector('#btn-register-switch')?.addEventListener('click', () => {
                state.view = 'master_register';
                state.errorMsg = '';
                render();
            });

            c.querySelector('#master-login-form')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = c.querySelector('#btn-master-login');
                const errDiv = c.querySelector('#ml-error');
                const user = c.querySelector('#ml-user').value.trim();
                const pass = c.querySelector('#ml-pass').value;

                btn.disabled = true;
                btn.innerHTML = '<i class="ph ph-arrows-clockwise sync-spin"></i> Logging in...';
                errDiv.textContent = '';

                try {
                    const result = await SyncEngine.masterLogin(user, pass);
                    state.masterUser = result;
                    localStorage.setItem('master_username', result.username);
                    state.view = 'companies';
                    state.errorMsg = '';
                    await loadCompanies();
                } catch (err) {
                    errDiv.textContent = err.message;
                    btn.disabled = false;
                    btn.innerHTML = '<i class="ph ph-sign-in"></i> Login';
                }
            });
        }

        // ══════════════════════════════════════════════════
        // VIEW: MASTER REGISTER (New software account)
        // ══════════════════════════════════════════════════
        else if (state.view === 'master_register') {
            c.innerHTML = `
                <div class="card" style="width:100%;max-width:420px;">
                    <button class="btn btn-sm btn-ghost mb-4 text-muted" id="btn-back">
                        <i class="ph ph-arrow-left"></i> Back to Login
                    </button>
                    <div class="text-center mb-6">
                        <h2 style="font-size:1.3rem;font-weight:700;">Create Account</h2>
                        <p class="text-sm text-muted">Register a new software owner account</p>
                    </div>
                    <form id="register-form">
                        <div class="form-group">
                            <label class="form-label">Your Name</label>
                            <input type="text" class="form-control" id="reg-name" required placeholder="Ex: Rajesh Kumar">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Username</label>
                            <input type="text" class="form-control" id="reg-user" required placeholder="Choose a username">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Password</label>
                            <input type="password" class="form-control" id="reg-pass" required placeholder="Set password" minlength="4">
                        </div>
                        <button type="submit" class="btn btn-primary w-full" style="padding:12px;" id="btn-register">
                            <i class="ph ph-user-plus"></i> Create Account
                        </button>
                    </form>
                    <div id="reg-error" class="text-sm text-center mt-3" style="color:var(--accent-danger);min-height:20px;"></div>
                </div>
            `;

            c.querySelector('#btn-back').addEventListener('click', () => {
                state.view = 'master_login';
                state.errorMsg = '';
                render();
            });

            c.querySelector('#register-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = c.querySelector('#btn-register');
                const errDiv = c.querySelector('#reg-error');
                const name = c.querySelector('#reg-name').value.trim();
                const user = c.querySelector('#reg-user').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
                const pass = c.querySelector('#reg-pass').value;

                if (!user) { errDiv.textContent = 'Invalid username'; return; }

                btn.disabled = true;
                btn.innerHTML = '<i class="ph ph-arrows-clockwise sync-spin"></i> Creating...';
                errDiv.textContent = '';

                try {
                    await SyncEngine.masterRegister(user, pass, name);
                    // Auto-login after register
                    const result = await SyncEngine.masterLogin(user, pass);
                    state.masterUser = result;
                    localStorage.setItem('master_username', result.username);
                    state.view = 'companies';
                    state.errorMsg = '';
                    await loadCompanies();
                } catch (err) {
                    errDiv.textContent = err.message;
                    btn.disabled = false;
                    btn.innerHTML = '<i class="ph ph-user-plus"></i> Create Account';
                }
            });
        }

        // ══════════════════════════════════════════════════
        // VIEW: SELECT COMPANY (after master login)
        // ══════════════════════════════════════════════════
        else if (state.view === 'companies') {
            c.innerHTML = `
                <div class="card" style="width:100%;max-width:450px;">
                    <div class="flex justify-between items-center mb-4">
                        <div>
                            <p class="text-sm text-muted">Welcome back,</p>
                            <h2 style="font-size:1.2rem;font-weight:700;">${state.masterUser?.displayName || state.masterUser?.username || 'User'}</h2>
                        </div>
                        <button class="btn btn-sm btn-ghost" id="btn-master-logout" title="Logout">
                            <i class="ph ph-sign-out"></i>
                        </button>
                    </div>

                    <div class="divider"></div>
                    <p class="text-sm font-medium mb-4" style="color:var(--accent-primary);"><i class="ph ph-buildings"></i> Select Company Workspace</p>

                    ${state.loading ? `
                        <div class="text-center py-6">
                            <i class="ph ph-arrows-clockwise sync-spin" style="font-size:1.5rem;color:var(--accent-primary)"></i>
                            <p class="text-sm text-muted mt-2">Loading companies...</p>
                        </div>
                    ` : ''}

                    ${state.errorMsg && !state.loading ? `
                        <div class="alert alert-danger mb-4" style="flex-direction:column;align-items:flex-start;gap:4px;">
                            <strong><i class="ph ph-warning-circle"></i> Error</strong>
                            <p class="text-xs" style="opacity:0.85;">${state.errorMsg}</p>
                        </div>
                        <button class="btn btn-ghost btn-sm w-full mb-4" id="btn-retry">
                            <i class="ph ph-arrows-clockwise"></i> Retry
                        </button>
                    ` : ''}

                    ${!state.loading && !state.errorMsg ? `
                        <div class="flex flex-col gap-2 mb-4" style="max-height:300px;overflow-y:auto;">
                            ${state.companies.length === 0 ? `
                                <div class="text-center py-6">
                                    <i class="ph ph-buildings" style="font-size:2.5rem;color:var(--text-muted);opacity:0.3;"></i>
                                    <p class="text-sm text-muted mt-2">No companies yet. Create your first one below.</p>
                                </div>
                            ` : ''}
                            ${state.companies.map(cp => `
                                <button class="btn btn-secondary comp-btn justify-between" data-id="${cp.id}" data-name="${cp.name}">
                                    <span><i class="ph ph-buildings" style="color:var(--accent-primary);margin-right:8px;"></i> ${cp.name}</span>
                                    <i class="ph ph-caret-right"></i>
                                </button>
                            `).join('')}
                        </div>
                        <button class="btn btn-primary w-full mb-2" id="btn-new-comp">
                            <i class="ph ph-plus-circle"></i> Create New Company
                        </button>
                        <button class="btn btn-ghost btn-sm w-full" id="btn-offline-comp">
                            <i class="ph ph-hard-drive"></i> Use Offline Mode
                        </button>
                    ` : ''}
                </div>
            `;

            c.querySelector('#btn-master-logout')?.addEventListener('click', () => {
                localStorage.removeItem('master_username');
                state.masterUser = null;
                state.companies = [];
                state.view = 'master_login';
                state.errorMsg = '';
                render();
            });
            c.querySelector('#btn-retry')?.addEventListener('click', loadCompanies);
            c.querySelector('#btn-offline-comp')?.addEventListener('click', doOfflineLogin);

            c.querySelectorAll('.comp-btn').forEach(btn => btn.addEventListener('click', (e) => {
                const cid = e.currentTarget.dataset.id;
                const cname = e.currentTarget.dataset.name;
                // Set company in localStorage and enter dashboard
                localStorage.setItem('token', 'supabase_' + Date.now());
                localStorage.setItem('role', 'ADMIN');
                localStorage.setItem('username', state.masterUser.username);
                localStorage.setItem('company_id', cid);
                localStorage.setItem('company_name', cname);
                window.location.hash = 'dashboard';
                window.location.reload();
            }));

            c.querySelector('#btn-new-comp')?.addEventListener('click', () => {
                state.view = 'create_company';
                state.errorMsg = '';
                render();
            });

            // Auto-load companies on first visit (only once)
            if (!state.companiesLoaded && !state.loading && !state.errorMsg) {
                loadCompanies();
            }
        }

        // ══════════════════════════════════════════════════
        // VIEW: CREATE COMPANY
        // ══════════════════════════════════════════════════
        else if (state.view === 'create_company') {
            c.innerHTML = `
                <div class="card" style="width:100%;max-width:420px;">
                    <button class="btn btn-sm btn-ghost mb-4 text-muted" id="btn-back-comp">
                        <i class="ph ph-arrow-left"></i> Back
                    </button>
                    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:4px;">Create New Company</h2>
                    <p class="text-sm text-muted mb-6">This creates an isolated workspace with its own data.</p>

                    <form id="create-form">
                        <div class="form-group">
                            <label class="form-label">Company Name</label>
                            <input type="text" class="form-control" id="cc-name" required placeholder="Ex: Bhagwati Rubber Industries" autofocus>
                        </div>
                        <p class="text-xs text-muted mb-4">
                            <i class="ph ph-info"></i> Owner: <strong>${state.masterUser?.username}</strong> — You can add company-level users (operators, accountants) later from System Settings.
                        </p>
                        <button type="submit" class="btn btn-primary w-full" style="padding:12px;" id="btn-create">
                            <i class="ph ph-check-circle"></i> Create Company
                        </button>
                    </form>
                    <div id="cc-error" class="text-sm text-center mt-3" style="color:var(--accent-danger);min-height:20px;"></div>
                </div>
            `;

            c.querySelector('#btn-back-comp').addEventListener('click', () => {
                state.view = 'companies';
                state.errorMsg = '';
                render();
            });

            c.querySelector('#create-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = c.querySelector('#btn-create');
                const errDiv = c.querySelector('#cc-error');
                const name = c.querySelector('#cc-name').value.trim();

                btn.disabled = true;
                btn.innerHTML = '<i class="ph ph-arrows-clockwise sync-spin"></i> Creating...';
                errDiv.textContent = '';

                try {
                    const result = await SyncEngine.createCompany(name, state.masterUser.username);
                    if (result.success) {
                        state.view = 'companies';
                        state.errorMsg = '';
                        await loadCompanies();
                    }
                } catch (err) {
                    errDiv.textContent = err.message;
                    btn.disabled = false;
                    btn.innerHTML = '<i class="ph ph-check-circle"></i> Create Company';
                }
            });
        }
    };

    render();
    return c;
}
