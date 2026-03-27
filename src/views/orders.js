import { db, formatDate } from '../store/db.js';

export default function OrdersView() {
    const c = document.createElement('div');
    c.className = 'animate-fade-in';
    let activeTab = 'new';
    let orderItems = [{ productId: '', qty: '', description: '' }];

    const render = () => {
        c.innerHTML = `
          <div class="tabs">
            <div class="tab ${activeTab==='new'?'active':''}" data-tab="new">New Order</div>
            <div class="tab ${activeTab==='pending'?'active':''}" data-tab="pending">Pending Orders</div>
            <div class="tab ${activeTab==='fulfilled'?'active':''}" data-tab="fulfilled">Fulfilled Orders</div>
          </div>
          <div id="tab-content"></div>
        `;
        c.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { activeTab = t.dataset.tab; render(); }));
        const content = c.querySelector('#tab-content');
        if (activeTab === 'new') renderNew(content);
        else if (activeTab === 'pending') renderList(content, 'pending');
        else renderList(content, 'fulfilled');
    };

    const renderNew = (el) => {
        const customers = db.data.customers;
        const products = db.data.products;
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">New Customer Order</div></div>
            <div class="grid-3 mb-4">
              <div class="form-group"><label class="form-label">Customer</label>
                <select class="form-control" id="ord-cust"><option value="">-- Select --</option>${customers.map(cu => `<option value="${cu.id}">${cu.name}</option>`).join('')}</select></div>
              <div class="form-group"><label class="form-label">Order Date</label>
                <input type="date" class="form-control" id="ord-date" value="${formatDate()}"></div>
              <div class="form-group"><label class="form-label">Due Date</label>
                <input type="date" class="form-control" id="ord-due"></div>
            </div>
            <div class="panel mb-4">
              <div class="panel-title"><i class="ph ph-list-bullets"></i> Order Items</div>
              <div id="ord-items"></div>
              <button class="btn btn-sm btn-secondary mt-4" id="btn-add-ord-item"><i class="ph ph-plus"></i> Add Item</button>
            </div>
            <div class="flex justify-end">
              <button class="btn btn-primary" id="btn-save-ord"><i class="ph ph-floppy-disk"></i> Save Order</button>
            </div>
          </div>
        `;

        const renderItems = () => {
            const container = el.querySelector('#ord-items');
            container.innerHTML = orderItems.map((item, idx) => `
              <div class="inline-row">
                <select class="form-control ord-prod" data-idx="${idx}" style="flex:1">
                  <option value="">-- Product --</option>
                  ${products.map(p => `<option value="${p.id}" ${item.productId===p.id?'selected':''}>${p.name}</option>`).join('')}
                </select>
                <input type="number" class="form-control ord-qty" data-idx="${idx}" placeholder="Qty" value="${item.qty}" style="width:80px">
                <input class="form-control ord-desc" data-idx="${idx}" placeholder="Customer description / sample ref" value="${item.description}" style="flex:1">
                <button class="btn btn-ghost ord-del" data-idx="${idx}"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button>
              </div>
            `).join('');
            container.querySelectorAll('.ord-prod').forEach(s => s.addEventListener('change', e => { orderItems[+e.target.dataset.idx].productId = e.target.value; }));
            container.querySelectorAll('.ord-qty').forEach(s => s.addEventListener('input', e => { orderItems[+e.target.dataset.idx].qty = +e.target.value; }));
            container.querySelectorAll('.ord-desc').forEach(s => s.addEventListener('input', e => { orderItems[+e.target.dataset.idx].description = e.target.value; }));
            container.querySelectorAll('.ord-del').forEach(s => s.addEventListener('click', e => {
                orderItems.splice(+e.currentTarget.dataset.idx, 1);
                if (orderItems.length === 0) orderItems.push({ productId: '', qty: '', description: '' });
                renderItems();
            }));
        };

        el.querySelector('#btn-add-ord-item').addEventListener('click', () => { orderItems.push({ productId: '', qty: '', description: '' }); renderItems(); });

        el.querySelector('#btn-save-ord').addEventListener('click', () => {
            const customerId = el.querySelector('#ord-cust').value;
            if (!customerId) { alert('Select a customer'); return; }
            const validItems = orderItems.filter(i => i.productId && i.qty > 0);
            if (validItems.length === 0) { alert('Add at least one item'); return; }
            db.addCustomerOrder({
                customerId,
                date: el.querySelector('#ord-date').value,
                dueDate: el.querySelector('#ord-due').value,
                items: validItems
            });
            alert('Order Saved!');
            orderItems = [{ productId: '', qty: '', description: '' }];
            render();
        });
        renderItems();
    };

    const renderList = (el, status) => {
        // 'pending' tab shows both pending and partial
        const orders = db.data.customerOrders.filter(o =>
            status === 'pending' ? (o.status === 'pending' || o.status === 'partial') : o.status === status
        );
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">${status === 'pending' ? 'Pending & Partial' : 'Fulfilled'} Orders (${orders.length})</div></div>
            ${orders.length === 0 ? `<p class="text-muted">No ${status} orders</p>` :
              orders.map(o => {
                const cust = db.data.customers.find(cu => cu.id === o.customerId);
                return `<div class="panel mb-4">
                  <div class="flex justify-between items-center mb-2">
                    <div><span class="font-bold">${cust?.name || 'N/A'}</span> <span class="text-sm text-muted">Order: ${o.date}</span></div>
                    <div class="flex items-center" style="gap:0.5rem">
                      <span class="badge badge-${o.status==='fulfilled'?'success':o.status==='partial'?'info':'warning'}">${o.status}</span>
                      <button class="btn btn-sm btn-ghost del-order" data-id="${o.id}"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button>
                    </div>
                  </div>
                  <div class="text-sm text-muted mb-2">Due: ${o.dueDate || 'N/A'}</div>
                  <table class="table"><thead><tr><th>Product</th><th class="text-right">Ordered</th><th class="text-right">Fulfilled</th><th class="text-right">Remaining</th><th>Progress</th></tr></thead>
                  <tbody>${(o.items||[]).map(i => {
                    const prod = db.data.products.find(p => p.id === i.productId);
                    const fulfilled = i.fulfilledQty || 0;
                    const remaining = Math.max(0, i.qty - fulfilled);
                    const pct = i.qty > 0 ? Math.min(100, Math.round((fulfilled / i.qty) * 100)) : 0;
                    return `<tr>
                      <td>${prod?.name || i.productId} <div class="text-xs text-muted">${i.description || ''}</div></td>
                      <td class="text-right font-medium">${i.qty}</td>
                      <td class="text-right ${fulfilled > 0 ? 'text-success font-bold' : ''}">${fulfilled}</td>
                      <td class="text-right ${remaining > 0 ? 'text-warning font-bold' : 'text-success'}">${remaining}</td>
                      <td style="width:120px">
                        <div style="background:var(--bg-secondary);border-radius:4px;height:8px;overflow:hidden">
                          <div style="width:${pct}%;height:100%;background:${pct>=100?'var(--accent-success)':'var(--accent-info)'};border-radius:4px;transition:width 0.3s"></div>
                        </div>
                        <div class="text-xs text-center text-muted">${pct}%</div>
                      </td>
                    </tr>`;
                  }).join('')}</tbody></table>
                </div>`;
              }).join('')}
          </div>
        `;
        el.querySelectorAll('.del-order').forEach(btn => btn.addEventListener('click', e => {
            if(confirm('Delete this order?')) { db.deleteCustomerOrder(e.currentTarget.dataset.id); render(); }
        }));
    };

    render();
    return c;
}
