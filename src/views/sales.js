import { db, formatDate, fmt } from '../store/db.js';

export default function SalesView() {
    const c = document.createElement('div');
    c.className = 'animate-fade-in';
    let activeTab = 'entry';
    let items = [{ productId: '', qty: '', rate: '', gstRate: 18, hsnCode: '' }];

    const render = () => {
        c.innerHTML = `
          <div class="tabs no-print">
            <div class="tab ${activeTab==='entry'?'active':''}" data-tab="entry">Sales Invoice</div>
            <div class="tab ${activeTab==='register'?'active':''}" data-tab="register">Sales Register</div>
            <div class="tab ${activeTab==='receivables'?'active':''}" data-tab="receivables">Outstanding Receivables</div>
          </div>
          <div id="tab-content"></div>
        `;
        c.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { activeTab = t.dataset.tab; render(); }));
        const content = c.querySelector('#tab-content');
        if (activeTab === 'entry') renderEntry(content);
        else if (activeTab === 'register') renderRegister(content);
        else renderReceivables(content);
    };

    const renderEntry = (el) => {
        const customers = db.data.customers;
        const products = db.data.products;
        const payAccounts = db.data.accounts.filter(a => a.accountKind === 'cash' || a.accountKind === 'bank' || a.accountKind === 'upi');
        const pendingOrders = db.data.customerOrders.filter(o => o.status === 'pending' || o.status === 'partial');

        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">New Sales Invoice (GST)</div></div>

            ${pendingOrders.length > 0 ? `
            <div class="form-group mb-4">
              <label class="form-label">Link to Order (Optional)</label>
              <select class="form-control" id="sal-order">
                <option value="">-- No Order --</option>
                ${pendingOrders.map(o => {
                  const cust = customers.find(cu => cu.id === o.customerId);
                  const remainingSummary = (o.items||[]).map(i => { const remaining = i.qty - (i.fulfilledQty||0); return remaining > 0 ? remaining : 0; }).reduce((a,b)=>a+b,0);
                  return `<option value="${o.id}" data-cust="${o.customerId}">${cust?.name || 'N/A'} — ${remainingSummary} pcs remaining — Due: ${o.dueDate || 'N/A'}</option>`;
                }).join('')}
              </select>
            </div>` : ''}

            <div class="grid-3 mb-4">
              <div class="form-group">
                <label class="form-label">Customer</label>
                <select class="form-control" id="sal-customer">
                  <option value="">-- Select Customer --</option>
                  ${customers.map(cu => `<option value="${cu.id}" data-state="${cu.stateCode}">${cu.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Invoice No</label>
                <input class="form-control" id="sal-invno" value="${db.nextInvoiceNo()}" readonly>
              </div>
              <div class="form-group">
                <label class="form-label">Date</label>
                <input type="date" class="form-control" id="sal-date" value="${formatDate()}">
              </div>
            </div>

            <div class="panel mb-4">
              <div class="panel-title"><i class="ph ph-list-bullets"></i> Invoice Items</div>
              <div id="sal-items"></div>
              <button class="btn btn-sm btn-secondary mt-4" id="btn-add-sal-item"><i class="ph ph-plus"></i> Add Item</button>
            </div>

            <div class="grid-3 mb-4">
              <div class="form-group">
                <label class="form-label">Payment Mode</label>
                <select class="form-control" id="sal-paymode">
                  <option value="credit">On Credit</option>
                  <option value="cash">Received Now</option>
                </select>
              </div>
              <div class="form-group" id="sal-acc-group" style="display:none">
                <label class="form-label">Receive Into Account</label>
                <select class="form-control" id="sal-account">
                  ${payAccounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                </select>
              </div>
              <div></div>
            </div>

            <div id="sal-summary" class="panel mb-4"></div>
            <div class="flex justify-end">
              <button class="btn btn-success" id="btn-save-sal"><i class="ph ph-floppy-disk"></i> Save & Generate Invoice</button>
            </div>
          </div>
        `;

        el.querySelector('#sal-paymode').addEventListener('change', e => {
            el.querySelector('#sal-acc-group').style.display = e.target.value === 'cash' ? '' : 'none';
        });

        // Order linking
        if (el.querySelector('#sal-order')) {
            el.querySelector('#sal-order').addEventListener('change', e => {
                const orderId = e.target.value;
                if (orderId) {
                    const order = db.data.customerOrders.find(o => o.id === orderId);
                    if (order) {
                        el.querySelector('#sal-customer').value = order.customerId;
                        // Pre-fill items from order — use REMAINING qty, not total
                        items = (order.items || []).map(oi => {
                            const prod = db.data.products.find(p => p.id === oi.productId);
                            const remainingQty = Math.max(0, oi.qty - (oi.fulfilledQty || 0));
                            return { productId: oi.productId, qty: remainingQty, rate: prod?.rate || 0, gstRate: prod?.gstRate || 18, hsnCode: prod?.hsnCode || '' };
                        }).filter(item => item.qty > 0);
                        if (items.length === 0) items = [{ productId: '', qty: '', rate: '', gstRate: 18, hsnCode: '' }];
                        renderItems();
                    }
                }
            });
        }

        const renderItems = () => {
            const container = el.querySelector('#sal-items');
            container.innerHTML = items.map((item, idx) => `
              <div class="inline-row">
                <select class="form-control sal-prod" data-idx="${idx}" style="flex:2">
                  <option value="">-- Product --</option>
                  ${products.map(p => `<option value="${p.id}" data-rate="${p.rate}" data-gst="${p.gstRate}" data-hsn="${p.hsnCode}" ${item.productId===p.id?'selected':''}>${p.name} (${p.unit})</option>`).join('')}
                </select>
                <input type="number" class="form-control sal-qty" data-idx="${idx}" placeholder="Qty" value="${item.qty}" style="width:80px">
                <input type="number" class="form-control sal-rate" data-idx="${idx}" placeholder="Rate" value="${item.rate}" style="width:90px">
                <input type="number" class="form-control sal-gst" data-idx="${idx}" placeholder="GST%" value="${item.gstRate}" style="width:70px">
                <span class="text-sm text-muted" style="min-width:90px;text-align:right">₹${fmt((item.qty||0)*(item.rate||0))}</span>
                <button class="btn btn-ghost btn-del-sal" data-idx="${idx}"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button>
              </div>
            `).join('');

            container.querySelectorAll('.sal-prod').forEach(s => s.addEventListener('change', e => {
                const idx = +e.target.dataset.idx;
                items[idx].productId = e.target.value;
                const opt = e.target.selectedOptions[0];
                if (opt) {
                    items[idx].rate = Number(opt.dataset.rate) || 0;
                    items[idx].gstRate = Number(opt.dataset.gst) || 18;
                    items[idx].hsnCode = opt.dataset.hsn || '';
                }
                renderItems();
            }));
            container.querySelectorAll('.sal-qty').forEach(s => s.addEventListener('input', e => { items[+e.target.dataset.idx].qty = +e.target.value; updateSummary(); }));
            container.querySelectorAll('.sal-rate').forEach(s => s.addEventListener('input', e => { items[+e.target.dataset.idx].rate = +e.target.value; updateSummary(); }));
            container.querySelectorAll('.sal-gst').forEach(s => s.addEventListener('input', e => { items[+e.target.dataset.idx].gstRate = +e.target.value; updateSummary(); }));
            container.querySelectorAll('.btn-del-sal').forEach(s => s.addEventListener('click', e => {
                items.splice(+e.currentTarget.dataset.idx, 1);
                if (items.length === 0) items = [{ productId: '', qty: '', rate: '', gstRate: 18, hsnCode: '' }];
                renderItems();
            }));
            updateSummary();
        };

        const updateSummary = () => {
            const custSel = el.querySelector('#sal-customer');
            const custOpt = custSel.selectedOptions[0];
            const custState = custOpt?.dataset?.state || '';
            const isInter = custState && custState !== db.data.companyInfo.stateCode;

            let sub = 0, gstTotal = 0;
            items.forEach(item => { const amt = (item.qty||0)*(item.rate||0); sub += amt; gstTotal += amt*((item.gstRate||0)/100); });

            el.querySelector('#sal-summary').innerHTML = `
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

        el.querySelector('#btn-add-sal-item').addEventListener('click', () => {
            items.push({ productId: '', qty: '', rate: '', gstRate: 18, hsnCode: '' });
            renderItems();
        });
        el.querySelector('#sal-customer').addEventListener('change', updateSummary);

        el.querySelector('#btn-save-sal').addEventListener('click', () => {
            const customerId = el.querySelector('#sal-customer').value;
            if (!customerId) { alert('Select a customer'); return; }
            const validItems = items.filter(i => i.productId && i.qty > 0 && i.rate > 0);
            if (validItems.length === 0) { alert('Add at least one valid item'); return; }

            const cust = db.data.customers.find(cu => cu.id === customerId);
            const orderId = el.querySelector('#sal-order')?.value || '';

            db.addSalesInvoice({
                customerId,
                customerName: cust?.name,
                customerStateCode: cust?.stateCode,
                invoiceNo: el.querySelector('#sal-invno').value,
                date: el.querySelector('#sal-date').value,
                items: validItems,
                paymentMode: el.querySelector('#sal-paymode').value,
                accountId: el.querySelector('#sal-account')?.value || '',
                orderId
            });

            alert('Sales Invoice Saved!');
            items = [{ productId: '', qty: '', rate: '', gstRate: 18, hsnCode: '' }];
            render();
        });

        renderItems();
    };

    const renderRegister = (el) => {
        const invoices = [...db.data.salesInvoices].reverse();
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Sales Register</div></div>
            <div class="table-responsive">
              <table class="table">
                <thead><tr><th>Date</th><th>Invoice #</th><th>Customer</th><th class="text-right">Subtotal</th><th class="text-right">GST</th><th class="text-right">Grand Total</th></tr></thead>
                <tbody>
                  ${invoices.map(inv => {
                    const cust = db.data.customers.find(cu => cu.id === inv.customerId);
                    return `<tr><td>${inv.date}</td><td>${inv.invoiceNo}</td><td>${cust?.name||'N/A'}</td>
                      <td class="text-right">₹${fmt(inv.subtotal)}</td>
                      <td class="text-right">₹${fmt(inv.cgst+inv.sgst+inv.igst)}</td>
                      <td class="text-right font-bold">₹${fmt(inv.grandTotal)}</td></tr>`;
                  }).join('')}
                  ${invoices.length===0?'<tr><td colspan="6" class="text-center text-muted">No sales yet</td></tr>':''}
                </tbody>
              </table>
            </div>
          </div>
        `;
    };

    const renderReceivables = (el) => {
        const recs = db.getOutstandingReceivables();
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Outstanding Receivables</div></div>
            <div class="table-responsive">
              <table class="table">
                <thead><tr><th>Customer</th><th class="text-right">Amount Outstanding</th></tr></thead>
                <tbody>
                  ${recs.map(r => `<tr><td>${r.party.name}</td><td class="text-right font-bold text-success">₹${fmt(r.amount)}</td></tr>`).join('')}
                  ${recs.length===0?'<tr><td colspan="2" class="text-center text-muted">No outstanding receivables</td></tr>':''}
                </tbody>
              </table>
            </div>
          </div>
        `;
    };

    render();
    return c;
}
