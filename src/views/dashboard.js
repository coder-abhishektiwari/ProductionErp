import { db, fmt } from '../store/db.js';

export default function DashboardView() {
  const c = document.createElement('div');
  c.className = 'animate-fade-in';

  const render = () => {
    // Data
    const accBals = db.getAccountBalances();
    const totalCashBank = accBals.reduce((s, a) => s + a.balance, 0);
    const receivables = db.getOutstandingReceivables();
    const payables = db.getOutstandingPayables();
    const totalReceivable = receivables.reduce((s, r) => s + r.amount, 0);
    const totalPayable = payables.reduce((s, p) => s + p.amount, 0);
    const lowStock = db.getLowStockAlerts();
    const chemStock = db.getChemicalStock();
    const sheetStock = db.getSheetStock();
    const productStock = db.getProductStock();
    const wasteStock = db.getWasteStock();
    const recentTxns = db.getRecentTransactions(7);
    const pendingOrders = db.data.customerOrders.filter(o => o.status === 'pending' || o.status === 'partial');
    const gst = db.getGSTSummary();
    const pl = db.getProfitAndLoss();

    c.innerHTML = `
          <!-- Row 1: Key Metrics -->
          <div class="grid-5 mb-6">
             <div class="card stat-card">
                <div class="stat-header"><span>Cash & Bank</span><div class="stat-icon"><i class="ph ph-wallet"></i></div></div>
                <div class="stat-value">₹${fmt(totalCashBank)}</div>
                <div class="stat-trend trend-up"><i class="ph ph-bank"></i> ${accBals.length} accounts</div>
             </div>
             <div class="card stat-card">
                <div class="stat-header"><span>Receivables</span><div class="stat-icon" style="color:var(--accent-success);background:rgba(16,185,129,0.1)"><i class="ph ph-arrow-down-left"></i></div></div>
                <div class="stat-value">₹${fmt(totalReceivable)}</div>
                <div class="stat-trend text-muted">${receivables.length} parties</div>
             </div>
             <div class="card stat-card">
                <div class="stat-header"><span>Payables</span><div class="stat-icon" style="color:var(--accent-danger);background:rgba(239,68,68,0.1)"><i class="ph ph-arrow-up-right"></i></div></div>
                <div class="stat-value">₹${fmt(totalPayable)}</div>
                <div class="stat-trend text-muted">${payables.length} parties</div>
             </div>
             <div class="card stat-card">
                <div class="stat-header"><span>Net Profit</span><div class="stat-icon" style="color:var(--accent-warning);background:rgba(245,158,11,0.1)"><i class="ph ph-trending-up"></i></div></div>
                <div class="stat-value ${pl.netProfit >= 0 ? 'text-success' : 'text-danger'}">₹${fmt(pl.netProfit)}</div>
                <div class="stat-trend text-muted">Current period</div>
             </div>
             <div class="card stat-card">
                <div class="stat-header"><span>GST Payable</span><div class="stat-icon" style="color:var(--accent-info);background:rgba(56,189,248,0.1)"><i class="ph ph-percent"></i></div></div>
                <div class="stat-value">₹${fmt(gst.netPayable)}</div>
                <div class="stat-trend text-muted">Output − Input</div>
             </div>
          </div>

          ${lowStock.length > 0 ? `
          <div class="alert alert-warning mb-4">
            <i class="ph ph-warning"></i> <strong>Low Stock Alert:</strong> 
            ${lowStock.map(a => `${a.name} (${a.currentQty}/${a.minStock} ${a.unit})`).join(', ')}
          </div>` : ''}

          <!-- Row 2: Stock Overview + Pending Orders -->
          <div class="grid-3 mb-6">
             <div class="card">
                <div class="section-header"><div class="section-title">Raw Material Stock</div></div>
                <div class="table-responsive" style="max-height:200px;overflow-y:auto">
                  <table class="table">
                    <thead><tr><th>Chemical</th><th class="text-right">Qty</th></tr></thead>
                    <tbody>
                      ${chemStock.map(s => `<tr><td>${s.item.name}</td><td class="text-right ${s.qty < (s.item.minStock || 0) ? 'text-danger font-bold' : ''}">${s.qty} ${s.item.unit}</td></tr>`).join('')}
                      ${chemStock.length === 0 ? '<tr><td colspan="2" class="text-center text-muted">No chemicals</td></tr>' : ''}
                    </tbody>
                  </table>
                </div>
             </div>
             <div class="card">
                <div class="section-header"><div class="section-title">Sheet & Waste Stock</div></div>
                <div class="table-responsive">
                  <table class="table">
                    <thead><tr><th>Type</th><th class="text-right">Qty (Kg)</th></tr></thead>
                    <tbody>
                      ${sheetStock.map(s => `<tr><td>${s.item.name}</td><td class="text-right font-bold">${s.qty}</td></tr>`).join('')}
                      <tr><td>Cutting Waste (Non-Silicon)</td><td class="text-right font-bold text-warning">${wasteStock}</td></tr>
                    </tbody>
                  </table>
                </div>
             </div>
             <div class="card">
                <div class="section-header"><div class="section-title">Pending Orders (${pendingOrders.length})</div></div>
                <div style="max-height:250px;overflow-y:auto">
                  ${pendingOrders.length === 0 ? '<p class="text-muted text-sm">No pending orders</p>' :
                    pendingOrders.map(o => {
                      const cust = db.data.customers.find(c => c.id === o.customerId);
                      return `<div style="padding:0.5rem 0;border-bottom:1px solid var(--border-color)">
                        <div class="flex justify-between"><span class="font-medium">${cust?.name || 'N/A'}</span><span class="badge badge-${o.status==='partial'?'info':'warning'}">${o.status === 'partial' ? 'Partial' : 'Pending'}</span></div>
                        <div class="text-xs text-muted mb-1">Due: ${o.dueDate || 'N/A'}</div>
                        ${(o.items || []).map(item => {
                          const prod = db.data.products.find(p => p.id === item.productId);
                          const remaining = item.qty - (item.fulfilledQty || 0);
                          return `<div class="text-xs" style="padding:2px 0;display:flex;justify-content:space-between">
                            <span>${prod?.name || item.productId}</span>
                            <span>${remaining > 0 && remaining < item.qty ? `<span class="text-success">${item.fulfilledQty || 0}</span> / ` : ''}${remaining} ${remaining < item.qty ? 'remaining' : 'pcs'}</span>
                          </div>`;
                        }).join('')}
                      </div>`;
                    }).join('')}
                </div>
             </div>
          </div>

          <!-- Row 3: Account Balances + Recent Transactions + Finished Goods -->
          <div class="grid-3">
             <div class="card">
                <div class="section-header"><div class="section-title">Account Balances</div></div>
                <div class="table-responsive">
                  <table class="table">
                    <thead><tr><th>Account</th><th class="text-right">Balance</th></tr></thead>
                    <tbody>
                      ${accBals.map(a => `<tr><td>${a.account.name}</td><td class="text-right font-bold">₹${fmt(a.balance)}</td></tr>`).join('')}
                      ${accBals.length === 0 ? '<tr><td colspan="2" class="text-center text-muted">No accounts</td></tr>' : ''}
                    </tbody>
                  </table>
                </div>
             </div>
             <div class="card">
                <div class="section-header"><div class="section-title">Recent Vouchers</div></div>
                <div class="table-responsive" style="max-height:200px;overflow-y:auto">
                  <table class="table">
                    <thead><tr><th>Date</th><th>No.</th><th>Type</th></tr></thead>
                    <tbody>
                      ${recentTxns.map(v => `<tr><td>${v.date}</td><td>${v.voucherNo}</td><td><span class="badge badge-${v.type === 'Sales' ? 'success' : v.type === 'Purchase' ? 'warning' : 'info'}">${v.type}</span></td></tr>`).join('')}
                      ${recentTxns.length === 0 ? '<tr><td colspan="3" class="text-center text-muted">No transactions</td></tr>' : ''}
                    </tbody>
                  </table>
                </div>
             </div>
             <div class="card">
                <div class="section-header"><div class="section-title">Finished Goods Stock</div></div>
                <div class="table-responsive" style="max-height:200px;overflow-y:auto">
                  <table class="table">
                    <thead><tr><th>Product</th><th class="text-right">Qty</th></tr></thead>
                    <tbody>
                      ${productStock.map(s => `<tr><td>${s.item.name}</td><td class="text-right font-bold">${s.qty} ${s.item.unit}</td></tr>`).join('')}
                      ${productStock.length === 0 ? '<tr><td colspan="2" class="text-center text-muted">No products</td></tr>' : ''}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        `;
  };

  render();
  const unsub = db.subscribe(() => { if (document.body.contains(c)) render(); });
  return c;
}
