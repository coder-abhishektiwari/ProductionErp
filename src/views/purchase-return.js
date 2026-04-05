import { db, formatDate, fmt } from '../store/db.js';
import { printDocument } from '../utils/print.js';

export default function PurchaseReturnView() {
    const c = document.createElement('div');
    c.className = 'animate-fade-in';
    let activeTab = 'entry';
    let items = [{ chemicalId: '', qty: '', rate: '', gstRate: 18 }];

    const render = () => {
        c.innerHTML = `
          <div class="tabs">
            <div class="tab ${activeTab==='entry'?'active':''}" data-tab="entry">New Debit Note</div>
            <div class="tab ${activeTab==='register'?'active':''}" data-tab="register">Debit Note Register</div>
          </div>
          <div id="tab-content"></div>
        `;
        c.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { activeTab = t.dataset.tab; render(); }));
        const content = c.querySelector('#tab-content');
        if (activeTab === 'entry') renderEntry(content);
        else renderRegister(content);
    };

    const renderEntry = (el) => {
        const suppliers = db.data.suppliers;
        const chemicals = db.data.chemicals;
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Purchase Return (Debit Note)</div></div>
            <div class="grid-3 mb-4">
              <div class="form-group"><label class="form-label">Supplier</label>
                <select class="form-control" id="pr-supplier"><option value="">-- Select --</option>
                ${suppliers.map(s => `<option value="${s.id}" data-state="${s.stateCode}">${s.name}</option>`).join('')}</select></div>
              <div class="form-group"><label class="form-label">Original Invoice No</label>
                <input class="form-control" id="pr-orig-inv" placeholder="Supplier invoice being returned"></div>
              <div class="form-group"><label class="form-label">Date</label>
                <input type="date" class="form-control" id="pr-date" value="${formatDate()}"></div>
            </div>

            <div class="form-group mb-4"><label class="form-label">Reason for Return</label>
              <input class="form-control" id="pr-reason" placeholder="E.g., Material defective / wrong chemical / excess qty received"></div>

            <div class="panel mb-4">
              <div class="panel-title"><i class="ph ph-arrow-u-up-left"></i> Items Being Returned</div>
              <div id="pr-items"></div>
              <button class="btn btn-sm btn-secondary mt-4" id="btn-add-pr-item"><i class="ph ph-plus"></i> Add Item</button>
            </div>

            <div id="pr-summary" class="panel mb-4"></div>

            <div class="flex justify-end">
              <button class="btn btn-danger" id="btn-save-pr"><i class="ph ph-arrow-u-up-left"></i> Save Debit Note</button>
            </div>
          </div>
        `;

        const renderItems = () => {
            const container = el.querySelector('#pr-items');
            container.innerHTML = items.map((item, idx) => `
              <div class="inline-row">
                <select class="form-control pr-chem" data-idx="${idx}" style="flex:2">
                  <option value="">-- Chemical --</option>
                  ${chemicals.map(ch => `<option value="${ch.id}" data-gst="${ch.gstRate}" ${item.chemicalId===ch.id?'selected':''}>${ch.name} (${ch.unit})</option>`).join('')}
                </select>
                <input type="number" class="form-control pr-qty" data-idx="${idx}" placeholder="Qty" value="${item.qty}" style="width:90px">
                <input type="number" class="form-control pr-rate" data-idx="${idx}" placeholder="Rate" value="${item.rate}" style="width:90px">
                <input type="number" class="form-control pr-gst" data-idx="${idx}" placeholder="GST%" value="${item.gstRate}" style="width:70px">
                <span class="text-sm text-muted" style="min-width:80px;text-align:right">₹${fmt((item.qty||0)*(item.rate||0))}</span>
                <button class="btn btn-ghost pr-del" data-idx="${idx}"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button>
              </div>
            `).join('');

            container.querySelectorAll('.pr-chem').forEach(s => s.addEventListener('change', e => {
                const idx = +e.target.dataset.idx; items[idx].chemicalId = e.target.value;
                const opt = e.target.selectedOptions[0]; if(opt) items[idx].gstRate = Number(opt.dataset.gst)||18; renderItems();
            }));
            container.querySelectorAll('.pr-qty').forEach(s => s.addEventListener('input', e => { items[+e.target.dataset.idx].qty = +e.target.value; updateSummary(); }));
            container.querySelectorAll('.pr-rate').forEach(s => s.addEventListener('input', e => { items[+e.target.dataset.idx].rate = +e.target.value; updateSummary(); }));
            container.querySelectorAll('.pr-gst').forEach(s => s.addEventListener('input', e => { items[+e.target.dataset.idx].gstRate = +e.target.value; updateSummary(); }));
            container.querySelectorAll('.pr-del').forEach(s => s.addEventListener('click', e => {
                items.splice(+e.currentTarget.dataset.idx, 1);
                if(!items.length) items.push({ chemicalId: '', qty: '', rate: '', gstRate: 18 }); renderItems();
            }));
            updateSummary();
        };

        const updateSummary = () => {
            const supOpt = el.querySelector('#pr-supplier').selectedOptions[0];
            const isInter = supOpt?.dataset?.state && supOpt.dataset.state !== db.data.companyInfo.stateCode;
            let sub = 0, gst = 0;
            items.forEach(i => { const amt = (i.qty||0)*(i.rate||0); sub += amt; gst += amt*((i.gstRate||0)/100); });
            el.querySelector('#pr-summary').innerHTML = `
              <div class="flex justify-between mb-2"><span>Subtotal</span><span class="font-bold">₹${fmt(sub)}</span></div>
              ${isInter ? `<div class="flex justify-between mb-2"><span>IGST (reversal)</span><span>₹${fmt(gst)}</span></div>` :
                `<div class="flex justify-between mb-2"><span>CGST (reversal)</span><span>₹${fmt(gst/2)}</span></div>
                 <div class="flex justify-between mb-2"><span>SGST (reversal)</span><span>₹${fmt(gst/2)}</span></div>`}
              <hr class="divider"><div class="flex justify-between"><span class="font-bold">Debit Note Total</span><span class="font-bold text-danger" style="font-size:1.1rem">₹${fmt(sub+gst)}</span></div>
            `;
        };

        el.querySelector('#btn-add-pr-item').addEventListener('click', () => { items.push({ chemicalId: '', qty: '', rate: '', gstRate: 18 }); renderItems(); });
        el.querySelector('#pr-supplier').addEventListener('change', updateSummary);
        el.querySelector('#btn-save-pr').addEventListener('click', () => {
            const supplierId = el.querySelector('#pr-supplier').value;
            if(!supplierId) { alert('Select supplier'); return; }
            const valid = items.filter(i => i.chemicalId && i.qty > 0 && i.rate > 0);
            if(!valid.length) { alert('Add at least one item'); return; }
            const sup = db.data.suppliers.find(s => s.id === supplierId);
            db.addPurchaseReturn({
                supplierId, supplierName: sup?.name, supplierStateCode: sup?.stateCode,
                originalInvoiceNo: el.querySelector('#pr-orig-inv').value,
                date: el.querySelector('#pr-date').value, items: valid,
                reason: el.querySelector('#pr-reason').value
            });
            alert('Debit Note Saved!'); items = [{ chemicalId: '', qty: '', rate: '', gstRate: 18 }]; render();
        });
        renderItems();
    };

    const renderRegister = (el) => {
        const returns = [...db.data.purchaseReturns].reverse();
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Debit Note Register (${returns.length})</div></div>
            <div class="table-responsive"><table class="table">
              <thead><tr><th>Date</th><th>DN#</th><th>Supplier</th><th>Original Inv</th><th>Reason</th><th class="text-right">Amount</th><th>Action</th></tr></thead>
              <tbody>
                ${returns.map(r => {
                  const sup = db.data.suppliers.find(s => s.id === r.supplierId);
                  return `<tr><td>${r.date}</td><td class="font-medium">${r.debitNoteNo}</td><td>${sup?.name||'N/A'}</td>
                    <td class="text-sm">${r.originalInvoiceNo||'-'}</td><td class="text-sm text-muted">${r.reason||'-'}</td>
                    <td class="text-right font-bold text-danger">₹${fmt(r.grandTotal)}</td>
                    <td>
                      <button class="btn btn-sm btn-ghost btn-print" data-id="${r.id}"><i class="ph ph-printer" style="color:var(--accent-primary)"></i></button>
                      <button class="btn btn-sm btn-ghost del-pr" data-id="${r.id}"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button>
                    </td></tr>`;
                }).join('')}
                ${!returns.length ? '<tr><td colspan="7" class="text-center text-muted">No purchase returns yet</td></tr>' : ''}
              </tbody>
            </table></div>
          </div>
        `;
        el.querySelectorAll('.btn-print').forEach(btn => btn.addEventListener('click', e => {
            printDocument('debit_note', e.currentTarget.dataset.id);
        }));
        el.querySelectorAll('.del-pr').forEach(btn => btn.addEventListener('click', e => {
            if(confirm('Delete this debit note?')) { db.deletePurchaseReturn(e.currentTarget.dataset.id); render(); }
        }));
    };

    render(); return c;
}
