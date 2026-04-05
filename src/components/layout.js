import { createSyncControls } from './sync-controls.js';

export function createLayout(navigate) {
   const role = localStorage.getItem('role') || '';
   const name = localStorage.getItem('username') || '';

   // Unauthenticated layout
   if (!localStorage.getItem('token')) {
      document.getElementById('app').innerHTML = `<main id="main-content" style="width: 100vw; height: 100vh; background: var(--bg-body); display: flex; align-items: center; justify-content: center;"></main>`;
      return;
   }

   const isAdmin = role === 'ADMIN';
   const isAcc = role === 'ACCOUNTANT';
   const isOp = role === 'OPERATOR';

   const template = `
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-icon">R</div>
          <div class="brand-info">
            <div class="brand-name">RubberERP</div>
            <div class="brand-subname" style="font-size: 11px; opacity: 0.8; font-weight: 500;">${localStorage.getItem('company_name') || ''}</div>
          </div>
        </div>
        <div class="nav-menu">
           ${!isOp ? `
           <div class="nav-section-title">Overview</div>
           <a href="#" class="nav-item active" data-route="dashboard">
              <i class="ph ph-squares-four"></i> Dashboard
           </a>` : ''}

           ${!isOp ? `
           <div class="nav-section-title">Transactions</div>
           <a href="#" class="nav-item" data-route="purchase">
              <i class="ph ph-shopping-cart"></i> Purchase
           </a>
           <a href="#" class="nav-item" data-route="purchase-return">
              <i class="ph ph-arrow-u-up-left"></i> Purchase Return
           </a>
           <a href="#" class="nav-item" data-route="sales">
              <i class="ph ph-storefront"></i> Sales & Invoice
           </a>
           <a href="#" class="nav-item" data-route="sales-return">
              <i class="ph ph-arrow-u-down-left"></i> Sales Return
           </a>
           <a href="#" class="nav-item" data-route="challans">
              <i class="ph ph-truck"></i> Delivery Challans
           </a>
           <a href="#" class="nav-item" data-route="orders">
              <i class="ph ph-clipboard-text"></i> Customer Orders
           </a>
           <a href="#" class="nav-item" data-route="vouchers">
              <i class="ph ph-receipt"></i> Vouchers
           </a>` : ''}

           ${isAdmin || isOp ? `
           <div class="nav-section-title">Production</div>
           <a href="#" class="nav-item" data-route="production-sheet">
              <i class="ph ph-stack"></i> Stage 1: Sheet Making
           </a>
           <a href="#" class="nav-item" data-route="production-product">
              <i class="ph ph-gear-six"></i> Stage 2: Product Making
           </a>
           <div class="nav-section-title">Inventory</div>
           <a href="#" class="nav-item" data-route="inventory">
              <i class="ph ph-package"></i> Stock Overview
           </a>` : ''}

           ${isAdmin || isAcc ? `
           <div class="nav-section-title">Finance</div>
           <a href="#" class="nav-item" data-route="accounts">
              <i class="ph ph-bank"></i> Cash & Bank
           </a>
           <a href="#" class="nav-item" data-route="expenses">
              <i class="ph ph-money"></i> Expenses
           </a>
           <a href="#" class="nav-item" data-route="loans">
              <i class="ph ph-handshake"></i> Loans
           </a>
           <a href="#" class="nav-item" data-route="gst">
              <i class="ph ph-percent"></i> GST
           </a>
           <a href="#" class="nav-item" data-route="reports">
              <i class="ph ph-chart-line-up"></i> Reports
           </a>` : ''}

           ${isAdmin ? `
           <div class="nav-section-title">Setup</div>
           <a href="#" class="nav-item" data-route="masters">
              <i class="ph ph-database"></i> Masters
           </a>
           <a href="#" class="nav-item" data-route="company-details">
              <i class="ph ph-buildings"></i> Company Details
           </a>
           <a href="#" class="nav-item" data-route="backup">
              <i class="ph ph-cloud-arrow-down"></i> Backup & Restore
           </a>
           <a href="#" class="nav-item" data-route="system">
              <i class="ph ph-shield-check"></i> System Settings
           </a>` : ''}
        </div>
      </aside>
      <div class="main-wrapper">
        <header class="topbar">
           <div class="page-title" id="page-title">${isOp ? 'Production Area' : 'Dashboard'}</div>
           <div class="topbar-actions">
              ${isAdmin ? `
              <button class="btn btn-sm btn-secondary" id="btn-export-backup" title="Export Backup">
                 <i class="ph ph-download-simple"></i> Backup
              </button>
              <button class="btn btn-sm btn-danger" id="btn-reset-db">
                 <i class="ph ph-arrow-counter-clockwise"></i> Reset
              </button>` : ''}
              <div id="sync-controls-mount"></div>
              <div class="user-profile">
                 <div class="avatar" style="background:var(--accent-primary); color:white;"><i class="ph ph-user"></i></div>
                 <span>${name} (${role})</span>
              </div>
              <button class="btn btn-sm btn-ghost" id="btn-logout" title="Sign Out">
                 <i class="ph ph-sign-out"></i>
              </button>
           </div>
        </header>
        <main class="content" id="main-content"></main>
      </div>
    `;

    const appDiv = document.getElementById('app');
    appDiv.innerHTML = template;

    // ── Route-Sync Logic (Fix for Persisting Header/Sidebar state) ──
    const navItems = appDiv.querySelectorAll('.nav-item');
    
    function syncUiToRoute() {
        const route = window.location.hash.substring(1) || 'dashboard';
        const pageTitleEl = document.getElementById('page-title');
        
        let found = false;
        navItems.forEach(item => {
            const itemRoute = item.getAttribute('data-route');
            if (itemRoute === route) {
                item.classList.add('active');
                if (pageTitleEl) pageTitleEl.innerText = item.innerText.trim();
                found = true;
            } else {
                item.classList.remove('active');
            }
        });

        // Special cases for views without sidebar items
        if (!found && pageTitleEl) {
            const titles = {
                'login': 'Login',
                'dashboard': 'Dashboard',
                'production-sheet': 'Stage 1: Sheet Making',
                'production-product': 'Stage 2: Product Making',
                'company-details': 'Company Details',
            };
            pageTitleEl.innerText = titles[route] || 'RubberERP';
        }
    }

    // Initialize UI state
    syncUiToRoute();

    // Listen for hash changes to keep sidebar/header in sync
    window.addEventListener('hashchange', syncUiToRoute);

    // Mount sync controls widget
    const syncMount = document.getElementById('sync-controls-mount');
    if (syncMount) {
        syncMount.appendChild(createSyncControls());
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const route = item.getAttribute('data-route');
            navigate(route); // This updates hash, which triggers syncUiToRoute
        });
    });

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.hash = 'login';
            window.location.reload();
        });
    }
}
