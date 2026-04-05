import { db, formatDate } from '../store/db.js';

export default function ChallansView() {
    const c = document.createElement('div');
    c.className = 'animate-fade-in';
    
    window.APP_STATE = window.APP_STATE || {};
    window.APP_STATE.challans = window.APP_STATE.challans || {
        activeTab: 'entry',
        items: [{ productId: '', qty: '' }],
        date: formatDate()
    };
    const state = window.APP_STATE.challans;

    c.addEventListener('click', e => {
        const t = e.target.closest('.tab');
        if (t && c.contains(t)) {
            state.activeTab = t.dataset.tab;
            render();
        }
    });

    const render = () => {
        c.innerHTML = `
          <div class="tabs">
            <div class="tab ${state.activeTab==='entry'?'active':''}" data-tab="entry">New Delivery Challan</div>
            <div class="tab ${state.activeTab==='history'?'active':''}" data-tab="history">History</div>
          </div>
          <div id="tab-content"></div>
        `;
        const content = c.querySelector('#tab-content');
        if (state.activeTab === 'entry') renderEntry(content);
        else renderHistory(content);
    };

    const renderEntry = (el) => {
        const products = db.data.products;
        const customers = db.data.customers;
        const stock = Object.fromEntries(db.getProductStock().map(s => [s.item.id, s.qty]));

        el.innerHTML = `
          <div class="card mb-4" style="border-left: 4px solid var(--accent-warning);">
            <div class="section-title">Material Dispatch (Stock Only)</div>
            <p class="text-sm text-muted mb-4">Delivery Challans mechanically deduct physical inventory stock without creating financial ledger entries.</p>
            <div class="grid-3 mb-4">
              <div class="form-group"><label class="form-label">Customer / Recipient</label>
                <select class="form-control" id="ch-customer">
                   <option value="">Select Customer...</option>
                   ${customers.map(cu => `<option value="${cu.id}">${cu.name}</option>`).join('')}
                </select></div>
              <div class="form-group"><label class="form-label">Date</label>
                <input type="date" class="form-control" id="ch-date" value="${state.date}"></div>
              <div class="form-group"><label class="form-label">Narration</label>
                <input type="text" class="form-control" id="ch-narr" placeholder="Transport details"></div>
            </div>
            <table class="table mb-4" id="items-table">
               <thead><tr><th>Product</th><th style="width:150px">Stock Available</th><th style="width:150px">Qty to Dispatch</th><th style="width:50px"></th></tr></thead>
               <tbody id="items-body"></tbody>
            </table>
            <button class="btn btn-sm btn-secondary mb-4" id="btn-add-row"><i class="ph ph-plus"></i> Add Row</button>
            <div class="flex justify-end gap-2 mt-4">
               <button class="btn btn-warning" id="btn-save-challan"><i class="ph ph-truck"></i> Generate Challan</button>
            </div>
          </div>
        `;

        const tbody = el.querySelector('#items-body');
        const renderRows = () => {
            tbody.innerHTML = state.items.map((it, idx) => `
               <tr>
                 <td><select class="form-control item-sel" data-idx="${idx}">
                    <option value="">Select Product...</option>
                    ${products.map(p => `<option value="${p.id}" ${p.id===it.productId?'selected':''}>${p.name}</option>`).join('')}
                 </select></td>
                 <td>${it.productId ? stock[it.productId] + ' 📦' : '-'}</td>
                 <td><input type="number" class="form-control item-qty" data-idx="${idx}" value="${it.qty||''}" placeholder="0"></td>
                 <td><button class="btn btn-sm btn-ghost del-row" data-idx="${idx}"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button></td>
               </tr>
            `).join('');

            tbody.querySelectorAll('.item-sel').forEach(s => s.addEventListener('change', e => {
                state.items[+e.target.dataset.idx].productId = e.target.value;
                renderRows();
            }));
            tbody.querySelectorAll('.item-qty').forEach(s => s.addEventListener('input', e => {
                state.items[+e.target.dataset.idx].qty = Number(e.target.value);
            }));
            tbody.querySelectorAll('.del-row').forEach(btn => btn.addEventListener('click', e => {
                state.items.splice(+e.currentTarget.dataset.idx, 1);
                if(state.items.length===0) state.items.push({productId:'', qty:''});
                renderRows();
            }));
        };
        renderRows();

        el.querySelector('#ch-date').addEventListener('change', e => state.date = e.target.value);
        el.querySelector('#btn-add-row').addEventListener('click', () => { state.items.push({productId:'', qty:''}); renderRows(); });

        el.querySelector('#btn-save-challan').addEventListener('click', () => {
            const customerId = el.querySelector('#ch-customer').value;
            if(!customerId) return alert('Select a customer');
            const valid = state.items.filter(i => i.productId && i.qty > 0);
            if(valid.length === 0) return alert('Add at least one valid product');

            try {
                // Pre-check stock
                const dec = valid.map(v => ({ itemId: v.productId, itemType: 'product', qty: v.qty }));
                db._validateStock(dec);
            } catch(e) {
                return alert(e.message);
            }

            db.addDeliveryChallan({
                customerId,
                date: state.date,
                items: valid,
                narration: el.querySelector('#ch-narr').value
            });
            alert('Delivery Challan Generated!');
            state.items = [{productId:'', qty:''}];
            state.activeTab = 'history';
            render();
        });
    };

    const renderHistory = (el) => {
        const challans = [...db.data.deliveryChallans].reverse();
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Challan History</div></div>
            <div class="table-responsive">
               <table class="table">
                 <thead><tr><th>Date</th><th>Challan No</th><th>Customer</th><th>Items</th><th>Actions</th></tr></thead>
                 <tbody>
                   ${challans.map(ch => {
                      const cu = db.data.customers.find(c => c.id === ch.customerId);
                      return `<tr>
                         <td>${ch.date}</td>
                         <td class="font-bold">${ch.challanNo}</td>
                         <td>${cu?.name||'Unknown'}</td>
                         <td>${ch.items.length} types</td>
                         <td>
                            <button class="btn btn-sm btn-ghost del-ch" data-id="${ch.id}" title="Delete Challan (Restores Stock)"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button>
                         </td>
                      </tr>`;
                   }).join('')}
                   ${challans.length===0?'<tr><td colspan="5" class="text-center text-muted">No Challans yet</td></tr>':''}
                 </tbody>
               </table>
            </div>
          </div>
        `;
        el.querySelectorAll('.del-ch').forEach(btn => btn.addEventListener('click', e => {
            if(confirm('Delete Challan? Physical stock will be instantly restored.')) {
                db.deleteDeliveryChallan(e.currentTarget.dataset.id);
                render();
            }
        }));
    };

    window.addEventListener('view-activated', (e) => {
        if(e.detail.route === 'challan') render();
    });

    render();
    c.render = render;
    return c;
}
