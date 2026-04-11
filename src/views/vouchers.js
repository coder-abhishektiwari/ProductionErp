import { db, formatDate, fmt } from '../store/db.js';

export default function VouchersView() {
    const c = document.createElement('div');
    c.className = 'animate-fade-in';
    let activeTab = 'payment';
    
    const render = () => {
        c.innerHTML = `
          <div class="tabs">
            <div class="tab ${activeTab==='payment'?'active':''}" data-tab="payment">Payment</div>
            <div class="tab ${activeTab==='receipt'?'active':''}" data-tab="receipt">Receipt</div>
            <div class="tab ${activeTab==='contra'?'active':''}" data-tab="contra">Contra</div>
            <div class="tab ${activeTab==='journal'?'active':''}" data-tab="journal">Journal</div>
            <div class="tab ${activeTab==='daybook'?'active':''}" data-tab="daybook">Day Book</div>
          </div>
          <div id="tab-content"></div>
        `;
        c.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { activeTab = t.dataset.tab; render(); }));
        const content = c.querySelector('#tab-content');
        if (activeTab === 'payment') renderPayment(content);
        else if (activeTab === 'receipt') renderReceipt(content);
        else if (activeTab === 'contra') renderContra(content);
        else if (activeTab === 'journal') renderJournal(content);
        else renderDayBook(content);
    };

    const renderPayment = (el) => {
        const payToAccounts = db.data.accounts.filter(a => a.accountKind !== 'cash' && a.accountKind !== 'bank' && a.accountKind !== 'upi');
        const payAccounts = db.data.accounts.filter(a => a.accountKind === 'cash' || a.accountKind === 'bank' || a.accountKind === 'upi');
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Payment</div></div>
            <div class="grid-3 mb-4">
              <div class="form-group"><label class="form-label">Paid To (Account/Supplier)</label>
                <select class="form-control" id="pay-party">${payToAccounts.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
              <div class="form-group"><label class="form-label">Amount (₹)</label>
                <input type="number" class="form-control" id="pay-amount" placeholder="0.00"></div>
              <div class="form-group"><label class="form-label">Date</label>
                <input type="date" class="form-control" id="pay-date" value="${formatDate()}"></div>
            </div>
            <div class="grid-3 mb-4">
              <div class="form-group"><label class="form-label">Pay From Account</label>
                <select class="form-control" id="pay-account">${payAccounts.map(a => `<option value="${a.id}">${a.name} (Bal: ₹${fmt(db.getLedgerBalance(a.id))})</option>`).join('')}</select></div>
              <div class="form-group"><label class="form-label">Cheque No (optional)</label>
                <input class="form-control" id="pay-cheque" placeholder="Cheque number"></div>
              <div class="form-group"><label class="form-label">Narration</label>
                <input class="form-control" id="pay-narr" placeholder="Payment description"></div>
            </div>
            <div class="flex justify-end">
              <button class="btn btn-primary" id="btn-save-pay"><i class="ph ph-floppy-disk"></i> Save Payment</button>
            </div>
          </div>
        `;
        el.querySelector('#btn-save-pay').addEventListener('click', () => {
            const amount = Number(el.querySelector('#pay-amount').value);
            if (!amount || amount <= 0) { alert('Enter valid amount'); return; }
            db.addPaymentVoucher({
                targetAccountId: el.querySelector('#pay-party').value,
                amount,
                date: el.querySelector('#pay-date').value,
                accountId: el.querySelector('#pay-account').value,
                chequeNo: el.querySelector('#pay-cheque').value,
                narration: el.querySelector('#pay-narr').value
            });
            alert('Payment Saved!');
            render();
        });
    };

    const renderReceipt = (el) => {
        const recFromAccounts = db.data.accounts.filter(a => a.accountKind !== 'cash' && a.accountKind !== 'bank' && a.accountKind !== 'upi');
        const payAccounts = db.data.accounts.filter(a => a.accountKind === 'cash' || a.accountKind === 'bank' || a.accountKind === 'upi');
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Receipt</div></div>
            <div class="grid-3 mb-4">
              <div class="form-group"><label class="form-label">Received From (Account/Customer)</label>
                <select class="form-control" id="rec-party">${recFromAccounts.map(cu => `<option value="${cu.id}">${cu.name}</option>`).join('')}</select></div>
              <div class="form-group"><label class="form-label">Amount (₹)</label>
                <input type="number" class="form-control" id="rec-amount" placeholder="0.00"></div>
              <div class="form-group"><label class="form-label">Date</label>
                <input type="date" class="form-control" id="rec-date" value="${formatDate()}"></div>
            </div>
            <div class="grid-3 mb-4">
              <div class="form-group"><label class="form-label">Receive Into Account</label>
                <select class="form-control" id="rec-account">${payAccounts.map(a => `<option value="${a.id}">${a.name} (Bal: ₹${fmt(db.getLedgerBalance(a.id))})</option>`).join('')}</select></div>
              <div class="form-group"><label class="form-label">Cheque No (optional)</label>
                <input class="form-control" id="rec-cheque" placeholder="Cheque number"></div>
              <div class="form-group"><label class="form-label">Narration</label>
                <input class="form-control" id="rec-narr" placeholder="Receipt description"></div>
            </div>
            <div class="flex justify-end">
              <button class="btn btn-success" id="btn-save-rec"><i class="ph ph-floppy-disk"></i> Save Receipt</button>
            </div>
          </div>
        `;
        el.querySelector('#btn-save-rec').addEventListener('click', () => {
            const amount = Number(el.querySelector('#rec-amount').value);
            if (!amount || amount <= 0) { alert('Enter valid amount'); return; }
            db.addReceiptVoucher({
                targetAccountId: el.querySelector('#rec-party').value,
                amount,
                date: el.querySelector('#rec-date').value,
                accountId: el.querySelector('#rec-account').value,
                chequeNo: el.querySelector('#rec-cheque').value,
                narration: el.querySelector('#rec-narr').value
            });
            alert('Receipt Saved!');
            render();
        });
    };

    const renderContra = (el) => {
        const cbAccounts = db.data.accounts.filter(a => a.accountKind === 'cash' || a.accountKind === 'bank');
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Contra Entry (Cash / Bank Transfer)</div></div>
            <div class="grid-2 mb-4">
              <div class="form-group"><label class="form-label">Transfer From</label>
                <select class="form-control" id="con-from">${cbAccounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}</select></div>
              <div class="form-group"><label class="form-label">Transfer To</label>
                <select class="form-control" id="con-to">${cbAccounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}</select></div>
            </div>
            <div class="grid-3 mb-4">
               <div class="form-group"><label class="form-label">Amount (₹)</label>
                <input type="number" class="form-control" id="con-amount" placeholder="0.00"></div>
              <div class="form-group"><label class="form-label">Date</label>
                <input type="date" class="form-control" id="con-date" value="${formatDate()}"></div>
              <div class="form-group"><label class="form-label">Narration</label>
                <input class="form-control" id="con-narr" placeholder="Cash deposit, withdrawal, etc."></div>
            </div>
            <div class="flex justify-end">
              <button class="btn btn-primary" id="btn-save-con"><i class="ph ph-floppy-disk"></i> Save Contra</button>
            </div>
          </div>
        `;
        el.querySelector('#btn-save-con').addEventListener('click', () => {
            const fromId = el.querySelector('#con-from').value;
            const toId = el.querySelector('#con-to').value;
            const amount = Number(el.querySelector('#con-amount').value);
            if (fromId === toId) { alert('From and To accounts cannot be same'); return; }
            if (!amount) { alert('Enter amount'); return; }
            db.addContraVoucher({
                fromAccountId: fromId,
                toAccountId: toId,
                fromAccountName: db.data.accounts.find(a => a.id === fromId)?.name,
                toAccountName: db.data.accounts.find(a => a.id === toId)?.name,
                amount,
                date: el.querySelector('#con-date').value,
                narration: el.querySelector('#con-narr').value
            });
            alert('Contra recorded!');
            render();
        });
    };

    const renderJournal = (el) => {
        let entries = [
            { accountId: '', dr: 0, cr: 0 },
            { accountId: '', dr: 0, cr: 0 }
        ];

        const renderRows = () => {
            const tbody = el.querySelector('#j-rows');
            tbody.innerHTML = entries.map((en, idx) => `
                <tr>
                    <td>
                        <select class="form-control j-acc" data-idx="${idx}">
                            <option value="">-- Select Account --</option>
                            ${db.data.accounts.map(a => `<option value="${a.id}" ${a.id === en.accountId ? 'selected' : ''}>${a.name} (${a.group})</option>`).join('')}
                        </select>
                    </td>
                    <td><input type="number" class="form-control j-dr" data-idx="${idx}" value="${en.dr || ''}" placeholder="0.00"></td>
                    <td><input type="number" class="form-control j-cr" data-idx="${idx}" value="${en.cr || ''}" placeholder="0.00"></td>
                    <td><button class="btn btn-sm btn-ghost text-danger j-del" data-idx="${idx}"><i class="ph ph-x"></i></button></td>
                </tr>
            `).join('');

            // Totals
            const totDr = entries.reduce((s, e) => s + (Number(e.dr) || 0), 0);
            const totCr = entries.reduce((s, e) => s + (Number(e.cr) || 0), 0);
            el.querySelector('#j-tot-dr').textContent = '₹' + fmt(totDr);
            el.querySelector('#j-tot-cr').textContent = '₹' + fmt(totCr);
            el.querySelector('#j-diff').textContent = 'Difference: ₹' + fmt(Math.abs(totDr - totCr));
            el.querySelector('#j-diff').style.color = Math.abs(totDr - totCr) < 0.01 ? 'var(--accent-success)' : 'var(--accent-danger)';

            // Listeners
            tbody.querySelectorAll('.j-acc').forEach(s => s.addEventListener('change', e => { entries[e.target.dataset.idx].accountId = e.target.value; }));
            tbody.querySelectorAll('.j-dr').forEach(i => i.addEventListener('input', e => { 
                entries[e.target.dataset.idx].dr = Number(e.target.value); 
                if (entries[e.target.dataset.idx].dr) entries[e.target.dataset.idx].cr = 0; // Inhibit CR if DR set
                renderRows(); 
            }));
            tbody.querySelectorAll('.j-cr').forEach(i => i.addEventListener('input', e => { 
                entries[e.target.dataset.idx].cr = Number(e.target.value); 
                if (entries[e.target.dataset.idx].cr) entries[e.target.dataset.idx].dr = 0; // Inhibit DR if CR set
                renderRows(); 
            }));
            tbody.querySelectorAll('.j-del').forEach(b => b.addEventListener('click', e => { 
                if (entries.length > 2) { entries.splice(e.currentTarget.dataset.idx, 1); renderRows(); }
            }));
        };

        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Journal Voucher (Adjustments)</div></div>
            <div class="grid-2 mb-4">
              <div class="form-group"><label class="form-label">Date</label>
                <input type="date" class="form-control" id="j-date" value="${formatDate()}"></div>
              <div class="form-group"><label class="form-label">Narration</label>
                <input class="form-control" id="j-narr" placeholder="Adjustment, Depreciation, Opening Balance, etc."></div>
            </div>
            <table class="table">
                <thead><tr><th>Account</th><th width="150">Debit (₹)</th><th width="150">Credit (₹)</th><th width="50"></th></tr></thead>
                <tbody id="j-rows"></tbody>
                <tfoot>
                    <tr class="bg-gray-50 font-bold">
                        <td>TOTAL</td>
                        <td id="j-tot-dr" class="text-right">₹0.00</td>
                        <td id="j-tot-cr" class="text-right">₹0.00</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
            <div class="flex justify-between items-center mt-4">
                <div id="j-diff" class="text-xs font-bold">Difference: ₹0.00</div>
                <div class="flex gap-2">
                    <button class="btn btn-secondary btn-sm" id="btn-add-row"><i class="ph ph-plus"></i> Add Line</button>
                    <button class="btn btn-primary" id="btn-save-j"><i class="ph ph-floppy-disk"></i> Save Journal</button>
                </div>
            </div>
          </div>
        `;

        renderRows();

        el.querySelector('#btn-add-row').addEventListener('click', () => { entries.push({ accountId: '', dr: 0, cr: 0 }); renderRows(); });
        el.querySelector('#btn-save-j').addEventListener('click', () => {
            const totDr = entries.reduce((s, e) => s + (Number(e.dr) || 0), 0);
            const totCr = entries.reduce((s, e) => s + (Number(e.cr) || 0), 0);
            if (Math.abs(totDr - totCr) > 0.01) { alert('Debit and Credit must match!'); return; }
            if (entries.some(e => !e.accountId || (!e.dr && !e.cr))) { alert('Complete all lines or delete empty ones'); return; }

            db.addJournalVoucher({
                date: el.querySelector('#j-date').value,
                narration: el.querySelector('#j-narr').value,
                entries: entries.map(e => ({ accountId: e.accountId, drAmount: e.dr || 0, crAmount: e.cr || 0 }))
            });
            alert('Journal entry saved!');
            render();
        });
    };

    const renderDayBook = (el) => {
        const vouchers = [...db.data.vouchers].reverse().slice(0, 50);
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Day Book (Last 50 Vouchers)</div></div>
            <div class="table-responsive">
              <table class="table">
                <thead><tr><th>Date</th><th>Vch No</th><th>Type</th><th>Narration</th><th class="text-right">Action</th></tr></thead>
                <tbody>
                  ${vouchers.map(v => `<tr>
                    <td>${v.date}</td><td>${v.voucherNo}</td>
                    <td><span class="badge badge-${v.type==='Sales'?'success':v.type==='Purchase'?'warning':v.type==='Payment'?'danger':v.type==='Receipt'?'info':'primary'}">${v.type}</span></td>
                    <td class="text-sm">${v.narration || '-'}</td>
                    <td class="text-right"><button class="btn btn-sm btn-ghost del-vch" data-id="${v.id}" title="Permanently delete voucher"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button></td>
                  </tr>`).join('')}
                  ${vouchers.length===0?'<tr><td colspan="5" class="text-center text-muted">No vouchers</td></tr>':''}
                </tbody>
              </table>
            </div>
          </div>
        `;
        
        el.querySelectorAll('.del-vch').forEach(btn => btn.addEventListener('click', e => {
            if(confirm('Are you absolutely sure you want to delete this Voucher? This will globally delete ALL associated invoices, payments, and reverse stock logic!')) {
                db.deleteVoucher(e.currentTarget.dataset.id);
                render();
            }
        }));
    };

    render();
    return c;
}
