import { db, formatDate, fmt } from '../store/db.js';

export default function VouchersView() {
    const c = document.createElement('div');
    c.className = 'animate-fade-in';
    let activeTab = 'payment';
    
    const render = () => {
        c.innerHTML = `
          <div class="tabs">
            <div class="tab ${activeTab==='payment'?'active':''}" data-tab="payment">Payment Voucher</div>
            <div class="tab ${activeTab==='receipt'?'active':''}" data-tab="receipt">Receipt Voucher</div>
            <div class="tab ${activeTab==='daybook'?'active':''}" data-tab="daybook">Day Book</div>
          </div>
          <div id="tab-content"></div>
        `;
        c.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { activeTab = t.dataset.tab; render(); }));
        const content = c.querySelector('#tab-content');
        if (activeTab === 'payment') renderPayment(content);
        else if (activeTab === 'receipt') renderReceipt(content);
        else renderDayBook(content);
    };

    const renderPayment = (el) => {
        const suppliers = db.data.suppliers;
        const payAccounts = db.data.accounts.filter(a => a.accountKind === 'cash' || a.accountKind === 'bank' || a.accountKind === 'upi');
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Payment to Supplier</div></div>
            <div class="grid-3 mb-4">
              <div class="form-group"><label class="form-label">Supplier</label>
                <select class="form-control" id="pay-party">${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
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
                partyId: el.querySelector('#pay-party').value,
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
        const customers = db.data.customers;
        const payAccounts = db.data.accounts.filter(a => a.accountKind === 'cash' || a.accountKind === 'bank' || a.accountKind === 'upi');
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Receipt from Customer</div></div>
            <div class="grid-3 mb-4">
              <div class="form-group"><label class="form-label">Customer</label>
                <select class="form-control" id="rec-party">${customers.map(cu => `<option value="${cu.id}">${cu.name}</option>`).join('')}</select></div>
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
                partyId: el.querySelector('#rec-party').value,
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

    const renderDayBook = (el) => {
        const vouchers = [...db.data.vouchers].reverse().slice(0, 50);
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Day Book (Last 50 Vouchers)</div></div>
            <div class="table-responsive">
              <table class="table">
                <thead><tr><th>Date</th><th>Vch No</th><th>Type</th><th>Narration</th></tr></thead>
                <tbody>
                  ${vouchers.map(v => `<tr>
                    <td>${v.date}</td><td>${v.voucherNo}</td>
                    <td><span class="badge badge-${v.type==='Sales'?'success':v.type==='Purchase'?'warning':v.type==='Payment'?'danger':v.type==='Receipt'?'info':'primary'}">${v.type}</span></td>
                    <td class="text-sm">${v.narration || '-'}</td>
                  </tr>`).join('')}
                  ${vouchers.length===0?'<tr><td colspan="4" class="text-center text-muted">No vouchers</td></tr>':''}
                </tbody>
              </table>
            </div>
          </div>
        `;
    };

    render();
    return c;
}
