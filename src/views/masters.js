import { db } from '../store/db.js';

export default function MastersView() {
    const c = document.createElement('div');
    c.className = 'animate-fade-in';
    let activeTab = 'chemicals';
    let editingItem = null; // { type, id, data }

    const render = () => {
        c.innerHTML = `
          <div class="tabs">
            <div class="tab ${activeTab==='chemicals'?'active':''}" data-tab="chemicals">Chemicals</div>
            <div class="tab ${activeTab==='products'?'active':''}" data-tab="products">Products</div>
            <div class="tab ${activeTab==='customers'?'active':''}" data-tab="customers">Customers</div>
            <div class="tab ${activeTab==='suppliers'?'active':''}" data-tab="suppliers">Suppliers</div>
            <div class="tab ${activeTab==='company'?'active':''}" data-tab="company">Company Info</div>
          </div>
          <div id="tab-content"></div>
        `;
        c.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { activeTab = t.dataset.tab; editingItem = null; render(); }));
        const content = c.querySelector('#tab-content');
        if (activeTab === 'chemicals') renderChemicals(content);
        else if (activeTab === 'products') renderProducts(content);
        else if (activeTab === 'customers') renderCustomers(content);
        else if (activeTab === 'suppliers') renderSuppliers(content);
        else renderCompany(content);
    };

    // ── Chemicals ────
    const renderChemicals = (el) => {
        const isEdit = editingItem && editingItem.type === 'chemical';
        const ed = isEdit ? editingItem.data : {};
        el.innerHTML = `
          <div class="grid-2">
            <div class="card">
              <div class="section-header"><div class="section-title">${isEdit ? '✏️ Edit' : 'Add'} Chemical / Raw Material</div>
              ${isEdit ? `<button class="btn btn-sm btn-secondary" id="btn-cancel-edit">Cancel</button>` : ''}</div>
              <div class="form-group"><label class="form-label">Chemical Name</label><input class="form-control" id="ch-name" value="${ed.name||''}" placeholder="E.g., Carbon Black N330"></div>
              <div class="grid-2">
                <div class="form-group"><label class="form-label">Unit</label><input class="form-control" id="ch-unit" value="${ed.unit||'Kg'}" placeholder="Kg"></div>
                <div class="form-group"><label class="form-label">HSN Code</label><input class="form-control" id="ch-hsn" value="${ed.hsnCode||''}" placeholder="28030010"></div>
              </div>
              <div class="grid-2">
                <div class="form-group"><label class="form-label">GST Rate (%)</label><input type="number" class="form-control" id="ch-gst" value="${ed.gstRate ?? 18}"></div>
                <div class="form-group"><label class="form-label">Min Stock Alert</label><input type="number" class="form-control" id="ch-min" value="${ed.minStock||''}" placeholder="100"></div>
              </div>
              <div class="flex justify-end gap-2">
                <button class="btn btn-primary" id="btn-save-ch"><i class="ph ph-floppy-disk"></i> ${isEdit ? 'Update' : 'Save'} Chemical</button>
              </div>
            </div>
            <div class="card">
              <div class="section-header"><div class="section-title">Existing Chemicals (${db.data.chemicals.length})</div></div>
              <div style="max-height:350px;overflow-y:auto">
                <table class="table">
                  <thead><tr><th>Name</th><th>Unit</th><th>HSN</th><th>GST%</th><th>Min</th><th>Actions</th></tr></thead>
                  <tbody>
                  ${db.data.chemicals.map(ch => `<tr>
                    <td class="font-medium">${ch.name}</td><td>${ch.unit}</td>
                    <td class="text-sm text-muted">${ch.hsnCode || '-'}</td>
                    <td>${ch.gstRate}%</td><td>${ch.minStock || '-'}</td>
                    <td>
                      <button class="btn btn-sm btn-ghost edit-ch" data-id="${ch.id}" title="Edit"><i class="ph ph-pencil-simple" style="color:var(--accent-info)"></i></button>
                      <button class="btn btn-sm btn-ghost del-ch" data-id="${ch.id}" title="Delete"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button>
                    </td>
                  </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
        el.querySelector('#btn-save-ch').addEventListener('click', () => {
            const name = el.querySelector('#ch-name').value.trim();
            if (!name) { alert('Enter name'); return; }
            const data = { name, unit: el.querySelector('#ch-unit').value||'Kg', hsnCode: el.querySelector('#ch-hsn').value, gstRate: Number(el.querySelector('#ch-gst').value)||18, minStock: Number(el.querySelector('#ch-min').value)||0 };
            if (isEdit) { db.updateChemical(editingItem.id, data); editingItem = null; }
            else { db.addChemical(data); }
            render();
        });
        el.querySelectorAll('.edit-ch').forEach(btn => btn.addEventListener('click', e => {
            const ch = db.data.chemicals.find(c => c.id === e.currentTarget.dataset.id);
            if(ch) { editingItem = { type: 'chemical', id: ch.id, data: {...ch} }; render(); }
        }));
        el.querySelectorAll('.del-ch').forEach(btn => btn.addEventListener('click', e => {
            if(confirm('Delete this chemical?')) { db.deleteChemical(e.currentTarget.dataset.id); render(); }
        }));
        if(el.querySelector('#btn-cancel-edit')) el.querySelector('#btn-cancel-edit').addEventListener('click', () => { editingItem = null; render(); });
    };

    // ── Products ─────
    const renderProducts = (el) => {
        const isEdit = editingItem && editingItem.type === 'product';
        const ed = isEdit ? editingItem.data : {};
        el.innerHTML = `
          <div class="grid-2">
            <div class="card">
              <div class="section-header"><div class="section-title">${isEdit ? '✏️ Edit' : 'Add'} Rubber Product</div>
              ${isEdit ? `<button class="btn btn-sm btn-secondary" id="btn-cancel-edit">Cancel</button>` : ''}</div>
              <div class="form-group"><label class="form-label">Product Name</label><input class="form-control" id="pr-name" value="${ed.name||''}" placeholder="E.g., Silicon O-Ring 25mm"></div>
              <div class="grid-2">
                <div class="form-group"><label class="form-label">Product Type</label>
                  <select class="form-control" id="pr-type"><option value="silicon" ${ed.productType==='silicon'?'selected':''}>Silicon</option><option value="non-silicon" ${ed.productType==='non-silicon'?'selected':''}>Non-Silicon</option></select></div>
                <div class="form-group"><label class="form-label">Unit</label><input class="form-control" id="pr-unit" value="${ed.unit||'Pcs'}" placeholder="Pcs"></div>
              </div>
              <div class="grid-3">
                <div class="form-group"><label class="form-label">HSN Code</label><input class="form-control" id="pr-hsn" value="${ed.hsnCode||''}" placeholder="40169320"></div>
                <div class="form-group"><label class="form-label">GST Rate (%)</label><input type="number" class="form-control" id="pr-gst" value="${ed.gstRate ?? 18}"></div>
                <div class="form-group"><label class="form-label">Std Rate (₹)</label><input type="number" class="form-control" id="pr-rate" value="${ed.rate||''}" placeholder="0"></div>
              </div>
              <div class="flex justify-end gap-2">
                <button class="btn btn-primary" id="btn-save-pr"><i class="ph ph-floppy-disk"></i> ${isEdit ? 'Update' : 'Save'} Product</button>
              </div>
            </div>
            <div class="card">
              <div class="section-header"><div class="section-title">Existing Products (${db.data.products.length})</div></div>
              <div style="max-height:350px;overflow-y:auto">
                <table class="table">
                  <thead><tr><th>Name</th><th>Type</th><th>HSN</th><th>Rate</th><th>Actions</th></tr></thead>
                  <tbody>
                  ${db.data.products.map(p => `<tr>
                    <td class="font-medium">${p.name}</td>
                    <td><span class="badge badge-${p.productType==='silicon'?'info':'warning'}">${p.productType}</span></td>
                    <td class="text-sm">${p.hsnCode || '-'}</td>
                    <td>₹${p.rate}/${p.unit}</td>
                    <td>
                      <button class="btn btn-sm btn-ghost edit-pr" data-id="${p.id}"><i class="ph ph-pencil-simple" style="color:var(--accent-info)"></i></button>
                      <button class="btn btn-sm btn-ghost del-pr" data-id="${p.id}"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button>
                    </td>
                  </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
        el.querySelector('#btn-save-pr').addEventListener('click', () => {
            const name = el.querySelector('#pr-name').value.trim();
            if (!name) { alert('Enter name'); return; }
            const data = { name, productType: el.querySelector('#pr-type').value, unit: el.querySelector('#pr-unit').value||'Pcs', hsnCode: el.querySelector('#pr-hsn').value, gstRate: Number(el.querySelector('#pr-gst').value)||18, rate: Number(el.querySelector('#pr-rate').value)||0 };
            if (isEdit) { db.updateProduct(editingItem.id, data); editingItem = null; }
            else { db.addProduct(data); }
            render();
        });
        el.querySelectorAll('.edit-pr').forEach(btn => btn.addEventListener('click', e => {
            const p = db.data.products.find(p => p.id === e.currentTarget.dataset.id);
            if(p) { editingItem = { type: 'product', id: p.id, data: {...p} }; render(); }
        }));
        el.querySelectorAll('.del-pr').forEach(btn => btn.addEventListener('click', e => {
            if(confirm('Delete this product?')) { db.deleteProduct(e.currentTarget.dataset.id); render(); }
        }));
        if(el.querySelector('#btn-cancel-edit')) el.querySelector('#btn-cancel-edit').addEventListener('click', () => { editingItem = null; render(); });
    };

    // ── Customers ────
    const renderCustomers = (el) => {
        const isEdit = editingItem && editingItem.type === 'customer';
        const ed = isEdit ? editingItem.data : {};
        el.innerHTML = `
          <div class="grid-2">
            <div class="card">
              <div class="section-header"><div class="section-title">${isEdit ? '✏️ Edit' : 'Add'} Customer</div>
              ${isEdit ? `<button class="btn btn-sm btn-secondary" id="btn-cancel-edit">Cancel</button>` : ''}</div>
              <div class="form-group"><label class="form-label">Customer Name</label><input class="form-control" id="cu-name" value="${ed.name||''}" placeholder="E.g., Mahindra Auto Parts"></div>
              <div class="form-group"><label class="form-label">Address</label><input class="form-control" id="cu-addr" value="${ed.address||''}" placeholder="City, State"></div>
              <div class="grid-2">
                <div class="form-group"><label class="form-label">GSTIN</label><input class="form-control" id="cu-gstin" value="${ed.gstin||''}" placeholder="27AABCM1234F1Z5"></div>
                <div class="form-group"><label class="form-label">State Code</label><input class="form-control" id="cu-state" value="${ed.stateCode||'27'}" placeholder="27"></div>
              </div>
              <div class="grid-2">
                <div class="form-group"><label class="form-label">Contact</label><input class="form-control" id="cu-contact" value="${ed.contact||''}" placeholder="Phone"></div>
                <div class="form-group"><label class="form-label">Credit Days</label><input type="number" class="form-control" id="cu-credit" value="${ed.creditDays ?? 30}"></div>
              </div>
              <div class="flex justify-end gap-2">
                <button class="btn btn-primary" id="btn-save-cu"><i class="ph ph-floppy-disk"></i> ${isEdit ? 'Update' : 'Save'} Customer</button>
              </div>
            </div>
            <div class="card">
              <div class="section-header"><div class="section-title">Existing Customers (${db.data.customers.length})</div></div>
              <div style="max-height:350px;overflow-y:auto">
                <table class="table">
                  <thead><tr><th>Name</th><th>GSTIN</th><th>Contact</th><th>Credit</th><th>Actions</th></tr></thead>
                  <tbody>
                  ${db.data.customers.map(cu => `<tr>
                    <td><div class="font-medium">${cu.name}</div><div class="text-xs text-muted">${cu.address||''}</div></td>
                    <td class="text-xs">${cu.gstin || '-'}</td>
                    <td>${cu.contact || '-'}</td>
                    <td>${cu.creditDays || 30}d</td>
                    <td>
                      <button class="btn btn-sm btn-ghost edit-cu" data-id="${cu.id}"><i class="ph ph-pencil-simple" style="color:var(--accent-info)"></i></button>
                      <button class="btn btn-sm btn-ghost del-cu" data-id="${cu.id}"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button>
                    </td>
                  </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
        el.querySelector('#btn-save-cu').addEventListener('click', () => {
            const name = el.querySelector('#cu-name').value.trim();
            if (!name) { alert('Enter name'); return; }
            const data = { name, address: el.querySelector('#cu-addr').value, gstin: el.querySelector('#cu-gstin').value, stateCode: el.querySelector('#cu-state').value||'27', contact: el.querySelector('#cu-contact').value, creditDays: Number(el.querySelector('#cu-credit').value)||30 };
            if (isEdit) { db.updateCustomer(editingItem.id, data); editingItem = null; }
            else { db.addCustomer(data); }
            render();
        });
        el.querySelectorAll('.edit-cu').forEach(btn => btn.addEventListener('click', e => {
            const cu = db.data.customers.find(c => c.id === e.currentTarget.dataset.id);
            if(cu) { editingItem = { type: 'customer', id: cu.id, data: {...cu} }; render(); }
        }));
        el.querySelectorAll('.del-cu').forEach(btn => btn.addEventListener('click', e => {
            if(confirm('Delete this customer? This will NOT delete existing transactions.')) { db.deleteCustomer(e.currentTarget.dataset.id); render(); }
        }));
        if(el.querySelector('#btn-cancel-edit')) el.querySelector('#btn-cancel-edit').addEventListener('click', () => { editingItem = null; render(); });
    };

    // ── Suppliers ─────
    const renderSuppliers = (el) => {
        const isEdit = editingItem && editingItem.type === 'supplier';
        const ed = isEdit ? editingItem.data : {};
        el.innerHTML = `
          <div class="grid-2">
            <div class="card">
              <div class="section-header"><div class="section-title">${isEdit ? '✏️ Edit' : 'Add'} Supplier</div>
              ${isEdit ? `<button class="btn btn-sm btn-secondary" id="btn-cancel-edit">Cancel</button>` : ''}</div>
              <div class="form-group"><label class="form-label">Supplier Name</label><input class="form-control" id="su-name" value="${ed.name||''}" placeholder="E.g., National Chemicals"></div>
              <div class="form-group"><label class="form-label">Address</label><input class="form-control" id="su-addr" value="${ed.address||''}" placeholder="City, State"></div>
              <div class="grid-2">
                <div class="form-group"><label class="form-label">GSTIN</label><input class="form-control" id="su-gstin" value="${ed.gstin||''}" placeholder="07AABCN1234H1Z9"></div>
                <div class="form-group"><label class="form-label">State Code</label><input class="form-control" id="su-state" value="${ed.stateCode||''}" placeholder="07"></div>
              </div>
              <div class="form-group"><label class="form-label">Contact</label><input class="form-control" id="su-contact" value="${ed.contact||''}" placeholder="Phone"></div>
              <div class="flex justify-end gap-2">
                <button class="btn btn-primary" id="btn-save-su"><i class="ph ph-floppy-disk"></i> ${isEdit ? 'Update' : 'Save'} Supplier</button>
              </div>
            </div>
            <div class="card">
              <div class="section-header"><div class="section-title">Existing Suppliers (${db.data.suppliers.length})</div></div>
              <div style="max-height:350px;overflow-y:auto">
                <table class="table">
                  <thead><tr><th>Name</th><th>GSTIN</th><th>State</th><th>Contact</th><th>Actions</th></tr></thead>
                  <tbody>
                  ${db.data.suppliers.map(su => `<tr>
                    <td><div class="font-medium">${su.name}</div><div class="text-xs text-muted">${su.address||''}</div></td>
                    <td class="text-xs">${su.gstin || '-'}</td>
                    <td>${su.stateCode || '-'}</td>
                    <td>${su.contact || '-'}</td>
                    <td>
                      <button class="btn btn-sm btn-ghost edit-su" data-id="${su.id}"><i class="ph ph-pencil-simple" style="color:var(--accent-info)"></i></button>
                      <button class="btn btn-sm btn-ghost del-su" data-id="${su.id}"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button>
                    </td>
                  </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
        el.querySelector('#btn-save-su').addEventListener('click', () => {
            const name = el.querySelector('#su-name').value.trim();
            if (!name) { alert('Enter name'); return; }
            const data = { name, address: el.querySelector('#su-addr').value, gstin: el.querySelector('#su-gstin').value, stateCode: el.querySelector('#su-state').value||'', contact: el.querySelector('#su-contact').value };
            if (isEdit) { db.updateSupplier(editingItem.id, data); editingItem = null; }
            else { db.addSupplier(data); }
            render();
        });
        el.querySelectorAll('.edit-su').forEach(btn => btn.addEventListener('click', e => {
            const su = db.data.suppliers.find(s => s.id === e.currentTarget.dataset.id);
            if(su) { editingItem = { type: 'supplier', id: su.id, data: {...su} }; render(); }
        }));
        el.querySelectorAll('.del-su').forEach(btn => btn.addEventListener('click', e => {
            if(confirm('Delete this supplier?')) { db.deleteSupplier(e.currentTarget.dataset.id); render(); }
        }));
        if(el.querySelector('#btn-cancel-edit')) el.querySelector('#btn-cancel-edit').addEventListener('click', () => { editingItem = null; render(); });
    };

    // ── Company Info ──
    const renderCompany = (el) => {
        const info = db.data.companyInfo;
        el.innerHTML = `
          <div class="card" style="max-width:600px">
            <div class="section-header"><div class="section-title">Company Information</div></div>
            <div class="form-group"><label class="form-label">Company Name</label><input class="form-control" id="ci-name" value="${info.name}"></div>
            <div class="form-group"><label class="form-label">Address</label><input class="form-control" id="ci-addr" value="${info.address}"></div>
            <div class="grid-2">
              <div class="form-group"><label class="form-label">GSTIN</label><input class="form-control" id="ci-gstin" value="${info.gstin}"></div>
              <div class="form-group"><label class="form-label">State Code</label><input class="form-control" id="ci-state" value="${info.stateCode}"></div>
            </div>
            <div class="grid-2">
              <div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="ci-phone" value="${info.phone}"></div>
              <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="ci-email" value="${info.email}"></div>
            </div>
            <div class="flex justify-end"><button class="btn btn-primary" id="btn-save-ci"><i class="ph ph-floppy-disk"></i> Update</button></div>
          </div>
        `;
        el.querySelector('#btn-save-ci').addEventListener('click', () => {
            db.data.companyInfo = {
                name: el.querySelector('#ci-name').value, address: el.querySelector('#ci-addr').value,
                gstin: el.querySelector('#ci-gstin').value, stateCode: el.querySelector('#ci-state').value,
                phone: el.querySelector('#ci-phone').value, email: el.querySelector('#ci-email').value
            };
            db.saveData();
            alert('Company Info Updated!');
        });
    };

    render();
    return c;
}
