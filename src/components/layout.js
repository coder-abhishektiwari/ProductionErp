export function createLayout(navigate) {
    const template = `
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-icon">R</div>
          <div class="brand-name">RubberERP</div>
        </div>
        <div class="nav-menu">
           <div class="nav-section-title">Overview</div>
           <a href="#" class="nav-item active" data-route="dashboard">
              <i class="ph ph-squares-four"></i> Dashboard
           </a>

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
           <a href="#" class="nav-item" data-route="orders">
              <i class="ph ph-clipboard-text"></i> Customer Orders
           </a>
           <a href="#" class="nav-item" data-route="vouchers">
              <i class="ph ph-receipt"></i> Vouchers
           </a>

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
           </a>

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
           </a>

           <div class="nav-section-title">Setup</div>
           <a href="#" class="nav-item" data-route="masters">
              <i class="ph ph-database"></i> Masters
           </a>
        </div>
      </aside>
      <div class="main-wrapper">
        <header class="topbar">
           <div class="page-title" id="page-title">Dashboard</div>
           <div class="topbar-actions">
              <button class="btn btn-sm btn-danger" id="btn-reset-db">
                 <i class="ph ph-arrow-counter-clockwise"></i> Reset
              </button>
              <div class="user-profile">
                 <div class="avatar"><i class="ph ph-user"></i></div>
                 <span>Owner</span>
              </div>
           </div>
        </header>
        <main class="content" id="main-content"></main>
      </div>
    `;

    const appDiv = document.getElementById('app');
    appDiv.innerHTML = template;

    const navItems = appDiv.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            const route = item.getAttribute('data-route');
            document.getElementById('page-title').innerText = item.innerText.trim();
            navigate(route);
        });
    });
}
