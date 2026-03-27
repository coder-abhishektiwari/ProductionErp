import { db, formatDate, fmt } from '../store/db.js';

export default function ProductionProductView() {
    const c = document.createElement('div');
    c.className = 'animate-fade-in';
    let activeTab = 'entry';
    let addChemRows = [];

    const render = () => {
        c.innerHTML = `
          <div class="tabs">
            <div class="tab ${activeTab==='entry'?'active':''}" data-tab="entry">Product Making Entry</div>
            <div class="tab ${activeTab==='history'?'active':''}" data-tab="history">Batch History</div>
            <div class="tab ${activeTab==='waste'?'active':''}" data-tab="waste">Waste Management</div>
          </div>
          <div id="tab-content"></div>
        `;
        c.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { activeTab = t.dataset.tab; render(); }));
        const content = c.querySelector('#tab-content');
        if (activeTab === 'entry') renderEntry(content);
        else if (activeTab === 'history') renderHistory(content);
        else renderWaste(content);
    };

    const renderEntry = (el) => {
        const products = db.data.products;
        const chemicals = db.data.chemicals;
        const sheetStock = db.getSheetStock();

        el.innerHTML = `
          <div class="card">
            <div class="section-header">
              <div><div class="section-title">Stage 2: Product Making Entry</div>
              <div class="section-subtitle">Cut sheets into finished rubber products</div></div>
            </div>

            <div class="grid-3 mb-4">
              ${sheetStock.map(s => `
                <div class="alert alert-info mb-0"><i class="ph ph-stack"></i> ${s.item.name}: <strong>${s.qty} Kg</strong></div>
              `).join('')}
            </div>

            <div class="grid-3 mb-4">
              <div class="form-group">
                <label class="form-label">Date</label>
                <input type="date" class="form-control" id="pm-date" value="${formatDate()}">
              </div>
              <div class="form-group">
                <label class="form-label">Product</label>
                <select class="form-control" id="pm-product">
                  <option value="">-- Select Product --</option>
                  ${products.map(p => `<option value="${p.id}" data-type="${p.productType}">${p.name} (${p.productType})</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Production Type</label>
                <select class="form-control" id="pm-type" disabled>
                  <option value="silicon">Silicon</option>
                  <option value="non-silicon">Non-Silicon</option>
                </select>
              </div>
            </div>

            <div class="grid-2 mb-4">
              <div class="panel">
                <div class="panel-title" style="color:var(--accent-danger)"><i class="ph ph-arrow-circle-down"></i> Input</div>
                <div class="form-group">
                  <label class="form-label">Sheet Consumed (Kg)</label>
                  <input type="number" class="form-control" id="pm-sheet-kg" placeholder="Kg of sheet used">
                </div>
                <div class="panel-title text-sm mt-4"><i class="ph ph-flask"></i> Additional Chemicals (optional)</div>
                <div id="pm-add-chems"></div>
                <button class="btn btn-sm btn-secondary mt-4" id="btn-add-pm-chem"><i class="ph ph-plus"></i> Add Chemical</button>
              </div>

              <div class="panel">
                <div class="panel-title" style="color:var(--accent-success)"><i class="ph ph-arrow-circle-up"></i> Output</div>
                <div class="form-group">
                  <label class="form-label">Finished Goods Qty</label>
                  <input type="number" class="form-control" id="pm-output-qty" placeholder="Pieces / Kg produced">
                </div>
                <div class="form-group" id="pm-waste-group">
                  <label class="form-label">Cutting Waste (Kg) <span class="text-xs text-muted">Non-silicon only</span></label>
                  <input type="number" class="form-control" id="pm-waste-kg" placeholder="Waste Kg">
                </div>
                <div class="form-group">
                  <label class="form-label">Operator</label>
                  <input class="form-control" id="pm-operator" placeholder="Operator name">
                </div>
                <div class="form-group">
                  <label class="form-label">Remarks</label>
                  <input class="form-control" id="pm-narration" placeholder="Batch notes">
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <button class="btn btn-primary" id="btn-save-pm"><i class="ph ph-floppy-disk"></i> Save Product Making Entry</button>
            </div>
          </div>
        `;

        // Auto-set production type from product
        el.querySelector('#pm-product').addEventListener('change', e => {
            const opt = e.target.selectedOptions[0];
            const pType = opt?.dataset?.type || 'non-silicon';
            el.querySelector('#pm-type').value = pType;
            // Hide waste for silicon
            el.querySelector('#pm-waste-group').style.display = pType === 'silicon' ? 'none' : '';
        });

        const renderAddChems = () => {
            const container = el.querySelector('#pm-add-chems');
            container.innerHTML = addChemRows.map((r, idx) => `
              <div class="inline-row">
                <select class="form-control pm-chem-sel" data-idx="${idx}" style="flex:1">
                  <option value="">-- Chemical --</option>
                  ${chemicals.map(ch => `<option value="${ch.id}" ${r.itemId===ch.id?'selected':''}>${ch.name}</option>`).join('')}
                </select>
                <input type="number" class="form-control pm-chem-qty" data-idx="${idx}" placeholder="Kg" value="${r.qty}" style="width:80px">
                <button class="btn btn-ghost pm-chem-del" data-idx="${idx}"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button>
              </div>
            `).join('');

            container.querySelectorAll('.pm-chem-sel').forEach(s => s.addEventListener('change', e => { addChemRows[+e.target.dataset.idx].itemId = e.target.value; }));
            container.querySelectorAll('.pm-chem-qty').forEach(s => s.addEventListener('input', e => { addChemRows[+e.target.dataset.idx].qty = +e.target.value; }));
            container.querySelectorAll('.pm-chem-del').forEach(s => s.addEventListener('click', e => { addChemRows.splice(+e.currentTarget.dataset.idx, 1); renderAddChems(); }));
        };

        el.querySelector('#btn-add-pm-chem').addEventListener('click', () => {
            addChemRows.push({ itemId: '', qty: '' });
            renderAddChems();
        });

        el.querySelector('#btn-save-pm').addEventListener('click', () => {
            const productId = el.querySelector('#pm-product').value;
            const sheetKg = Number(el.querySelector('#pm-sheet-kg').value);
            const outputQty = Number(el.querySelector('#pm-output-qty').value);
            const pType = el.querySelector('#pm-type').value;

            if (!productId) { alert('Select a product'); return; }
            if (!sheetKg || sheetKg <= 0) { alert('Enter sheet consumed'); return; }
            if (!outputQty || outputQty <= 0) { alert('Enter output qty'); return; }

            const product = db.data.products.find(p => p.id === productId);
            const wasteKg = pType === 'non-silicon' ? Number(el.querySelector('#pm-waste-kg').value) || 0 : 0;

            db.addProductMakingBatch({
                date: el.querySelector('#pm-date').value,
                productionType: pType,
                productId,
                productName: product?.name,
                sheetConsumedKg: sheetKg,
                additionalChemicals: addChemRows.filter(r => r.itemId && r.qty > 0),
                outputQty,
                wasteKg,
                operatorName: el.querySelector('#pm-operator').value,
                narration: el.querySelector('#pm-narration').value
            });

            alert('Product Making Entry Saved!');
            addChemRows = [];
            render();
        });

        renderAddChems();
    };

    const renderHistory = (el) => {
        const batches = db.getProductionBatches('product');
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Product Making Batch History</div></div>
            <div class="table-responsive">
              <table class="table">
                <thead><tr><th>Date</th><th>Product</th><th>Type</th><th class="text-right">Sheet In</th><th class="text-right">Output</th><th class="text-right">Waste</th><th>Waste%</th><th>Operator</th></tr></thead>
                <tbody>
                  ${batches.map(b => {
                    const prod = db.data.products.find(p => p.id === b.productId);
                    return `<tr>
                      <td>${b.date}</td><td>${prod?.name || b.productId}</td>
                      <td><span class="badge badge-${b.productionType==='silicon'?'info':'warning'}">${b.productionType}</span></td>
                      <td class="text-right">${b.sheetConsumedKg} Kg</td>
                      <td class="text-right font-bold">${b.outputQty}</td>
                      <td class="text-right">${b.wasteKg > 0 ? b.wasteKg + ' Kg' : '-'}</td>
                      <td>${b.wastePercent > 0 ? b.wastePercent + '%' : '-'}</td>
                      <td>${b.operatorName || '-'}</td>
                    </tr>`;
                  }).join('')}
                  ${batches.length===0?'<tr><td colspan="8" class="text-center text-muted">No batches yet</td></tr>':''}
                </tbody>
              </table>
            </div>
          </div>
        `;
    };

    const renderWaste = (el) => {
        const wasteQty = db.getWasteStock();
        el.innerHTML = `
          <div class="card">
            <div class="section-header">
              <div><div class="section-title">Cutting Waste Management (Non-Silicon)</div>
              <div class="section-subtitle">Current waste stock: <strong>${wasteQty} Kg</strong></div></div>
            </div>

            <div class="grid-2">
              <div class="panel">
                <div class="panel-title"><i class="ph ph-recycle"></i> Route 1: Send to Sheet Making</div>
                <p class="text-sm text-muted mb-4">Go to Stage 1: Sheet Making and select "Cutting Waste" as an input material to recycle it.</p>
                <button class="btn btn-secondary" onclick="document.querySelector('[data-route=production-sheet]')?.click()"><i class="ph ph-arrow-right"></i> Go to Sheet Making</button>
              </div>

              <div class="panel">
                <div class="panel-title"><i class="ph ph-currency-inr"></i> Route 2: Sell as Scrap</div>
                <div class="form-group">
                  <label class="form-label">Scrap Buyer Name</label>
                  <input class="form-control" id="scrap-buyer" placeholder="Dealer name">
                </div>
                <div class="grid-2">
                  <div class="form-group">
                    <label class="form-label">Qty (Kg)</label>
                    <input type="number" class="form-control" id="scrap-qty" placeholder="Kg">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Rate/Kg</label>
                    <input type="number" class="form-control" id="scrap-rate" placeholder="₹/Kg">
                  </div>
                </div>
                <button class="btn btn-warning" id="btn-sell-scrap"><i class="ph ph-floppy-disk"></i> Record Scrap Sale</button>
              </div>
            </div>
          </div>
        `;

        el.querySelector('#btn-sell-scrap')?.addEventListener('click', () => {
            const qty = Number(el.querySelector('#scrap-qty').value);
            const rate = Number(el.querySelector('#scrap-rate').value);
            const buyer = el.querySelector('#scrap-buyer').value;
            if (!qty || qty <= 0) { alert('Enter valid qty'); return; }
            if (qty > wasteQty) { alert(`Only ${wasteQty} Kg available`); return; }

            // Record waste reduction + scrap income
            const invData = [{ itemId: 'waste_nonsilicon', itemType: 'waste', qty: -qty, rate, amount: qty * rate }];
            const accData = [
                { accountId: 'acc_cash', drAmount: qty * rate, crAmount: 0 },
                { accountId: 'acc_scrap_income', drAmount: 0, crAmount: qty * rate }
            ];
            db.addVoucher({ date: formatDate(), type: 'Sales', narration: `Scrap sale to ${buyer} - ${qty}Kg @ ₹${rate}` }, accData, invData);
            alert('Scrap Sale Recorded!');
            render();
        });
    };

    render();
    return c;
}
