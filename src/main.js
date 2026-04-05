import './style.css';
import { createLayout } from './components/layout.js';
import initAIAssistant from './components/AIAssistant.js';
import { db } from './store/db.js';
import { SyncEngine } from './store/supabase-sync.js';
import { attachExcelFilters } from './utils/table-filter.js';

import DashboardView from './views/dashboard.js';
import PurchaseView from './views/purchase.js';
import PurchaseReturnView from './views/purchase-return.js';
import SalesView from './views/sales.js';
import SalesReturnView from './views/sales-return.js';
import OrdersView from './views/orders.js';
import ChallansView from './views/challans.js';
import VouchersView from './views/vouchers.js';
import ProductionSheetView from './views/production-sheet.js';
import ProductionProductView from './views/production-product.js';
import SystemView from './views/system.js';
import CompanyDetailsView from './views/company-details.js';
import InventoryView from './views/inventory.js';
import AccountsView from './views/accounts.js';
import ExpensesView from './views/expenses.js';
import LoansView from './views/loans.js';
import GSTView from './views/gst.js';
import ReportsView from './views/reports.js';
import MastersView from './views/masters.js';
import BackupView from './views/backup.js';
import LoginView from './views/login.js';

await db.init();
SyncEngine.init(db);
createLayout(navigateTo);
initAIAssistant();

const contentArea = document.getElementById('main-content');

// Global Table Filter Observer
const tableObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
                const tables = node.querySelectorAll('.table');
                tables.forEach(t => attachExcelFilters(t));
                if (node.tagName === 'TABLE' && node.classList.contains('table')) attachExcelFilters(node);
            }
        });
    }
});
tableObserver.observe(contentArea, { childList: true, subtree: true });

const viewCache = {};

// Router
function navigateTo(route) {
    const token = localStorage.getItem('token');
    if (!token && route !== 'login') {
        window.location.hash = 'login';
        return;
    }

    if (window.location.hash !== `#${route}`) {
        window.location.hash = route;
    }

    // Safely detach without destroying DOM state
    while (contentArea.firstChild) {
        contentArea.removeChild(contentArea.firstChild);
    }

    const viewMap = {
        'login': LoginView,
        'dashboard': DashboardView,
        'purchase': PurchaseView,
        'purchase-return': PurchaseReturnView,
        'sales': SalesView,
        'sales-return': SalesReturnView,
        'challans': ChallansView,
        'orders': OrdersView,
        'vouchers': VouchersView,
        'production-sheet': ProductionSheetView,
        'production-product': ProductionProductView,
        'inventory': InventoryView,
        'accounts': AccountsView,
        'expenses': ExpensesView,
        'loans': LoansView,
        'gst': GSTView,
        'reports': ReportsView,
        'masters': MastersView,
        'company-details': CompanyDetailsView,
        'backup': BackupView,
        'system': SystemView,
    };

    if (!viewCache[route]) {
        const ViewFn = viewMap[route] || DashboardView;
        viewCache[route] = ViewFn();
    }

    contentArea.appendChild(viewCache[route]);
}

window.addEventListener('hashchange', () => {
    const route = window.location.hash.substring(1) || 'dashboard';
    navigateTo(route);
});

// Reset DB button
document.getElementById('btn-reset-db')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all data? This will delete all transactions and restore defaults.')) {
        db.clearData();
        navigateTo('dashboard');
    }
});

// Topbar Export Backup Button (local IndexedDB export — no server needed)
document.getElementById('btn-export-backup')?.addEventListener('click', () => {
    try {
        const backup = {
            _meta: {
                app: 'RubberERP',
                version: '3.0-supabase',
                exportDate: new Date().toISOString(),
            },
            data: db.data
        };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RubberERP_Backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert('✅ Quick Backup exported successfully!');
    } catch (e) {
        alert('❌ Backup failed: ' + e.message);
    }
});

// Load route from hash or default
const initialRoute = window.location.hash.substring(1) || 'dashboard';
navigateTo(initialRoute);
