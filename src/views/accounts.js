import { db, fmt } from '../store/db.js';

export default function AccountsView() {
  const c = document.createElement('div');
  c.className = 'animate-fade-in';
  let activeTab = 'balances';

  const render = () => {
    c.innerHTML = `
          <div class="tabs">
            <div class="tab ${activeTab === 'balances' ? 'active' : ''}" data-tab="balances">Account Balances</div>
            <div class="tab ${activeTab === 'cheques' ? 'active' : ''}" data-tab="cheques">Cheque Register</div>
          </div>
          <div id="tab-content"></div>
        `;
    c.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { activeTab = t.dataset.tab; render(); }));
    const content = c.querySelector('#tab-content');
    if (activeTab === 'balances') renderBalances(content);
    else renderCheques(content);
  };

  const renderBalances = (el) => {
    const accBals = db.getAccountBalances();
    const totalBal = accBals.reduce((s, a) => s + a.balance, 0);
    el.innerHTML = `
          <div class="card mb-4">
            <div class="flex justify-between items-center">
              <div class="section-title">Total Cash & Bank Balance</div>
              <div class="stat-value">₹${fmt(totalBal)}</div>
            </div>
          </div>
          <div class="grid-3">
            ${accBals.map(a => `
              <div class="card">
                <div class="stat-card">
                  <div class="stat-header">
                    <span>${a.account.name}</span>
                    <div class="stat-icon" style="background:rgba(56,189,248,0.1);color:var(--accent-info)">
                      <i class="ph ph-${a.account.accountKind === 'bank' ? 'bank' : a.account.accountKind === 'upi' ? 'qr-code' : 'coins'}"></i>
                    </div>
                  </div>
                  <div class="stat-value ${a.balance >= 0 ? '' : 'text-danger'}">₹${fmt(a.balance)}</div>
                  <div class="text-xs text-muted">${a.account.accountKind?.toUpperCase() || 'CASH'}${a.account.accountNo ? ' • ' + a.account.accountNo : ''}</div>
                  ${a.account.type !== 'Asset' || a.account.id.startsWith('party_') ? '' : `
                    <div class="mt-2 text-right">
                       <button class="btn btn-sm btn-ghost text-xs del-acc" data-id="${a.account.id}" title="Delete Account"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button>
                    </div>
                  `}
                </div>
              </div>
            `).join('')}
          </div>
        `;
        el.querySelectorAll('.del-acc').forEach(btn => btn.addEventListener('click', e => {
             if(confirm('Delete this account?')) {
                 db.deleteAccount(e.currentTarget.dataset.id);
                 render();
             }
        }));
  };

  const renderCheques = (el) => {
    const cheques = [...db.data.cheques].reverse();
    el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Cheque Register</div></div>
            <div class="table-responsive">
              <table class="table">
                <thead><tr><th>Type</th><th>Cheque No</th><th>Date</th><th>Party</th><th>Bank</th><th class="text-right">Amount</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  ${cheques.map(ch => {
      let partyName = '-';
      if (ch.partyType === 'customer') { const cu = db.data.customers.find(c => c.id === ch.partyId); partyName = cu?.name || '-'; }
      else { const su = db.data.suppliers.find(s => s.id === ch.partyId); partyName = su?.name || '-'; }
      return `<tr>
                      <td><span class="badge badge-${ch.type === 'issued' ? 'danger' : 'success'}">${ch.type}</span></td>
                      <td class="font-medium">${ch.chequeNo}</td>
                      <td>${ch.date}</td><td>${partyName}</td><td>${ch.bankName || '-'}</td>
                      <td class="text-right font-bold">₹${fmt(ch.amount)}</td>
                      <td><span class="badge badge-${ch.status === 'cleared' ? 'success' : ch.status === 'bounced' ? 'danger' : 'warning'}">${ch.status}</span></td>
                      <td>${ch.status === 'pending' ? `
                        <button class="btn btn-sm btn-success cheque-clear" data-id="${ch.id}">Clear</button>
                        <button class="btn btn-sm btn-danger cheque-bounce" data-id="${ch.id}">Bounce</button>
                      ` : ''}</td>
                    </tr>`;
    }).join('')}
                  ${cheques.length === 0 ? '<tr><td colspan="8" class="text-center text-muted">No cheques</td></tr>' : ''}
                </tbody>
              </table>
            </div>
          </div>
        `;
    el.querySelectorAll('.cheque-clear').forEach(btn => btn.addEventListener('click', e => {
      db.updateChequeStatus(e.target.dataset.id, 'cleared'); render();
    }));
    el.querySelectorAll('.cheque-bounce').forEach(btn => btn.addEventListener('click', e => {
      db.updateChequeStatus(e.target.dataset.id, 'bounced'); render();
    }));
  };



  render();
  return c;
}
