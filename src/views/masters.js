import { db } from '../store/db.js';

export default function MastersView() {
  const c = document.createElement('div');
  c.className = 'animate-fade-in';
  let activeTab = 'chemicals';
  let editingItem = null; // { type, id, data }

  const render = () => {
    c.innerHTML = `
          <div class="tabs">
            <div class="tab ${activeTab === 'chemicals' ? 'active' : ''}" data-tab="chemicals">Chemicals</div>
            <div class="tab ${activeTab === 'products' ? 'active' : ''}" data-tab="products">Products</div>
            <div class="tab ${activeTab === 'customers' ? 'active' : ''}" data-tab="customers">Customers</div>
            <div class="tab ${activeTab === 'suppliers' ? 'active' : ''}" data-tab="suppliers">Suppliers</div>
            <div class="tab ${activeTab === 'ledgers' ? 'active' : ''}" data-tab="ledgers">Ledgers</div>
            <div class="tab ${activeTab === 'groups' ? 'active' : ''}" data-tab="groups">Groups</div>
          </div>
          <div id="tab-content"></div>
        `;
    c.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { activeTab = t.dataset.tab; editingItem = null; render(); }));
    const content = c.querySelector('#tab-content');
    if (activeTab === 'chemicals') renderChemicals(content);
    else if (activeTab === 'products') renderProducts(content);
    else if (activeTab === 'customers') renderCustomers(content);
    else if (activeTab === 'suppliers') renderSuppliers(content);
    else if (activeTab === 'ledgers') renderLedgers(content);
    else renderAccountGroups(content);
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
              <div class="grid-2">
                <div class="form-group"><label class="form-label">Chemical Name</label><input class="form-control" id="ch-name" value="${ed.name || ''}" placeholder="E.g., Carbon Black N330"></div>
                <div class="form-group"><label class="form-label">Alias / Code</label><input class="form-control" id="ch-alias" value="${ed.alias || ''}" placeholder="CB-01"></div>
              </div>
              <div class="grid-2">
                <div class="form-group"><label class="form-label">Unit</label><input class="form-control" id="ch-unit" value="${ed.unit || 'Kg'}" placeholder="Kg"></div>
                <div class="form-group"><label class="form-label">HSN Code</label><input class="form-control" id="ch-hsn" value="${ed.hsnCode || ''}" placeholder="28030010"></div>
              </div>
              <div class="grid-2">
                <div class="form-group"><label class="form-label">GST Rate (%)</label><input type="number" class="form-control" id="ch-gst" value="${ed.gstRate ?? 18}"></div>
                <div class="form-group"><label class="form-label">Min Stock Alert</label><input type="number" class="form-control" id="ch-min" value="${ed.minStock || ''}" placeholder="100"></div>
              </div>
              <div class="card bg-gray-50 p-3 mt-2">
                <div class="text-xs font-bold text-muted mb-2 uppercase">Opening Stock</div>
                <div class="grid-2">
                    <div class="form-group"><label class="form-label">Qty</label><input type="number" class="form-control" id="ch-opening" value="${ed.openingQty || ''}" placeholder="0"></div>
                    <div class="form-group"><label class="form-label">Rate (₹)</label><input type="number" class="form-control" id="ch-opening-rate" value="${ed.openingRate || ''}" placeholder="0.00"></div>
                </div>
              </div>
              <div class="flex justify-end gap-2 mt-4">
                <button class="btn btn-primary w-full" id="btn-save-ch"><i class="ph ph-floppy-disk"></i> ${isEdit ? 'Update' : 'Save'} Item</button>
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
    
    const table = el.querySelector('.table');
    
    el.querySelector('#btn-save-ch').addEventListener('click', () => {
      const name = el.querySelector('#ch-name').value.trim();
      if (!name) { alert('Enter name'); return; }
      const data = { 
          name, 
          alias: el.querySelector('#ch-alias').value,
          unit: el.querySelector('#ch-unit').value || 'Kg', 
          hsnCode: el.querySelector('#ch-hsn').value, 
          gstRate: Number(el.querySelector('#ch-gst').value) || 18, 
          minStock: Number(el.querySelector('#ch-min').value) || 0, 
          openingQty: Number(el.querySelector('#ch-opening').value) || 0,
          openingRate: Number(el.querySelector('#ch-opening-rate').value) || 0
      };
      if (isEdit) { db.updateChemical(editingItem.id, data); editingItem = null; }
      else { db.addChemical(data); }
      render();
    });
    el.querySelectorAll('.edit-ch').forEach(btn => btn.addEventListener('click', e => {
      const ch = db.data.chemicals.find(c => c.id === e.currentTarget.dataset.id);
      if (ch) { editingItem = { type: 'chemical', id: ch.id, data: { ...ch } }; render(); }
    }));
    el.querySelectorAll('.del-ch').forEach(btn => btn.addEventListener('click', e => {
      if (confirm('Delete this chemical?')) { db.deleteChemical(e.currentTarget.dataset.id); render(); }
    }));
    if (el.querySelector('#btn-cancel-edit')) el.querySelector('#btn-cancel-edit').addEventListener('click', () => { editingItem = null; render(); });
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
              <div class="grid-2">
                <div class="form-group"><label class="form-label">Product Name</label><input class="form-control" id="pr-name" value="${ed.name || ''}" placeholder="E.g., Silicon O-Ring 25mm"></div>
                <div class="form-group"><label class="form-label">Alias</label><input class="form-control" id="pr-alias" value="${ed.alias || ''}" placeholder="PROD-01"></div>
              </div>
              <div class="grid-2">
                <div class="form-group"><label class="form-label">Product Type</label>
                  <select class="form-control" id="pr-type"><option value="silicon" ${ed.productType === 'silicon' ? 'selected' : ''}>Silicon</option><option value="non-silicon" ${ed.productType === 'non-silicon' ? 'selected' : ''}>Non-Silicon</option></select></div>
                <div class="form-group"><label class="form-label">Unit</label><input class="form-control" id="pr-unit" value="${ed.unit || 'Pcs'}" placeholder="Pcs"></div>
              </div>
              <div class="grid-2">
                <div class="form-group"><label class="form-label">HSN Code</label><input class="form-control" id="pr-hsn" value="${ed.hsnCode || ''}" placeholder="40169320"></div>
                <div class="form-group"><label class="form-label">GST Rate (%)</label><input type="number" class="form-control" id="pr-gst" value="${ed.gstRate ?? 18}"></div>
              </div>
              <div class="grid-2 mt-2">
                <div class="form-group"><label class="form-label">Std Rate (₹)</label><input type="number" class="form-control" id="pr-rate" value="${ed.rate || ''}" placeholder="0.00"></div>
                <div class="form-group"><label class="form-label">Opening Qty</label><input type="number" class="form-control" id="pr-opening" value="${ed.openingQty || ''}" placeholder="0"></div>
              </div>
              <div class="flex justify-end gap-2 mt-4">
                <button class="btn btn-primary w-full" id="btn-save-pr"><i class="ph ph-floppy-disk"></i> ${isEdit ? 'Update' : 'Save'} Product</button>
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
                    <td><span class="badge badge-${p.productType === 'silicon' ? 'info' : 'warning'}">${p.productType}</span></td>
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
    
    const table = el.querySelector('.table');
    
    el.querySelector('#btn-save-pr').addEventListener('click', () => {
      const name = el.querySelector('#pr-name').value.trim();
      if (!name) { alert('Enter name'); return; }
      const data = { 
          name, 
          alias: el.querySelector('#pr-alias').value,
          productType: el.querySelector('#pr-type').value, 
          unit: el.querySelector('#pr-unit').value || 'Pcs', 
          hsnCode: el.querySelector('#pr-hsn').value, 
          gstRate: Number(el.querySelector('#pr-gst').value) || 18, 
          rate: Number(el.querySelector('#pr-rate').value) || 0, 
          openingQty: Number(el.querySelector('#pr-opening').value) || 0 
      };
      if (isEdit) { db.updateProduct(editingItem.id, data); editingItem = null; }
      else { db.addProduct(data); }
      render();
    });
    el.querySelectorAll('.edit-pr').forEach(btn => btn.addEventListener('click', e => {
      const p = db.data.products.find(p => p.id === e.currentTarget.dataset.id);
      if (p) { editingItem = { type: 'product', id: p.id, data: { ...p } }; render(); }
    }));
    el.querySelectorAll('.del-pr').forEach(btn => btn.addEventListener('click', e => {
      if (confirm('Delete this product?')) { db.deleteProduct(e.currentTarget.dataset.id); render(); }
    }));
    if (el.querySelector('#btn-cancel-edit')) el.querySelector('#btn-cancel-edit').addEventListener('click', () => { editingItem = null; render(); });
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
              <div class="grid-2">
                <div class="form-group"><label class="form-label">Customer Name</label><input class="form-control" id="cu-name" value="${ed.name || ''}" placeholder="E.g., Mahindra Auto Parts"></div>
                <div class="form-group"><label class="form-label">Alias</label><input class="form-control" id="cu-alias" value="${ed.alias || ''}" placeholder="M-AUTO"></div>
              </div>
              <div class="form-group"><label class="form-label">Address</label><textarea class="form-control" id="cu-addr" rows="2" placeholder="Full Registered Address">${ed.address || ''}</textarea></div>
              <div class="grid-2">
                <div class="form-group"><label class="form-label">GSTIN</label><input class="form-control" id="cu-gstin" value="${ed.gstin || ''}" placeholder="27AABCM1234F1Z5"></div>
                <div class="form-group"><label class="form-label">State</label>
                  <select class="form-control" id="cu-state">
                    <option value="">-- Select State --</option>
                    <option value="35" ${ed.stateCode==='35'?'selected':''}>Andaman and Nicobar Islands (35)</option>
                    <option value="28" ${ed.stateCode==='28'?'selected':''}>Andhra Pradesh (28)</option>
                    <option value="37" ${ed.stateCode==='37'?'selected':''}>Andhra Pradesh (New) (37)</option>
                    <option value="12" ${ed.stateCode==='12'?'selected':''}>Arunachal Pradesh (12)</option>
                    <option value="18" ${ed.stateCode==='18'?'selected':''}>Assam (18)</option>
                    <option value="10" ${ed.stateCode==='10'?'selected':''}>Bihar (10)</option>
                    <option value="04" ${ed.stateCode==='04'?'selected':''}>Chandigarh (04)</option>
                    <option value="22" ${ed.stateCode==='22'?'selected':''}>Chhattisgarh (22)</option>
                    <option value="26" ${ed.stateCode==='26'?'selected':''}>Dadra and Nagar Haveli (26)</option>
                    <option value="25" ${ed.stateCode==='25'?'selected':''}>Daman and Diu (25)</option>
                    <option value="07" ${ed.stateCode==='07'?'selected':''}>Delhi (07)</option>
                    <option value="30" ${ed.stateCode==='30'?'selected':''}>Goa (30)</option>
                    <option value="24" ${ed.stateCode==='24'?'selected':''}>Gujarat (24)</option>
                    <option value="06" ${ed.stateCode==='06'?'selected':''}>Haryana (06)</option>
                    <option value="02" ${ed.stateCode==='02'?'selected':''}>Himachal Pradesh (02)</option>
                    <option value="01" ${ed.stateCode==='01'?'selected':''}>Jammu and Kashmir (01)</option>
                    <option value="20" ${ed.stateCode==='20'?'selected':''}>Jharkhand (20)</option>
                    <option value="29" ${ed.stateCode==='29'?'selected':''}>Karnataka (29)</option>
                    <option value="32" ${ed.stateCode==='32'?'selected':''}>Kerala (32)</option>
                    <option value="31" ${ed.stateCode==='31'?'selected':''}>Lakshadweep (31)</option>
                    <option value="23" ${ed.stateCode==='23'?'selected':''}>Madhya Pradesh (23)</option>
                    <option value="27" ${ed.stateCode==='27'?'selected':''}>Maharashtra (27)</option>
                    <option value="14" ${ed.stateCode==='14'?'selected':''}>Manipur (14)</option>
                    <option value="17" ${ed.stateCode==='17'?'selected':''}>Meghalaya (17)</option>
                    <option value="15" ${ed.stateCode==='15'?'selected':''}>Mizoram (15)</option>
                    <option value="13" ${ed.stateCode==='13'?'selected':''}>Nagaland (13)</option>
                    <option value="21" ${ed.stateCode==='21'?'selected':''}>Odisha (21)</option>
                    <option value="34" ${ed.stateCode==='34'?'selected':''}>Puducherry (34)</option>
                    <option value="03" ${ed.stateCode==='03'?'selected':''}>Punjab (03)</option>
                    <option value="08" ${ed.stateCode==='08'?'selected':''}>Rajasthan (08)</option>
                    <option value="11" ${ed.stateCode==='11'?'selected':''}>Sikkim (11)</option>
                    <option value="33" ${ed.stateCode==='33'?'selected':''}>Tamil Nadu (33)</option>
                    <option value="36" ${ed.stateCode==='36'?'selected':''}>Telangana (36)</option>
                    <option value="16" ${ed.stateCode==='16'?'selected':''}>Tripura (16)</option>
                    <option value="09" ${ed.stateCode==='09'?'selected':''}>Uttar Pradesh (09)</option>
                    <option value="05" ${ed.stateCode==='05'?'selected':''}>Uttarakhand (05)</option>
                    <option value="19" ${ed.stateCode==='19'?'selected':''}>West Bengal (19)</option>
                  </select>
                </div>
              </div>
              <div class="grid-2">
                <div class="form-group"><label class="form-label">Mobile</label><input class="form-control" id="cu-contact" value="${ed.contact || ''}" placeholder="9876543210"></div>
                <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="cu-email" value="${ed.email || ''}" placeholder="info@customer.com"></div>
              </div>
              <div class="grid-2">
                <div class="form-group"><label class="form-label">Credit Limit (₹)</label><input type="number" class="form-control" id="cu-credit-limit" value="${ed.creditLimit ?? 0}"></div>
                <div class="form-group"><label class="form-label">Credit Days</label><input type="number" class="form-control" id="cu-credit" value="${ed.creditDays ?? 30}"></div>
              </div>
              <div class="card bg-gray-50 p-2 mt-2">
                <div class="grid-2">
                    <div class="form-group"><label class="form-label">Opening Bal (₹)</label><input type="number" class="form-control" id="cu-opbal" value="${ed.openingBal || ed.openingBalance || ''}" placeholder="0.00"></div>
                    <div class="form-group"><label class="form-label">Type</label>
                    <select class="form-control" id="cu-optype">
                        <option value="Dr" ${ed.openingType==='Dr' || ed.openingBalanceType==='Dr'?'selected':''}>Dr (Receivable)</option>
                        <option value="Cr" ${ed.openingType==='Cr' || ed.openingBalanceType==='Cr'?'selected':''}>Cr (Advance)</option>
                    </select>
                    </div>
                </div>
              </div>
              <div class="flex justify-end gap-2 mt-4">
                <button class="btn btn-primary w-full" id="btn-save-cu"><i class="ph ph-floppy-disk"></i> ${isEdit ? 'Update' : 'Save'} Account</button>
              </div>
            </div>
            <div class="card">
              <div class="section-header"><div class="section-title">Existing Customers (${db.data.customers.length})</div></div>
              <div style="max-height:350px;overflow-y:auto">
                <table class="table">
                  <thead><tr><th>Name</th><th>GSTIN</th><th>Contact</th><th>Credit</th><th>Actions</th></tr></thead>
                  <tbody>
                  ${db.data.customers.map(cu => `<tr>
                    <td><div class="font-medium">${cu.name}</div><div class="text-xs text-muted">${cu.address || ''}</div></td>
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
    
    const table = el.querySelector('.table');
    
    el.querySelector('#btn-save-cu').addEventListener('click', () => {
      const name = el.querySelector('#cu-name').value.trim();
      if (!name) { alert('Enter name'); return; }
      const data = { 
          name, 
          alias: el.querySelector('#cu-alias').value,
          address: el.querySelector('#cu-addr').value, 
          gstin: el.querySelector('#cu-gstin').value, 
          stateCode: el.querySelector('#cu-state').value, 
          contact: el.querySelector('#cu-contact').value, 
          email: el.querySelector('#cu-email').value,
          creditLimit: Number(el.querySelector('#cu-credit-limit').value) || 0,
          creditDays: Number(el.querySelector('#cu-credit').value) || 30, 
          openingBalance: Number(el.querySelector('#cu-opbal').value) || 0, 
          openingBalanceType: el.querySelector('#cu-optype').value 
      };
      if (isEdit) { db.updateCustomer(editingItem.id, data); editingItem = null; }
      else { db.addCustomer(data); }
      render();
    });
    el.querySelectorAll('.edit-cu').forEach(btn => btn.addEventListener('click', e => {
      const cu = db.data.customers.find(c => c.id === e.currentTarget.dataset.id);
      if (cu) { editingItem = { type: 'customer', id: cu.id, data: { ...cu } }; render(); }
    }));
    el.querySelectorAll('.del-cu').forEach(btn => btn.addEventListener('click', e => {
      if (confirm('Delete this customer? This will NOT delete existing transactions.')) { db.deleteCustomer(e.currentTarget.dataset.id); render(); }
    }));
    if (el.querySelector('#btn-cancel-edit')) el.querySelector('#btn-cancel-edit').addEventListener('click', () => { editingItem = null; render(); });
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
              <div class="grid-2">
                <div class="form-group"><label class="form-label">Supplier Name</label><input class="form-control" id="su-name" value="${ed.name || ''}" placeholder="E.g., National Chemicals"></div>
                <div class="form-group"><label class="form-label">Alias</label><input class="form-control" id="su-alias" value="${ed.alias || ''}" placeholder="NAT-CHEM"></div>
              </div>
              <div class="form-group"><label class="form-label">Address</label><textarea class="form-control" id="su-addr" rows="2" placeholder="Full Registered Address">${ed.address || ''}</textarea></div>
              <div class="grid-2">
                <div class="form-group"><label class="form-label">GSTIN</label><input class="form-control" id="su-gstin" value="${ed.gstin || ''}" placeholder="07AABCN1234H1Z9"></div>
                <div class="form-group"><label class="form-label">State</label>
                  <select class="form-control" id="su-state">
                    <option value="">-- Select State --</option>
                    <option value="35" ${ed.stateCode==='35'?'selected':''}>Andaman and Nicobar Islands (35)</option>
                    <option value="28" ${ed.stateCode==='28'?'selected':''}>Andhra Pradesh (28)</option>
                    <option value="37" ${ed.stateCode==='37'?'selected':''}>Andhra Pradesh (New) (37)</option>
                    <option value="12" ${ed.stateCode==='12'?'selected':''}>Arunachal Pradesh (12)</option>
                    <option value="18" ${ed.stateCode==='18'?'selected':''}>Assam (18)</option>
                    <option value="10" ${ed.stateCode==='10'?'selected':''}>Bihar (10)</option>
                    <option value="04" ${ed.stateCode==='04'?'selected':''}>Chandigarh (04)</option>
                    <option value="22" ${ed.stateCode==='22'?'selected':''}>Chhattisgarh (22)</option>
                    <option value="26" ${ed.stateCode==='26'?'selected':''}>Dadra and Nagar Haveli (26)</option>
                    <option value="25" ${ed.stateCode==='25'?'selected':''}>Daman and Diu (25)</option>
                    <option value="07" ${ed.stateCode==='07'?'selected':''}>Delhi (07)</option>
                    <option value="30" ${ed.stateCode==='30'?'selected':''}>Goa (30)</option>
                    <option value="24" ${ed.stateCode==='24'?'selected':''}>Gujarat (24)</option>
                    <option value="06" ${ed.stateCode==='06'?'selected':''}>Haryana (06)</option>
                    <option value="02" ${ed.stateCode==='02'?'selected':''}>Himachal Pradesh (02)</option>
                    <option value="01" ${ed.stateCode==='01'?'selected':''}>Jammu and Kashmir (01)</option>
                    <option value="20" ${ed.stateCode==='20'?'selected':''}>Jharkhand (20)</option>
                    <option value="29" ${ed.stateCode==='29'?'selected':''}>Karnataka (29)</option>
                    <option value="32" ${ed.stateCode==='32'?'selected':''}>Kerala (32)</option>
                    <option value="31" ${ed.stateCode==='31'?'selected':''}>Lakshadweep (31)</option>
                    <option value="23" ${ed.stateCode==='23'?'selected':''}>Madhya Pradesh (23)</option>
                    <option value="27" ${ed.stateCode==='27'?'selected':''}>Maharashtra (27)</option>
                    <option value="14" ${ed.stateCode==='14'?'selected':''}>Manipur (14)</option>
                    <option value="17" ${ed.stateCode==='17'?'selected':''}>Meghalaya (17)</option>
                    <option value="15" ${ed.stateCode==='15'?'selected':''}>Mizoram (15)</option>
                    <option value="13" ${ed.stateCode==='13'?'selected':''}>Nagaland (13)</option>
                    <option value="21" ${ed.stateCode==='21'?'selected':''}>Odisha (21)</option>
                    <option value="34" ${ed.stateCode==='34'?'selected':''}>Puducherry (34)</option>
                    <option value="03" ${ed.stateCode==='03'?'selected':''}>Punjab (03)</option>
                    <option value="08" ${ed.stateCode==='08'?'selected':''}>Rajasthan (08)</option>
                    <option value="11" ${ed.stateCode==='11'?'selected':''}>Sikkim (11)</option>
                    <option value="33" ${ed.stateCode==='33'?'selected':''}>Tamil Nadu (33)</option>
                    <option value="36" ${ed.stateCode==='36'?'selected':''}>Telangana (36)</option>
                    <option value="16" ${ed.stateCode==='16'?'selected':''}>Tripura (16)</option>
                    <option value="09" ${ed.stateCode==='09'?'selected':''}>Uttar Pradesh (09)</option>
                    <option value="05" ${ed.stateCode==='05'?'selected':''}>Uttarakhand (05)</option>
                    <option value="19" ${ed.stateCode==='19'?'selected':''}>West Bengal (19)</option>
                  </select>
                </div>
              </div>
              <div class="grid-2">
                <div class="form-group"><label class="form-label">Mobile</label><input class="form-control" id="su-contact" value="${ed.contact || ''}" placeholder="Phone"></div>
                <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="su-email" value="${ed.email || ''}" placeholder="Email address"></div>
              </div>
              <div class="card bg-gray-50 p-2 mt-2">
                <div class="grid-2">
                    <div class="form-group"><label class="form-label">Opening Bal (₹)</label><input type="number" class="form-control" id="su-opbal" value="${ed.openingBal || ed.openingBalance || ''}" placeholder="0.00"></div>
                    <div class="form-group"><label class="form-label">Type</label>
                    <select class="form-control" id="su-optype">
                        <option value="Cr" ${ed.openingType==='Cr' || ed.openingBalanceType==='Cr'?'selected':''}>Cr (Payable)</option>
                        <option value="Dr" ${ed.openingType==='Dr' || ed.openingBalanceType==='Dr'?'selected':''}>Dr (Advance)</option>
                    </select>
                    </div>
                </div>
              </div>
              <div class="flex justify-end gap-2 mt-4">
                <button class="btn btn-primary w-full" id="btn-save-su"><i class="ph ph-floppy-disk"></i> ${isEdit ? 'Update' : 'Save'} Account</button>
              </div>
            </div>
            <div class="card">
              <div class="section-header"><div class="section-title">Existing Suppliers (${db.data.suppliers.length})</div></div>
              <div style="max-height:350px;overflow-y:auto">
                <table class="table">
                  <thead><tr><th>Name</th><th>GSTIN</th><th>State</th><th>Contact</th><th>Actions</th></tr></thead>
                  <tbody>
                  ${db.data.suppliers.map(su => `<tr>
                    <td><div class="font-medium">${su.name}</div><div class="text-xs text-muted">${su.address || ''}</div></td>
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
    
    const table = el.querySelector('.table');
    
    el.querySelector('#btn-save-su').addEventListener('click', () => {
      const name = el.querySelector('#su-name').value.trim();
      if (!name) { alert('Enter name'); return; }
      const data = { 
          name, 
          alias: el.querySelector('#su-alias').value,
          address: el.querySelector('#su-addr').value, 
          gstin: el.querySelector('#su-gstin').value, 
          stateCode: el.querySelector('#su-state').value, 
          contact: el.querySelector('#su-contact').value, 
          email: el.querySelector('#su-email').value,
          openingBalance: Number(el.querySelector('#su-opbal').value) || 0, 
          openingBalanceType: el.querySelector('#su-optype').value 
      };
      if (isEdit) { db.updateSupplier(editingItem.id, data); editingItem = null; }
      else { db.addSupplier(data); }
      render();
    });
    el.querySelectorAll('.edit-su').forEach(btn => btn.addEventListener('click', e => {
      const su = db.data.suppliers.find(s => s.id === e.currentTarget.dataset.id);
      if (su) { editingItem = { type: 'supplier', id: su.id, data: { ...su } }; render(); }
    }));
    el.querySelectorAll('.del-su').forEach(btn => btn.addEventListener('click', e => {
      if (confirm('Delete this supplier?')) { db.deleteSupplier(e.currentTarget.dataset.id); render(); }
    }));
    if (el.querySelector('#btn-cancel-edit')) el.querySelector('#btn-cancel-edit').addEventListener('click', () => { editingItem = null; render(); });
  };

  // ── Ledgers (Unified Master) ────
  const renderLedgers = (el) => {
    const isEdit = editingItem && editingItem.type === 'account';
    const ed = isEdit ? editingItem.data : {};
    const groups = db.data.accountGroups || [];
    
    const isBank = (grpName) => grpName === 'Bank Accounts';

    el.innerHTML = `
          <div class="grid-2">
            <div class="card">
              <div class="section-header"><div class="section-title">${isEdit ? '✏️ Edit' : 'Add'} Ledger Account</div>
              ${isEdit ? `<button class="btn btn-sm btn-secondary" id="btn-cancel-edit">Cancel</button>` : ''}</div>
              
              <div class="grid-2">
                <div class="form-group"><label class="form-label">Ledger Name</label><input class="form-control" id="acc-name" value="${ed.name || ''}" placeholder="E.g., Office Rent, HDFC Bank, etc."></div>
                <div class="form-group"><label class="form-label">Alias</label><input class="form-control" id="acc-alias" value="${ed.alias || ''}" placeholder="RENT-01"></div>
              </div>
              <div class="form-group"><label class="form-label">Address (Optional)</label><textarea class="form-control" id="acc-addr" rows="1">${ed.address || ''}</textarea></div>
              <div class="grid-2">
                <div class="form-group"><label class="form-label">GSTIN (Optional)</label><input class="form-control" id="acc-gstin" value="${ed.gstin || ''}"></div>
                <div class="form-group"><label class="form-label">Mobile</label><input class="form-control" id="acc-mobile" value="${ed.mobile || ''}"></div>
              </div>
              
              <div class="grid-2">
                <div class="form-group"><label class="form-label">Account Group</label>
                  <select class="form-control" id="acc-group">
                    <option value="">-- Select Group --</option>
                    ${groups.map(g => `<option value="${g.name}" ${ed.group === g.name ? 'selected' : ''}>${g.name}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group"><label class="form-label">Account Kind</label>
                  <select class="form-control" id="acc-kind">
                    <option value="other" ${ed.accountKind === 'other' ? 'selected' : ''}>General Ledger</option>
                    <option value="bank" ${ed.accountKind === 'bank' || ed.group === 'Bank Accounts' ? 'selected' : ''}>Bank Account</option>
                    <option value="cash" ${ed.accountKind === 'cash' || ed.group === 'Cash-in-Hand' ? 'selected' : ''}>Cash Account</option>
                    <option value="upi" ${ed.accountKind === 'upi' ? 'selected' : ''}>UPI / Wallet</option>
                  </select>
                </div>
              </div>

              <!-- Bank Specific Fields (Dynamic) -->
              <div id="bank-fields-container" style="display: ${isBank(ed.group) ? 'block' : 'none'}">
                <div class="grid-2 mt-2">
                  <div class="form-group"><label class="form-label">Bank Name</label><input class="form-control" id="acc-bank-name" value="${ed.bankName || ''}" placeholder="E.g., PNB"></div>
                  <div class="form-group"><label class="form-label">Account No</label><input class="form-control" id="acc-no" value="${ed.accountNo || ''}"></div>
                </div>
              </div>

              <div class="grid-2 mt-2">
                <div class="form-group"><label class="form-label">Opening Bal (₹)</label><input type="number" class="form-control" id="acc-opbal" value="${ed.openingBalance || '0'}"></div>
                <div class="form-group"><label class="form-label">Type</label>
                  <select class="form-control" id="acc-optype"><option value="Dr" ${ed.openingBalanceType === 'Dr' ? 'selected' : ''}>Dr (Asset/Exp)</option><option value="Cr" ${ed.openingBalanceType === 'Cr' ? 'selected' : ''}>Cr (Lib/Inc)</option></select>
                </div>
              </div>
              
              <div class="flex justify-end mt-4"><button class="btn btn-primary w-full" id="btn-save-acc"><i class="ph ph-floppy-disk"></i> ${isEdit ? 'Update' : 'Create'} Ledger</button></div>
            </div>

            <div class="card">
              <div class="section-header"><div class="section-title">Existing Ledgers</div></div>
              <div style="max-height:450px;overflow-y:auto">
                <table class="table">
                  <thead><tr><th>Name</th><th>Group</th><th class="text-right">Action</th></tr></thead>
                  <tbody>
                  ${db.data.accounts.map(a => `<tr>
                    <td>
                        <div class="font-medium">${a.name}</div>
                        ${a.accountNo ? `<div class="text-xs text-muted">A/c: ${a.accountNo}</div>` : ''}
                        ${a.isLinked ? `<div class="text-xs text-info" style="font-style:italic">Auto-Linked ${a.group === 'Sundry Debtors' ? '(Customer)' : '(Supplier)'}</div>` : ''}
                    </td>
                    <td><span class="badge" style="font-size:10px; opacity:0.7">${a.group}</span></td>
                    <td class="text-right">
                      ${a.isLinked ? `
                        <button class="btn btn-sm btn-ghost" title="Linked to Party Master" disabled><i class="ph ph-link-simple" style="color:var(--accent-success)"></i></button>
                      ` : `
                        <button class="btn btn-sm btn-ghost edit-acc" data-id="${a.id}"><i class="ph ph-pencil-simple" style="color:var(--accent-info)"></i></button>
                        <button class="btn btn-sm btn-ghost del-acc" data-id="${a.id}"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button>
                      `}
                    </td>
                  </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;

    const table = el.querySelector('.table');

    const groupSel = el.querySelector('#acc-group');
    const bankFields = el.querySelector('#bank-fields-container');
    const kindSel = el.querySelector('#acc-kind');

    groupSel.addEventListener('change', (e) => {
        if (isBank(e.target.value)) {
            bankFields.style.display = 'block';
            kindSel.value = 'bank';
        } else if (e.target.value === 'Cash-in-Hand') {
            bankFields.style.display = 'none';
            kindSel.value = 'cash';
        } else {
            bankFields.style.display = 'none';
            kindSel.value = 'other';
        }
    });

    el.querySelector('#btn-save-acc').addEventListener('click', () => {
      const name = el.querySelector('#acc-name').value.trim();
      const groupName = groupSel.value;
      if (!name || !groupName) { alert('Name and Group are required'); return; }
      
      const grp = groups.find(g => g.name === groupName);
      const data = { 
          name, 
          alias: el.querySelector('#acc-alias').value,
          group: groupName, 
          type: grp?.type || 'Asset', 
          accountKind: kindSel.value,
          address: el.querySelector('#acc-addr').value,
          gstin: el.querySelector('#acc-gstin').value,
          mobile: el.querySelector('#acc-mobile').value,
          bankName: el.querySelector('#acc-bank-name')?.value || '',
          accountNo: el.querySelector('#acc-no')?.value || '',
          openingBalance: Number(el.querySelector('#acc-opbal').value) || 0,
          openingBalanceType: el.querySelector('#acc-optype').value 
      };
      if (isEdit) { db.updateAccount(editingItem.id, data); editingItem = null; }
      else { db.addAccount(data); }
      render();
    });

    el.querySelectorAll('.edit-acc').forEach(btn => btn.addEventListener('click', e => {
      const a = db.data.accounts.find(x => x.id === e.currentTarget.dataset.id);
      if (a) { editingItem = { type: 'account', id: a.id, data: { ...a } }; render(); }
    }));
    
    el.querySelectorAll('.del-acc').forEach(btn => btn.addEventListener('click', e => {
      if (confirm('Delete this ledger?')) { if(!db.deleteAccount(e.currentTarget.dataset.id)) alert('Cannot delete system accounts'); render(); }
    }));
    
    if (el.querySelector('#btn-cancel-edit')) el.querySelector('#btn-cancel-edit').addEventListener('click', () => { editingItem = null; render(); });
  };

  // ── Account Groups ────
  const renderAccountGroups = (el) => {
    const isEdit = editingItem && editingItem.type === 'group';
    const ed = isEdit ? editingItem.data : {};
    el.innerHTML = `
          <div class="grid-2">
            <div class="card">
              <div class="section-header"><div class="section-title">${isEdit ? '✏️ Edit' : 'Add'} Account Group</div>
              ${isEdit ? `<button class="btn btn-sm btn-secondary" id="btn-cancel-edit">Cancel</button>` : ''}</div>
              <div class="form-group"><label class="form-label">Group Name</label><input class="form-control" id="grp-name" value="${ed.name || ''}" placeholder="E.g., Office Expenses"></div>
              <div class="form-group"><label class="form-label">Primary Type</label>
                <select class="form-control" id="grp-type">
                  <option value="Asset" ${ed.type === 'Asset' ? 'selected' : ''}>Asset</option>
                  <option value="Liability" ${ed.type === 'Liability' ? 'selected' : ''}>Liability</option>
                  <option value="Expense" ${ed.type === 'Expense' ? 'selected' : ''}>Expense</option>
                  <option value="Income" ${ed.type === 'Income' ? 'selected' : ''}>Income</option>
                  <option value="Equity" ${ed.type === 'Equity' ? 'selected' : ''}>Equity</option>
                </select>
              </div>
              <div class="flex justify-end mt-4"><button class="btn btn-primary" id="btn-save-grp"><i class="ph ph-floppy-disk"></i> Save Group</button></div>
            </div>
            <div class="card">
              <div class="section-header"><div class="section-title">List of Groups</div></div>
              <div style="max-height:400px;overflow-y:auto">
                <table class="table">
                  <thead><tr><th>Group Name</th><th>Type</th><th class="text-right">Action</th></tr></thead>
                  <tbody>
                  ${db.data.accountGroups.map(g => `<tr>
                    <td class="font-medium">${g.name}</td><td><span class="badge" style="font-size:10px">${g.type}</span></td>
                    <td class="text-right">
                      <button class="btn btn-sm btn-ghost edit-grp" data-id="${g.id}"><i class="ph ph-pencil-simple" style="color:var(--accent-info)"></i></button>
                      <button class="btn btn-sm btn-ghost del-grp" data-id="${g.id}"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button>
                    </td>
                  </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
    
    const table = el.querySelector('.table');
    
    el.querySelector('#btn-save-grp').addEventListener('click', () => {
      const name = el.querySelector('#grp-name').value.trim();
      if (!name) return;
      const data = { name, type: el.querySelector('#grp-type').value };
      if (isEdit) { db.updateAccountGroup(editingItem.id, data); editingItem = null; }
      else { db.addAccountGroup(data); }
      render();
    });
    el.querySelectorAll('.edit-grp').forEach(btn => btn.addEventListener('click', e => {
      const g = db.data.accountGroups.find(x => x.id === e.currentTarget.dataset.id);
      if (g) { editingItem = { type: 'group', id: g.id, data: { ...g } }; render(); }
    }));
    el.querySelectorAll('.del-grp').forEach(btn => btn.addEventListener('click', e => {
      if (confirm('Delete this group?')) { if(!db.deleteAccountGroup(e.currentTarget.dataset.id)) alert('Cannot delete system group'); render(); }
    }));
    if (el.querySelector('#btn-cancel-edit')) el.querySelector('#btn-cancel-edit').addEventListener('click', () => { editingItem = null; render(); });
  };

  render();
  return c;
}
