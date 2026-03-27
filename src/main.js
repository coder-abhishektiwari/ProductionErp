import './style.css';
import { createLayout } from './components/layout.js';
import { db } from './store/db.js';

import DashboardView from './views/dashboard.js';
import PurchaseView from './views/purchase.js';
import PurchaseReturnView from './views/purchase-return.js';
import SalesView from './views/sales.js';
import SalesReturnView from './views/sales-return.js';
import OrdersView from './views/orders.js';
import VouchersView from './views/vouchers.js';
import ProductionSheetView from './views/production-sheet.js';
import ProductionProductView from './views/production-product.js';
import InventoryView from './views/inventory.js';
import AccountsView from './views/accounts.js';
import ExpensesView from './views/expenses.js';
import LoansView from './views/loans.js';
import GSTView from './views/gst.js';
import ReportsView from './views/reports.js';
import MastersView from './views/masters.js';

// Setup App Layout
createLayout(navigateTo);

const contentArea = document.getElementById('main-content');

// Router
function navigateTo(route) {
    contentArea.innerHTML = '';

    const viewMap = {
        'dashboard': DashboardView,
        'purchase': PurchaseView,
        'purchase-return': PurchaseReturnView,
        'sales': SalesView,
        'sales-return': SalesReturnView,
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
    };

    const ViewFn = viewMap[route] || DashboardView;
    contentArea.appendChild(ViewFn());
}

// Reset DB button
document.getElementById('btn-reset-db').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all data? This will delete all transactions and restore defaults.')) {
        db.clearData();
        navigateTo('dashboard');
    }
});

// Load default route
navigateTo('dashboard');
