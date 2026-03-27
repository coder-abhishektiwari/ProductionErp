import { db, formatDate, fmt } from '../store/db.js';

export default function SalesReturnView() {
    const c = document.createElement('div');
    c.className = 'animate-fade-in';
    let activeTab = 'entry';
    let items = [{ productId: '', qty: '', rate: '', gstRate: 18 }];

    const render = () => {
        c.innerHTML = `
          <div class="tabs">
            <div class="tab ${activeTab==='entry'?'active':''}" data-tab="entry">New Credit Note</div>
            <div class="tab ${activeTab==='register'?'active':''}" data-tab="register">Credit Note Register</div>
          </div>
          <div id="tab-content"></div>
        `;
        c.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { activeTab = t.dataset.tab; render(); }));
        const content = c.querySelector('#tab-content');
        if (activeTab === 'entry') renderEntry(content);
        else renderRegister(content);
    };

    const renderEntry = (el) => {
        const customers = db.data.customers;
        const products = db.data.products;
        // Show recent sales invoices for reference
        const recentInvoices = [...db.data.salesInvoices].reverse().slice(0, 10);

        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Sales Return (Credit Note)</div></div>
            <div class="grid-3 mb-4">
              <div class="form-group"><label class="form-label">Customer</label>
                <select class="form-control" id="sr-customer"><option value="">-- Select --</option>
                ${customers.map(cu => `<option value="${cu.id}" data-state="${cu.stateCode}">${cu.name}</option>`).join('')}</select></div>
              <div class="form-group"><label class="form-label">Against Invoice No</label>
                <select class="form-control" id="sr-orig-inv">
                  <option value="">-- Select Invoice --</option>
                  ${recentInvoices.map(inv => {
                    const cust = customers.find(cu => cu.id === inv.customerId);
                    return `<option value="${inv.invoiceNo}" data-cust="${inv.customerId}">${inv.invoiceNo} — ${cust?.name||'N/A'} — ₹${fmt(inv.grandTotal)}</option>`;
                  }).join('')}
                </select></div>
              <div class="form-group"><label class="form-label">Date</label>
                <input type="date" class="form-control" id="sr-date" value="${formatDate()}"></div>
            </div>

            <div class="form-group mb-4"><label class="form-label">Reason for Return</label>
              <input class="form-control" id="sr-reason" placeholder="E.g., Defective product / Size mismatch / Customer rejection"></div>

            <div class="panel mb-4">
              <div class="panel-title"><i class="ph ph-arrow-u-down-left"></i> Items Being Returned</div>
              <div id="sr-items"></div>
              <button class="btn btn-sm btn-secondary mt-4" id="btn-add-sr-item"><i class="ph ph-plus"></i> Add Item</button>
            </div>

            <div id="sr-summary" class="panel mb-4"></div>

            <div class="flex justify-end">
              <button class="btn btn-warning" id="btn-save-sr"><i class="ph ph-arrow-u-down-left"></i> Save Credit Note</button>
            </div>
          </div>
        `;

        // Auto-fill customer when invoice selected
        el.querySelector('#sr-orig-inv').addEventListener('change', e => {
            const opt = e.target.selectedOptions[0];
            if(opt?.dataset?.cust) {
                el.querySelector('#sr-customer').value = opt.dataset.cust;
                // Pre-fill items from that invoice
                const inv = db.data.salesInvoices.find(i => i.invoiceNo === e.target.value);
                if(inv) {
                    items = inv.items.map(i => ({
                        productId: i.productId, qty: i.qty, rate: i.rate, gstRate: i.gstRate || 18
                    }));
                    renderItems();
                }
            }
        });

        const renderItems = () => {
            const container = el.querySelector('#sr-items');
            container.innerHTML = items.map((item, idx) => `
              <div class="inline-row">
                <select class="form-control sr-prod" data-idx="${idx}" style="flex:2">
                  <option value="">-- Product --</option>
                  ${products.map(p => `<option value="${p.id}" data-rate="${p.rate}" data-gst="${p.gstRate}" ${item.productId===p.id?'selected':''}>${p.name} (${p.unit})</option>`).join('')}
                </select>
                <input type="number" class="form-control sr-qty" data-idx="${idx}" placeholder="Qty" value="${item.qty}" style="width:80px">
                <input type="number" class="form-control sr-rate" data-idx="${idx}" placeholder="Rate" value="${item.rate}" style="width:90px">
                <input type="number" class="form-control sr-gst" data-idx="${idx}" placeholder="GST%" value="${item.gstRate}" style="width:70px">
                <span class="text-sm text-muted" style="min-width:80px;text-align:right">₹${fmt((item.qty||0)*(item.rate||0))}</span>
                <button class="btn btn-ghost sr-del" data-idx="${idx}"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button>
              </div>
            `).join('');

            container.querySelectorAll('.sr-prod').forEach(s => s.addEventListener('change', e => {
                const idx = +e.target.dataset.idx; items[idx].productId = e.target.value;
                const opt = e.target.selectedOptions[0];
                if(opt) { items[idx].rate = Number(opt.dataset.rate)||0; items[idx].gstRate = Number(opt.dataset.gst)||18; }
                renderItems();
            }));
            container.querySelectorAll('.sr-qty').forEach(s => s.addEventListener('input', e => { items[+e.target.dataset.idx].qty = +e.target.value; updateSummary(); }));
            container.querySelectorAll('.sr-rate').forEach(s => s.addEventListener('input', e => { items[+e.target.dataset.idx].rate = +e.target.value; updateSummary(); }));
            container.querySelectorAll('.sr-gst').forEach(s => s.addEventListener('input', e => { items[+e.target.dataset.idx].gstRate = +e.target.value; updateSummary(); }));
            container.querySelectorAll('.sr-del').forEach(s => s.addEventListener('click', e => {
                items.splice(+e.currentTarget.dataset.idx, 1);
                if(!items.length) items.push({ productId: '', qty: '', rate: '', gstRate: 18 }); renderItems();
            }));
            updateSummary();
        };

        const updateSummary = () => {
            const custOpt = el.querySelector('#sr-customer').selectedOptions[0];
            const isInter = custOpt?.dataset?.state && custOpt.dataset.state !== db.data.companyInfo.stateCode;
            let sub = 0, gst = 0;
            items.forEach(i => { const amt = (i.qty||0)*(i.rate||0); sub += amt; gst += amt*((i.gstRate||0)/100); });
            el.querySelector('#sr-summary').innerHTML = `
              <div class="flex justify-between mb-2"><span>Subtotal</span><span class="font-bold">₹${fmt(sub)}</span></div>
              ${isInter ? `<div class="flex justify-between mb-2"><span>IGST (reversal)</span><span>₹${fmt(gst)}</span></div>` :
                `<div class="flex justify-between mb-2"><span>CGST (reversal)</span><span>₹${fmt(gst/2)}</span></div>
                 <div class="flex justify-between mb-2"><span>SGST (reversal)</span><span>₹${fmt(gst/2)}</span></div>`}
              <hr class="divider"><div class="flex justify-between"><span class="font-bold">Credit Note Total</span><span class="font-bold text-warning" style="font-size:1.1rem">₹${fmt(sub+gst)}</span></div>
            `;
        };

        el.querySelector('#btn-add-sr-item').addEventListener('click', () => { items.push({ productId: '', qty: '', rate: '', gstRate: 18 }); renderItems(); });
        el.querySelector('#sr-customer').addEventListener('change', updateSummary);
        el.querySelector('#btn-save-sr').addEventListener('click', () => {
            const customerId = el.querySelector('#sr-customer').value;
            if(!customerId) { alert('Select customer'); return; }
            const valid = items.filter(i => i.productId && i.qty > 0 && i.rate > 0);
            if(!valid.length) { alert('Add at least one item'); return; }
            const cust = db.data.customers.find(cu => cu.id === customerId);
            db.addSalesReturn({
                customerId, customerName: cust?.name, customerStateCode: cust?.stateCode,
                originalInvoiceNo: el.querySelector('#sr-orig-inv').value,
                date: el.querySelector('#sr-date').value, items: valid,
                reason: el.querySelector('#sr-reason').value
            });
            alert('Credit Note Saved!'); items = [{ productId: '', qty: '', rate: '', gstRate: 18 }]; render();
        });
        renderItems();
    };

    const renderRegister = (el) => {
        const returns = [...db.data.salesReturns].reverse();
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Credit Note Register (${returns.length})</div></div>
            <div class="table-responsive"><table class="table">
              <thead><tr><th>Date</th><th>CN#</th><th>Customer</th><th>Against Inv</th><th>Reason</th><th class="text-right">Amount</th><th>Action</th></tr></thead>
              <tbody>
                ${returns.map(r => {
                  const cust = db.data.customers.find(cu => cu.id === r.customerId);
                  return `<tr><td>${r.date}</td><td class="font-medium">${r.creditNoteNo}</td><td>${cust?.name||'N/A'}</td>
                    <td class="text-sm">${r.originalInvoiceNo||'-'}</td><td class="text-sm text-muted">${r.reason||'-'}</td>
                    <td class="text-right font-bold text-warning">₹${fmt(r.grandTotal)}</td>
                    <td><button class="btn btn-sm btn-ghost del-sr" data-id="${r.id}"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button></td></tr>`;
                }).join('')}
                ${!returns.length ? '<tr><td colspan="7" class="text-center text-muted">No sales returns yet</td></tr>' : ''}
              </tbody>
            </table></div>
          </div>
        `;
        el.querySelectorAll('.del-sr').forEach(btn => btn.addEventListener('click', e => {
            if(confirm('Delete this credit note?')) { db.deleteSalesReturn(e.currentTarget.dataset.id); render(); }
        }));
    };

    render(); return c;
}
