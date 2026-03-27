import { db, formatDate, fmt } from '../store/db.js';

export default function LoansView() {
    const c = document.createElement('div');
    c.className = 'animate-fade-in';
    let activeTab = 'new';
    let selectedLoanId = null;

    const render = () => {
        c.innerHTML = `
          <div class="tabs">
            <div class="tab ${activeTab==='new'?'active':''}" data-tab="new">New Loan</div>
            <div class="tab ${activeTab==='active'?'active':''}" data-tab="active">Active Loans</div>
            <div class="tab ${activeTab==='emi'?'active':''}" data-tab="emi">Record EMI</div>
            <div class="tab ${activeTab==='closed'?'active':''}" data-tab="closed">Closed Loans</div>
          </div>
          <div id="tab-content"></div>
        `;
        c.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { activeTab = t.dataset.tab; render(); }));
        const content = c.querySelector('#tab-content');
        if (activeTab === 'new') renderNew(content);
        else if (activeTab === 'active') renderActive(content);
        else if (activeTab === 'emi') renderEMI(content);
        else renderClosed(content);
    };

    const renderNew = (el) => {
        const payAccounts = db.data.accounts.filter(a => a.accountKind === 'cash' || a.accountKind === 'bank' || a.accountKind === 'upi');
        el.innerHTML = `
          <div class="card" style="max-width:700px">
            <div class="section-header"><div class="section-title">Create New Loan</div></div>

            <div class="grid-2 mb-4">
              <div class="form-group"><label class="form-label">Loan Type</label>
                <select class="form-control" id="ln-type">
                  <option value="taken">Loan Taken (Liability)</option>
                  <option value="given">Loan Given (Asset)</option>
                </select></div>
              <div class="form-group"><label class="form-label">Party Name</label>
                <input class="form-control" id="ln-party" placeholder="E.g., HDFC Bank / Ramesh (worker)"></div>
            </div>

            <div class="grid-3 mb-4">
              <div class="form-group"><label class="form-label">Principal Amount (₹)</label>
                <input type="number" class="form-control" id="ln-amount" placeholder="500000"></div>
              <div class="form-group"><label class="form-label">Interest Rate (% p.a.)</label>
                <input type="number" class="form-control" id="ln-rate" placeholder="12" step="0.1"></div>
              <div class="form-group"><label class="form-label">Tenure (Months)</label>
                <input type="number" class="form-control" id="ln-tenure" placeholder="24"></div>
            </div>

            <div class="grid-2 mb-4">
              <div class="form-group"><label class="form-label">Start Date</label>
                <input type="date" class="form-control" id="ln-start" value="${formatDate()}"></div>
              <div class="form-group"><label class="form-label" id="ln-acc-label">Receive Into Account</label>
                <select class="form-control" id="ln-account">
                  ${payAccounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                </select></div>
            </div>

            <div class="form-group mb-4"><label class="form-label">Description / Loan Ref</label>
              <input class="form-control" id="ln-desc" placeholder="E.g., Term Loan for machinery / Advance to worker"></div>

            <div id="ln-emi-calc" class="panel mb-4"></div>

            <div class="flex justify-end">
              <button class="btn btn-primary" id="btn-save-loan"><i class="ph ph-floppy-disk"></i> Save Loan</button>
            </div>
          </div>
        `;

        // Switch label based on type
        el.querySelector('#ln-type').addEventListener('change', e => {
            el.querySelector('#ln-acc-label').textContent = e.target.value === 'taken' ? 'Receive Into Account' : 'Pay From Account';
        });

        // EMI calculator
        const calcEMI = () => {
            const P = Number(el.querySelector('#ln-amount').value) || 0;
            const R = Number(el.querySelector('#ln-rate').value) || 0;
            const N = Number(el.querySelector('#ln-tenure').value) || 0;
            if(P > 0 && N > 0) {
                const r = R / 12 / 100;
                let emi = 0;
                if(r > 0) { emi = Math.round((P * r * Math.pow(1+r, N)) / (Math.pow(1+r, N) - 1)); }
                else { emi = Math.round(P / N); }
                const totalAmt = emi * N;
                const totalInterest = totalAmt - P;
                el.querySelector('#ln-emi-calc').innerHTML = `
                  <div class="panel-title"><i class="ph ph-calculator"></i> EMI Calculation</div>
                  <div class="grid-3">
                    <div><div class="text-xs text-muted">Monthly EMI</div><div class="font-bold" style="font-size:1.3rem;color:var(--accent-primary)">₹${fmt(emi)}</div></div>
                    <div><div class="text-xs text-muted">Total Interest</div><div class="font-bold" style="color:var(--accent-warning)">₹${fmt(totalInterest)}</div></div>
                    <div><div class="text-xs text-muted">Total Payment</div><div class="font-bold">₹${fmt(totalAmt)}</div></div>
                  </div>
                `;
            }
        };
        ['#ln-amount', '#ln-rate', '#ln-tenure'].forEach(sel => el.querySelector(sel).addEventListener('input', calcEMI));

        el.querySelector('#btn-save-loan').addEventListener('click', () => {
            const principalAmount = Number(el.querySelector('#ln-amount').value);
            const partyName = el.querySelector('#ln-party').value.trim();
            if(!partyName) { alert('Enter party name'); return; }
            if(!principalAmount || principalAmount <= 0) { alert('Enter valid amount'); return; }
            const type = el.querySelector('#ln-type').value;
            db.addLoan({
                type, partyName, principalAmount,
                interestRate: Number(el.querySelector('#ln-rate').value) || 0,
                tenureMonths: Number(el.querySelector('#ln-tenure').value) || 12,
                startDate: el.querySelector('#ln-start').value,
                [type === 'taken' ? 'receiveInto' : 'paidFrom']: el.querySelector('#ln-account').value,
                description: el.querySelector('#ln-desc').value
            });
            alert('Loan Created!'); render();
        });
    };

    const renderLoanCard = (loan, showActions = true) => {
        const paid = loan.totalPaid;
        const totalDue = loan.emiAmount * loan.tenureMonths;
        const paidPct = totalDue > 0 ? Math.min(100, Math.round((paid / totalDue) * 100)) : 0;
        const outstanding = Math.max(0, loan.principalAmount - loan.emis.reduce((s, e) => s + e.principalComponent, 0));

        return `<div class="panel mb-4">
          <div class="flex justify-between items-center mb-2">
            <div>
              <span class="font-bold" style="font-size:1.05rem">${loan.partyName}</span>
              <span class="badge badge-${loan.type==='taken'?'danger':'success'} ml-2">${loan.type === 'taken' ? 'Borrowed' : 'Given'}</span>
              <span class="badge badge-${loan.status==='active'?'info':'success'} ml-2">${loan.status}</span>
            </div>
            ${showActions ? `<div class="flex" style="gap:0.4rem">
              <button class="btn btn-sm btn-info pay-emi-btn" data-id="${loan.id}"><i class="ph ph-currency-inr"></i> ${loan.type==='taken'?'Pay':'Receive'} EMI</button>
              <button class="btn btn-sm btn-ghost del-loan" data-id="${loan.id}"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button>
            </div>` : ''}
          </div>
          <div class="text-sm text-muted mb-3">${loan.description || ''} • Started: ${loan.startDate} • ${loan.interestRate}% p.a. • ${loan.tenureMonths} months</div>
          <div class="grid-4 mb-3">
            <div><div class="text-xs text-muted">Principal</div><div class="font-bold">₹${fmt(loan.principalAmount)}</div></div>
            <div><div class="text-xs text-muted">EMI</div><div class="font-bold">₹${fmt(loan.emiAmount)}/mo</div></div>
            <div><div class="text-xs text-muted">Total Paid</div><div class="font-bold text-success">₹${fmt(paid)}</div></div>
            <div><div class="text-xs text-muted">Outstanding</div><div class="font-bold text-danger">₹${fmt(outstanding)}</div></div>
          </div>
          <div style="background:var(--bg-secondary);border-radius:6px;height:10px;overflow:hidden;margin-bottom:0.5rem">
            <div style="width:${paidPct}%;height:100%;background:linear-gradient(90deg,var(--accent-success),var(--accent-info));border-radius:6px;transition:width 0.5s"></div>
          </div>
          <div class="text-xs text-center text-muted">${paidPct}% paid — ${loan.emis.length} EMIs recorded</div>
          ${loan.emis.length > 0 ? `
          <details style="margin-top:0.5rem"><summary class="text-sm" style="cursor:pointer;color:var(--accent-info)">View EMI History (${loan.emis.length})</summary>
            <table class="table" style="margin-top:0.5rem"><thead><tr><th>Date</th><th class="text-right">Principal</th><th class="text-right">Interest</th><th class="text-right">Total</th></tr></thead>
            <tbody>${loan.emis.map(e => `<tr><td>${e.date}</td><td class="text-right">₹${fmt(e.principalComponent)}</td><td class="text-right text-muted">₹${fmt(e.interestComponent)}</td><td class="text-right font-bold">₹${fmt(e.totalAmount)}</td></tr>`).join('')}</tbody></table>
          </details>` : ''}
        </div>`;
    };

    const renderActive = (el) => {
        const { active } = db.getLoanSummary();
        const taken = active.filter(l => l.type === 'taken');
        const given = active.filter(l => l.type === 'given');
        const totalTakenOutstanding = taken.reduce((s, l) => s + Math.max(0, l.principalAmount - l.emis.reduce((ss, e) => ss + e.principalComponent, 0)), 0);
        const totalGivenOutstanding = given.reduce((s, l) => s + Math.max(0, l.principalAmount - l.emis.reduce((ss, e) => ss + e.principalComponent, 0)), 0);

        el.innerHTML = `
          <div class="grid-2 mb-4">
            <div class="card stat-card"><div class="stat-header"><span>Total Borrowed (Outstanding)</span></div><div class="stat-value text-danger">₹${fmt(totalTakenOutstanding)}</div><div class="text-xs text-muted">${taken.length} active loans</div></div>
            <div class="card stat-card"><div class="stat-header"><span>Total Given (Outstanding)</span></div><div class="stat-value text-success">₹${fmt(totalGivenOutstanding)}</div><div class="text-xs text-muted">${given.length} active advances</div></div>
          </div>
          <div class="card">
            <div class="section-header"><div class="section-title">Active Loans (${active.length})</div></div>
            ${active.length === 0 ? '<p class="text-muted">No active loans</p>' :
              active.map(l => renderLoanCard(l, true)).join('')}
          </div>
        `;
        el.querySelectorAll('.pay-emi-btn').forEach(btn => btn.addEventListener('click', e => {
            selectedLoanId = e.currentTarget.dataset.id; activeTab = 'emi'; render();
        }));
        el.querySelectorAll('.del-loan').forEach(btn => btn.addEventListener('click', e => {
            if(confirm('Delete this loan and all its EMI records?')) { db.deleteLoan(e.currentTarget.dataset.id); render(); }
        }));
    };

    const renderEMI = (el) => {
        const activeLoans = db.data.loans.filter(l => l.status === 'active');
        const payAccounts = db.data.accounts.filter(a => a.accountKind === 'cash' || a.accountKind === 'bank' || a.accountKind === 'upi');
        const selected = selectedLoanId ? activeLoans.find(l => l.id === selectedLoanId) : null;

        el.innerHTML = `
          <div class="card" style="max-width:700px">
            <div class="section-header"><div class="section-title">Record EMI Payment / Receipt</div></div>
            ${activeLoans.length === 0 ? '<p class="text-muted">No active loans. Create a loan first.</p>' : `
            <div class="grid-2 mb-4">
              <div class="form-group"><label class="form-label">Select Loan</label>
                <select class="form-control" id="emi-loan">
                  <option value="">-- Select Loan --</option>
                  ${activeLoans.map(l => `<option value="${l.id}" ${selectedLoanId===l.id?'selected':''}>${l.partyName} — ₹${fmt(l.principalAmount)} (${l.type})</option>`).join('')}
                </select></div>
              <div class="form-group"><label class="form-label">Date</label>
                <input type="date" class="form-control" id="emi-date" value="${formatDate()}"></div>
            </div>

            ${selected ? `
            <div class="panel mb-4">
              <div class="text-sm text-muted">Suggested EMI: <span class="font-bold">₹${fmt(selected.emiAmount)}</span> — Paid so far: <span class="font-bold text-success">₹${fmt(selected.totalPaid)}</span> — ${selected.emis.length} EMIs done</div>
            </div>` : ''}

            <div class="grid-3 mb-4">
              <div class="form-group"><label class="form-label">Principal Component (₹)</label>
                <input type="number" class="form-control" id="emi-principal" value="${selected ? Math.round(selected.emiAmount * 0.7) : ''}" placeholder="0"></div>
              <div class="form-group"><label class="form-label">Interest Component (₹)</label>
                <input type="number" class="form-control" id="emi-interest" value="${selected ? Math.round(selected.emiAmount * 0.3) : ''}" placeholder="0"></div>
              <div class="form-group"><label class="form-label">${selected?.type === 'given' ? 'Received In' : 'Paid From'}</label>
                <select class="form-control" id="emi-account">
                  ${payAccounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                </select></div>
            </div>

            <div class="flex justify-end">
              <button class="btn btn-primary" id="btn-save-emi"><i class="ph ph-check"></i> Record EMI</button>
            </div>
            `}
          </div>
        `;

        if(el.querySelector('#emi-loan')) {
            el.querySelector('#emi-loan').addEventListener('change', e => { selectedLoanId = e.target.value; render(); });
        }

        if(el.querySelector('#btn-save-emi')) {
            el.querySelector('#btn-save-emi').addEventListener('click', () => {
                const loanId = el.querySelector('#emi-loan').value;
                if(!loanId) { alert('Select a loan'); return; }
                const principal = Number(el.querySelector('#emi-principal').value) || 0;
                const interest = Number(el.querySelector('#emi-interest').value) || 0;
                if(principal + interest <= 0) { alert('Enter valid EMI components'); return; }
                const loan = db.data.loans.find(l => l.id === loanId);
                const accKey = loan?.type === 'given' ? 'receivedIn' : 'paidFrom';
                db.addLoanEMI(loanId, {
                    date: el.querySelector('#emi-date').value,
                    principalComponent: principal, interestComponent: interest,
                    [accKey]: el.querySelector('#emi-account').value
                });
                alert('EMI Recorded!'); render();
            });
        }
    };

    const renderClosed = (el) => {
        const { closed } = db.getLoanSummary();
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Closed Loans (${closed.length})</div></div>
            ${closed.length === 0 ? '<p class="text-muted">No closed loans</p>' :
              closed.map(l => renderLoanCard(l, false)).join('')}
          </div>
        `;
    };

    render(); return c;
}
