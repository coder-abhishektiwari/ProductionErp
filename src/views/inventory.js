import { db, fmt } from '../store/db.js';

export default function InventoryView() {
    const c = document.createElement('div');
    c.className = 'animate-fade-in';
    let activeTab = 'chemicals';

    const render = () => {
        c.innerHTML = `
          <div class="tabs">
            <div class="tab ${activeTab==='chemicals'?'active':''}" data-tab="chemicals">Raw Materials</div>
            <div class="tab ${activeTab==='sheets'?'active':''}" data-tab="sheets">Rubber Sheets</div>
            <div class="tab ${activeTab==='products'?'active':''}" data-tab="products">Finished Goods</div>
            <div class="tab ${activeTab==='waste'?'active':''}" data-tab="waste">Cutting Waste</div>
            <div class="tab ${activeTab==='movements'?'active':''}" data-tab="movements">Stock Movements</div>
          </div>
          <div id="tab-content"></div>
        `;
        c.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { activeTab = t.dataset.tab; render(); }));
        const content = c.querySelector('#tab-content');
        if (activeTab === 'chemicals') renderChemicals(content);
        else if (activeTab === 'sheets') renderSheets(content);
        else if (activeTab === 'products') renderProducts(content);
        else if (activeTab === 'waste') renderWaste(content);
        else renderMovements(content);
    };

    const renderChemicals = (el) => {
        const stock = db.getChemicalStock();
        const lowAlerts = db.getLowStockAlerts();
        el.innerHTML = `
          ${lowAlerts.length > 0 ? `<div class="alert alert-warning mb-4"><i class="ph ph-warning"></i> <strong>Low Stock:</strong> ${lowAlerts.map(a => `${a.name} (${a.currentQty}/${a.minStock} ${a.unit})`).join(', ')}</div>` : ''}
          <div class="card">
            <div class="section-header"><div class="section-title">Raw Material (Chemical) Stock</div></div>
            <div class="table-responsive">
              <table class="table">
                <thead><tr><th>Chemical Name</th><th>HSN</th><th>Unit</th><th class="text-right">Min Stock</th><th class="text-right">Current Qty</th><th>Status</th></tr></thead>
                <tbody>
                  ${stock.map(s => {
                    const isLow = s.qty < (s.item.minStock || 0);
                    return `<tr>
                      <td class="font-medium">${s.item.name}</td>
                      <td class="text-muted text-sm">${s.item.hsnCode || '-'}</td>
                      <td>${s.item.unit}</td>
                      <td class="text-right">${s.item.minStock || '-'}</td>
                      <td class="text-right font-bold ${isLow ? 'text-danger' : ''}">${s.qty}</td>
                      <td>${isLow ? '<span class="badge badge-danger">Low</span>' : '<span class="badge badge-success">OK</span>'}</td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
    };

    const renderSheets = (el) => {
        const stock = db.getSheetStock();
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Rubber Sheet Stock</div></div>
            <div class="grid-2 mb-4">
              ${stock.map(s => `
                <div class="panel">
                  <div class="flex justify-between items-center">
                    <div>
                      <div class="font-bold" style="font-size:1.1rem">${s.item.name}</div>
                      <div class="text-sm text-muted">${s.item.sheetType}</div>
                    </div>
                    <div class="stat-value ${s.qty < 0 ? 'text-danger' : 'text-success'}">${s.qty} Kg</div>
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="section-subtitle">Sheet exits via: Production (Stage 2), Direct Sale, Recycled into Sheet Making, or Silicon direct use.</div>
          </div>
        `;
    };

    const renderProducts = (el) => {
        const stock = db.getProductStock();
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Finished Goods Stock</div></div>
            <div class="table-responsive">
              <table class="table">
                <thead><tr><th>Product Name</th><th>Type</th><th>HSN</th><th>Unit</th><th class="text-right">Rate (₹)</th><th class="text-right">Current Qty</th></tr></thead>
                <tbody>
                  ${stock.map(s => `<tr>
                    <td class="font-medium">${s.item.name}</td>
                    <td><span class="badge badge-${s.item.productType==='silicon'?'info':'warning'}">${s.item.productType}</span></td>
                    <td class="text-sm text-muted">${s.item.hsnCode || '-'}</td>
                    <td>${s.item.unit}</td>
                    <td class="text-right">₹${fmt(s.item.rate)}</td>
                    <td class="text-right font-bold ${s.qty < 0 ? 'text-danger' : ''}">${s.qty}</td>
                  </tr>`).join('')}
                  ${stock.length===0?'<tr><td colspan="6" class="text-center text-muted">No products</td></tr>':''}
                </tbody>
              </table>
            </div>
          </div>
        `;
    };

    const renderWaste = (el) => {
        const wasteQty = db.getWasteStock();
        // Waste generation history from product batches
        const wasteBatches = db.getProductionBatches('product').filter(b => b.wasteKg > 0);
        el.innerHTML = `
          <div class="card mb-4">
            <div class="flex justify-between items-center">
              <div><div class="section-title">Non-Silicon Cutting Waste</div><div class="section-subtitle">Silicon waste is not tracked per business rule</div></div>
              <div class="stat-value text-warning">${wasteQty} Kg</div>
            </div>
          </div>
          <div class="card">
            <div class="section-header"><div class="section-title">Waste Generation Log</div></div>
            <div class="table-responsive">
              <table class="table">
                <thead><tr><th>Date</th><th>Product</th><th class="text-right">Sheet In (Kg)</th><th class="text-right">Waste (Kg)</th><th>Waste %</th></tr></thead>
                <tbody>
                  ${wasteBatches.map(b => {
                    const prod = db.data.products.find(p => p.id === b.productId);
                    return `<tr><td>${b.date}</td><td>${prod?.name || '-'}</td>
                      <td class="text-right">${b.sheetConsumedKg}</td>
                      <td class="text-right text-warning font-bold">${b.wasteKg}</td>
                      <td>${b.wastePercent}%</td></tr>`;
                  }).join('')}
                  ${wasteBatches.length===0?'<tr><td colspan="5" class="text-center text-muted">No waste records</td></tr>':''}
                </tbody>
              </table>
            </div>
          </div>
        `;
    };

    const renderMovements = (el) => {
        const txns = [...db.data.inventoryTransactions].reverse().slice(0, 50);
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Recent Stock Movements (Last 50)</div></div>
            <div class="table-responsive">
              <table class="table">
                <thead><tr><th>Voucher</th><th>Item Type</th><th>Item</th><th class="text-right">Qty</th><th>Direction</th></tr></thead>
                <tbody>
                  ${txns.map(t => {
                    const voucher = db.data.vouchers.find(v => v.id === t.voucherId);
                    let itemName = t.itemId;
                    if (t.itemType === 'chemical') { const ch = db.data.chemicals.find(c => c.id === t.itemId); itemName = ch?.name || t.itemId; }
                    else if (t.itemType === 'sheet') { const sh = db.data.sheetTypes.find(s => s.id === t.itemId); itemName = sh?.name || t.itemId; }
                    else if (t.itemType === 'product') { const pr = db.data.products.find(p => p.id === t.itemId); itemName = pr?.name || t.itemId; }
                    else if (t.itemType === 'waste') itemName = 'Cutting Waste';
                    return `<tr>
                      <td class="text-sm">${voucher?.voucherNo || '-'} <span class="text-muted">(${voucher?.date || ''})</span></td>
                      <td><span class="badge badge-${t.itemType==='chemical'?'primary':t.itemType==='sheet'?'info':t.itemType==='product'?'success':'warning'}">${t.itemType}</span></td>
                      <td>${itemName}</td>
                      <td class="text-right font-bold">${Math.abs(t.qty)}</td>
                      <td>${t.qty > 0 ? '<span class="text-success">▲ IN</span>' : '<span class="text-danger">▼ OUT</span>'}</td>
                    </tr>`;
                  }).join('')}
                  ${txns.length===0?'<tr><td colspan="5" class="text-center text-muted">No movements yet</td></tr>':''}
                </tbody>
              </table>
            </div>
          </div>
        `;
    };

    render();
    return c;
}
