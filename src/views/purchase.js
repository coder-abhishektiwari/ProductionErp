import { db, formatDate, fmt } from '../store/db.js';

export default function PurchaseView() {
    const c = document.createElement('div');
    c.className = 'animate-fade-in';

    let activeTab = 'entry';
    let items = [{ chemicalId: '', qty: '', rate: '', gstRate: 18 }];

    const render = () => {
        c.innerHTML = `
          <div class="tabs no-print">
            <div class="tab ${activeTab==='entry'?'active':''}" data-tab="entry">Purchase Entry</div>
            <div class="tab ${activeTab==='register'?'active':''}" data-tab="register">Purchase Register</div>
            <div class="tab ${activeTab==='payables'?'active':''}" data-tab="payables">Outstanding Payables</div>
          </div>
          <div id="tab-content"></div>
        `;

        c.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
            activeTab = t.dataset.tab;
            render();
        }));

        const content = c.querySelector('#tab-content');
        if (activeTab === 'entry') renderEntry(content);
        else if (activeTab === 'register') renderRegister(content);
        else renderPayables(content);
    };

    const renderEntry = (el) => {
        const suppliers = db.data.suppliers;
        const chemicals = db.data.chemicals;
        const payAccounts = db.data.accounts.filter(a => a.accountKind === 'cash' || a.accountKind === 'bank' || a.accountKind === 'upi');

        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">New Purchase Invoice</div></div>
            <div class="grid-3 mb-4">
              <div class="form-group">
                <label class="form-label">Supplier</label>
                <select class="form-control" id="pur-supplier">
                  <option value="">-- Select Supplier --</option>
                  ${suppliers.map(s => `<option value="${s.id}" data-state="${s.stateCode}">${s.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Invoice No</label>
                <input class="form-control" id="pur-invno" placeholder="Supplier Invoice No">
              </div>
              <div class="form-group">
                <label class="form-label">Date</label>
                <input type="date" class="form-control" id="pur-date" value="${formatDate()}">
              </div>
            </div>

            <div class="panel mb-4">
              <div class="panel-title"><i class="ph ph-list-bullets"></i> Invoice Items</div>
              <div id="pur-items"></div>
              <button class="btn btn-sm btn-secondary mt-4" id="btn-add-pur-item"><i class="ph ph-plus"></i> Add Item</button>
            </div>

            <div class="grid-3 mb-4">
              <div class="form-group">
                <label class="form-label">Payment Mode</label>
                <select class="form-control" id="pur-paymode">
                  <option value="credit">On Credit</option>
                  <option value="cash">Immediate Payment</option>
                </select>
              </div>
              <div class="form-group" id="pur-acc-group" style="display:none">
                <label class="form-label">Pay From Account</label>
                <select class="form-control" id="pur-account">
                  ${payAccounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                </select>
              </div>
              <div></div>
            </div>

            <div id="pur-summary" class="panel mb-4"></div>

            <div class="flex justify-end">
              <button class="btn btn-primary" id="btn-save-pur"><i class="ph ph-floppy-disk"></i> Save Purchase</button>
            </div>
          </div>
        `;

        // Show/hide account
        el.querySelector('#pur-paymode').addEventListener('change', (e) => {
            el.querySelector('#pur-acc-group').style.display = e.target.value === 'cash' ? '' : 'none';
        });

        const renderItems = () => {
            const container = el.querySelector('#pur-items');
            container.innerHTML = items.map((item, idx) => `
              <div class="inline-row">
                <select class="form-control pur-chem" data-idx="${idx}" style="flex:2">
                  <option value="">-- Chemical --</option>
                  ${chemicals.map(ch => `<option value="${ch.id}" data-gst="${ch.gstRate}" ${item.chemicalId===ch.id?'selected':''}>${ch.name} (${ch.unit})</option>`).join('')}
                </select>
                <input type="number" class="form-control pur-qty" data-idx="${idx}" placeholder="Qty (Kg)" value="${item.qty}" style="width:100px">
                <input type="number" class="form-control pur-rate" data-idx="${idx}" placeholder="Rate/Kg" value="${item.rate}" style="width:100px">
                <input type="number" class="form-control pur-gst" data-idx="${idx}" placeholder="GST%" value="${item.gstRate}" style="width:80px">
                <span class="text-sm text-muted" style="min-width:90px;text-align:right">₹${fmt((item.qty||0)*(item.rate||0))}</span>
                <button class="btn btn-ghost btn-del-pur" data-idx="${idx}"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button>
              </div>
            `).join('');

            // Events
            container.querySelectorAll('.pur-chem').forEach(s => s.addEventListener('change', e => {
                const idx = +e.target.dataset.idx;
                items[idx].chemicalId = e.target.value;
                const opt = e.target.selectedOptions[0];
                if (opt) items[idx].gstRate = Number(opt.dataset.gst) || 18;
                renderItems();
            }));
            container.querySelectorAll('.pur-qty').forEach(s => s.addEventListener('input', e => { items[+e.target.dataset.idx].qty = +e.target.value; updateSummary(); }));
            container.querySelectorAll('.pur-rate').forEach(s => s.addEventListener('input', e => { items[+e.target.dataset.idx].rate = +e.target.value; updateSummary(); }));
            container.querySelectorAll('.pur-gst').forEach(s => s.addEventListener('input', e => { items[+e.target.dataset.idx].gstRate = +e.target.value; updateSummary(); }));
            container.querySelectorAll('.btn-del-pur').forEach(s => s.addEventListener('click', e => {
                items.splice(+e.currentTarget.dataset.idx, 1);
                if (items.length === 0) items.push({ chemicalId: '', qty: '', rate: '', gstRate: 18 });
                renderItems();
            }));
            updateSummary();
        };

        const updateSummary = () => {
            const supSel = el.querySelector('#pur-supplier');
            const supOpt = supSel.selectedOptions[0];
            const supState = supOpt?.dataset?.state || '';
            const isInter = supState && supState !== db.data.companyInfo.stateCode;

            let sub = 0, gstTotal = 0;
            items.forEach(item => {
                const amt = (item.qty || 0) * (item.rate || 0);
                sub += amt;
                gstTotal += amt * ((item.gstRate || 0) / 100);
            });

            const sumEl = el.querySelector('#pur-summary');
            sumEl.innerHTML = `
              <div class="flex justify-between mb-2"><span>Subtotal</span><span class="font-bold">₹${fmt(sub)}</span></div>
              ${isInter ?
                `<div class="flex justify-between mb-2"><span>IGST</span><span>₹${fmt(gstTotal)}</span></div>` :
                `<div class="flex justify-between mb-2"><span>CGST</span><span>₹${fmt(gstTotal/2)}</span></div>
                 <div class="flex justify-between mb-2"><span>SGST</span><span>₹${fmt(gstTotal/2)}</span></div>`
              }
              <hr class="divider">
              <div class="flex justify-between"><span class="font-bold">Grand Total</span><span class="font-bold" style="font-size:1.1rem">₹${fmt(sub + gstTotal)}</span></div>
            `;
        };

        el.querySelector('#btn-add-pur-item').addEventListener('click', () => {
            items.push({ chemicalId: '', qty: '', rate: '', gstRate: 18 });
            renderItems();
        });

        el.querySelector('#pur-supplier').addEventListener('change', updateSummary);

        el.querySelector('#btn-save-pur').addEventListener('click', () => {
            const supplierId = el.querySelector('#pur-supplier').value;
            if (!supplierId) { alert('Select a supplier'); return; }
            const validItems = items.filter(i => i.chemicalId && i.qty > 0 && i.rate > 0);
            if (validItems.length === 0) { alert('Add at least one valid item'); return; }

            const sup = db.data.suppliers.find(s => s.id === supplierId);
            db.addPurchaseInvoice({
                supplierId,
                supplierName: sup?.name,
                supplierStateCode: sup?.stateCode,
                invoiceNo: el.querySelector('#pur-invno').value,
                date: el.querySelector('#pur-date').value,
                items: validItems,
                paymentMode: el.querySelector('#pur-paymode').value,
                accountId: el.querySelector('#pur-account').value
            });

            alert('Purchase Invoice Saved!');
            items = [{ chemicalId: '', qty: '', rate: '', gstRate: 18 }];
            render();
        });

        renderItems();
    };

    const renderRegister = (el) => {
        const invoices = [...db.data.purchaseInvoices].reverse();
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Purchase Register (${invoices.length})</div></div>
            <div class="table-responsive">
              <table class="table">
                <thead><tr><th>Date</th><th>Invoice #</th><th>Supplier</th><th class="text-right">Subtotal</th><th class="text-right">GST</th><th class="text-right">Grand Total</th><th>Action</th></tr></thead>
                <tbody>
                  ${invoices.map(inv => {
                    const sup = db.data.suppliers.find(s => s.id === inv.supplierId);
                    return `<tr>
                      <td>${inv.date}</td><td>${inv.invoiceNo}</td><td>${sup?.name || 'N/A'}</td>
                      <td class="text-right">₹${fmt(inv.subtotal)}</td>
                      <td class="text-right">₹${fmt(inv.cgst + inv.sgst + inv.igst)}</td>
                      <td class="text-right font-bold">₹${fmt(inv.grandTotal)}</td>
                      <td><button class="btn btn-sm btn-ghost del-pur-inv" data-id="${inv.id}"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button></td>
                    </tr>`;
                  }).join('')}
                  ${invoices.length === 0 ? '<tr><td colspan="7" class="text-center text-muted">No purchases yet</td></tr>' : ''}
                </tbody>
              </table>
            </div>
          </div>
        `;
        el.querySelectorAll('.del-pur-inv').forEach(btn => btn.addEventListener('click', e => {
            if(confirm('Delete this purchase invoice? This will reverse all accounting and inventory entries.')) {
                db.deletePurchaseInvoice(e.currentTarget.dataset.id); render();
            }
        }));
    };

    const renderPayables = (el) => {
        const payables = db.getOutstandingPayables();
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Outstanding Payables</div></div>
            <div class="table-responsive">
              <table class="table">
                <thead><tr><th>Supplier</th><th class="text-right">Amount Outstanding</th></tr></thead>
                <tbody>
                  ${payables.map(p => `<tr><td>${p.party.name}</td><td class="text-right font-bold text-danger">₹${fmt(p.amount)}</td></tr>`).join('')}
                  ${payables.length === 0 ? '<tr><td colspan="2" class="text-center text-muted">No outstanding payables</td></tr>' : ''}
                </tbody>
              </table>
            </div>
          </div>
        `;
    };

    render();
    return c;
}
