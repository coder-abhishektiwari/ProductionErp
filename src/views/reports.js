import { db, fmt, formatDate } from '../store/db.js';

export default function ReportsView() {
    const c = document.createElement('div');
    c.className = 'animate-fade-in';
    let activeTab = 'tb';

    const render = () => {
        c.innerHTML = `
          <div class="tabs" style="flex-wrap:wrap">
            <div class="tab ${activeTab==='tb'?'active':''}" data-tab="tb">Trial Balance</div>
            <div class="tab ${activeTab==='pl'?'active':''}" data-tab="pl">Profit & Loss</div>
            <div class="tab ${activeTab==='bs'?'active':''}" data-tab="bs">Balance Sheet</div>
            <div class="tab ${activeTab==='ledger'?'active':''}" data-tab="ledger">Ledger</div>
            <div class="tab ${activeTab==='daybook'?'active':''}" data-tab="daybook">Day Book</div>
            <div class="tab ${activeTab==='expense'?'active':''}" data-tab="expense">Expense Report</div>
            <div class="tab ${activeTab==='loan'?'active':''}" data-tab="loan">Loan Report</div>
            <div class="tab ${activeTab==='outstanding'?'active':''}" data-tab="outstanding">Outstanding</div>
            <div class="tab ${activeTab==='returns'?'active':''}" data-tab="returns">Returns</div>
          </div>
          <div id="tab-content"></div>
        `;
        c.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { activeTab = t.dataset.tab; render(); }));
        const content = c.querySelector('#tab-content');
        const tabMap = { tb: renderTB, pl: renderPL, bs: renderBS, ledger: renderLedger, daybook: renderDayBook, expense: renderExpenseReport, loan: renderLoanReport, outstanding: renderOutstanding, returns: renderReturns };
        (tabMap[activeTab] || renderTB)(content);
    };

    // ══════════════════════════════════════
    // TRIAL BALANCE
    // ══════════════════════════════════════
    const renderTB = (el) => {
        const tb = db.getTrialBalance();
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Trial Balance</div>
              <div class="text-sm text-muted">As on ${formatDate()}</div></div>
            <div class="table-responsive">
              <table class="table">
                <thead><tr><th>Account</th><th>Group</th><th class="text-right">Debit (₹)</th><th class="text-right">Credit (₹)</th></tr></thead>
                <tbody>
                  ${tb.accounts.map(r => `<tr><td class="font-medium">${r.account.name}</td><td class="text-sm text-muted">${r.account.group}</td>
                    <td class="text-right">${r.dr > 0 ? '₹'+fmt(r.dr) : ''}</td><td class="text-right">${r.cr > 0 ? '₹'+fmt(r.cr) : ''}</td></tr>`).join('')}
                  ${tb.accounts.length===0?'<tr><td colspan="4" class="text-center text-muted">No transactions</td></tr>':''}
                </tbody>
                <tfoot><tr style="border-top:2px solid var(--border-color)">
                  <td colspan="2" class="text-right font-bold">Total</td>
                  <td class="text-right font-bold ${tb.totDr.toFixed(2)!==tb.totCr.toFixed(2)?'text-danger':'text-success'}">₹${fmt(tb.totDr)}</td>
                  <td class="text-right font-bold ${tb.totDr.toFixed(2)!==tb.totCr.toFixed(2)?'text-danger':'text-success'}">₹${fmt(tb.totCr)}</td>
                </tr></tfoot>
              </table>
            </div>
            ${tb.totDr.toFixed(2)===tb.totCr.toFixed(2) ? '<div class="text-success text-sm mt-2"><i class="ph ph-check-circle"></i> Trial Balance is balanced ✓</div>' : '<div class="text-danger text-sm mt-2"><i class="ph ph-warning"></i> Trial Balance NOT balanced — Difference: ₹'+fmt(Math.abs(tb.totDr-tb.totCr))+'</div>'}
          </div>
        `;
    };

    // ══════════════════════════════════════
    // PROFIT & LOSS
    // ══════════════════════════════════════
    const renderPL = (el) => {
        const pl = db.getProfitAndLoss();
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Profit & Loss Account</div>
              <div class="text-sm text-muted">For the period ending ${formatDate()}</div></div>
            <div class="grid-2" style="gap:2rem">
              <div>
                <h3 style="margin-bottom:0.75rem;border-bottom:1px solid var(--border-color);padding-bottom:0.5rem;color:var(--accent-danger)">Expenses (Dr)</h3>
                <table class="table"><tbody>
                  ${pl.expenses.map(e => `<tr><td>${e.name}</td><td class="text-right">₹${fmt(e.amount)}</td></tr>`).join('')}
                  ${pl.expenses.length===0?'<tr><td class="text-muted">No expenses</td></tr>':''}
                </tbody><tfoot><tr style="border-top:1px dashed var(--border-color)"><td class="font-bold">Total Expenses</td><td class="text-right font-bold">₹${fmt(pl.totalExpense)}</td></tr>
                  <tr><td class="font-bold ${pl.netProfit>=0?'text-success':'text-danger'}">${pl.netProfit>=0?'Net Profit':'Net Loss'}</td><td class="text-right font-bold ${pl.netProfit>=0?'text-success':'text-danger'}">₹${fmt(Math.abs(pl.netProfit))}</td></tr>
                </tfoot></table>
              </div>
              <div>
                <h3 style="margin-bottom:0.75rem;border-bottom:1px solid var(--border-color);padding-bottom:0.5rem;color:var(--accent-success)">Incomes (Cr)</h3>
                <table class="table"><tbody>
                  ${pl.incomes.map(i => `<tr><td>${i.name}</td><td class="text-right">₹${fmt(i.amount)}</td></tr>`).join('')}
                  ${pl.incomes.length===0?'<tr><td class="text-muted">No income</td></tr>':''}
                </tbody><tfoot><tr style="border-top:1px dashed var(--border-color)"><td class="font-bold">Total Income</td><td class="text-right font-bold">₹${fmt(pl.totalIncome)}</td></tr></tfoot></table>
              </div>
            </div>
          </div>
        `;
    };

    // ══════════════════════════════════════
    // BALANCE SHEET
    // ══════════════════════════════════════
    const renderBS = (el) => {
        const bs = db.getBalanceSheet();
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Balance Sheet</div>
              <div class="text-sm text-muted">As on ${formatDate()}</div></div>
            <div class="grid-2" style="gap:2rem">
              <div>
                <h3 style="margin-bottom:0.75rem;border-bottom:1px solid var(--border-color);padding-bottom:0.5rem">Liabilities & Capital</h3>
                <table class="table"><tbody>
                  ${bs.liabilities.items.map(i => `<tr><td>${i.name}</td><td class="text-right">₹${fmt(i.amount)}</td></tr>`).join('')}
                  ${bs.liabilities.items.length===0?'<tr><td class="text-muted">None</td></tr>':''}
                </tbody><tfoot><tr style="border-top:1px dashed var(--border-color)"><td class="font-bold">Total</td><td class="text-right font-bold">₹${fmt(bs.liabilities.total)}</td></tr></tfoot></table>
              </div>
              <div>
                <h3 style="margin-bottom:0.75rem;border-bottom:1px solid var(--border-color);padding-bottom:0.5rem">Assets</h3>
                <table class="table"><tbody>
                  ${bs.assets.items.map(i => `<tr><td>${i.name}</td><td class="text-right">₹${fmt(i.amount)}</td></tr>`).join('')}
                  ${bs.assets.items.length===0?'<tr><td class="text-muted">None</td></tr>':''}
                </tbody><tfoot><tr style="border-top:1px dashed var(--border-color)"><td class="font-bold">Total</td><td class="text-right font-bold">₹${fmt(bs.assets.total)}</td></tr></tfoot></table>
              </div>
            </div>
          </div>
        `;
    };

    // ══════════════════════════════════════
    // LEDGER
    // ══════════════════════════════════════
    const renderLedger = (el) => {
        const allAccounts = db.data.accounts;
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Account Ledger</div></div>
            <div class="form-group mb-4">
              <label class="form-label">Select Account</label>
              <select class="form-control" id="ledger-acc">
                <option value="">-- Select --</option>
                ${allAccounts.map(a => `<option value="${a.id}">${a.name} (${a.group})</option>`).join('')}
              </select>
            </div>
            <div id="ledger-entries"></div>
          </div>
        `;
        el.querySelector('#ledger-acc').addEventListener('change', e => {
            const entries = db.getLedgerEntries(e.target.value);
            const balance = db.getLedgerBalance(e.target.value);
            const entriesEl = el.querySelector('#ledger-entries');
            if (!e.target.value) { entriesEl.innerHTML = ''; return; }
            
            let runBal = 0;
            entriesEl.innerHTML = `
              <div class="table-responsive">
                <table class="table">
                  <thead><tr><th>Date</th><th>Vch No</th><th>Type</th><th>Narration</th><th class="text-right">Debit</th><th class="text-right">Credit</th><th class="text-right">Running Bal</th></tr></thead>
                  <tbody>
                    ${entries.map(e => {
                      runBal += e.drAmount - e.crAmount;
                      return `<tr><td>${e.voucher?.date||'-'}</td><td>${e.voucher?.voucherNo||'-'}</td>
                        <td><span class="badge badge-info">${e.voucher?.type||'-'}</span></td>
                        <td class="text-xs text-muted">${(e.voucher?.narration||'').substring(0,40)}</td>
                        <td class="text-right">${e.drAmount > 0 ? '₹'+fmt(e.drAmount) : ''}</td>
                        <td class="text-right">${e.crAmount > 0 ? '₹'+fmt(e.crAmount) : ''}</td>
                        <td class="text-right font-bold">${runBal >= 0 ? '₹'+fmt(runBal)+' Dr' : '₹'+fmt(Math.abs(runBal))+' Cr'}</td>
                      </tr>`;
                    }).join('')}
                    ${entries.length===0?'<tr><td colspan="7" class="text-center text-muted">No entries</td></tr>':''}
                  </tbody>
                  <tfoot><tr style="border-top:2px solid var(--border-color)">
                    <td colspan="6" class="text-right font-bold">Closing Balance</td>
                    <td class="text-right font-bold">${balance >= 0 ? '₹'+fmt(balance)+' Dr' : '₹'+fmt(Math.abs(balance))+' Cr'}</td>
                  </tr></tfoot>
                </table>
              </div>
            `;
        });
    };

    // ══════════════════════════════════════
    // DAY BOOK
    // ══════════════════════════════════════
    const renderDayBook = (el) => {
        const vouchers = [...db.data.vouchers].reverse();
        const getVoucherTypeBadge = (type) => {
            const colors = { 'Purchase': 'warning', 'Sales': 'success', 'Payment': 'danger', 'Receipt': 'info',
                'Debit Note': 'warning', 'Credit Note': 'info', 'Expense': 'danger', 'Journal': 'primary' };
            return colors[type] || 'info';
        };

        el.innerHTML = `
          <div class="card">
            <div class="section-header">
              <div class="section-title">Day Book — All Transactions (${vouchers.length})</div>
              <div class="text-sm text-muted">${vouchers.length} vouchers</div>
            </div>
            <div class="table-responsive" style="max-height:500px;overflow-y:auto">
              <table class="table">
                <thead style="position:sticky;top:0;background:var(--bg-card);z-index:1"><tr>
                  <th>Date</th><th>Vch#</th><th>Type</th><th>Narration</th><th class="text-right">Debit</th><th class="text-right">Credit</th>
                </tr></thead>
                <tbody>
                  ${vouchers.map(v => {
                    const details = db.data.voucherDetails.filter(d => d.voucherId === v.id);
                    const totalDr = details.reduce((s, d) => s + d.drAmount, 0);
                    const totalCr = details.reduce((s, d) => s + d.crAmount, 0);
                    return `<tr>
                      <td>${v.date}</td><td class="font-medium">${v.voucherNo}</td>
                      <td><span class="badge badge-${getVoucherTypeBadge(v.type)}">${v.type}</span></td>
                      <td class="text-sm">${(v.narration||'').substring(0, 50)}</td>
                      <td class="text-right">₹${fmt(totalDr)}</td>
                      <td class="text-right">₹${fmt(totalCr)}</td>
                    </tr>`;
                  }).join('')}
                  ${!vouchers.length ? '<tr><td colspan="6" class="text-center text-muted">No transactions</td></tr>' : ''}
                </tbody>
              </table>
            </div>
          </div>
        `;
    };

    // ══════════════════════════════════════
    // EXPENSE REPORT
    // ══════════════════════════════════════
    const renderExpenseReport = (el) => {
        const { byCategory, totalExpenses, expenses } = db.getExpenseSummary();
        const categories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
        const maxAmt = categories.length > 0 ? categories[0][1] : 1;

        // Monthly breakdown
        const monthly = {};
        expenses.forEach(exp => {
            const month = exp.date?.substring(0, 7) || 'N/A';
            if(!monthly[month]) monthly[month] = { total: 0, categories: {} };
            monthly[month].total += exp.amount;
            if(!monthly[month].categories[exp.category]) monthly[month].categories[exp.category] = 0;
            monthly[month].categories[exp.category] += exp.amount;
        });
        const months = Object.entries(monthly).sort((a,b) => a[0].localeCompare(b[0]));

        el.innerHTML = `
          <div class="grid-2 mb-4">
            <div class="card stat-card">
              <div class="stat-header"><span>Total Expenses</span><div class="stat-icon" style="color:var(--accent-danger);background:rgba(239,68,68,0.1)"><i class="ph ph-money"></i></div></div>
              <div class="stat-value" style="color:var(--accent-danger)">₹${fmt(totalExpenses)}</div>
              <div class="stat-trend text-muted">${expenses.length} expense entries</div>
            </div>
            <div class="card stat-card">
              <div class="stat-header"><span>Top Category</span></div>
              <div class="stat-value" style="font-size:1.1rem">${categories.length > 0 ? categories[0][0] : 'N/A'}</div>
              <div class="stat-trend text-muted">${categories.length > 0 ? '₹'+fmt(categories[0][1])+' ('+Math.round(categories[0][1]/totalExpenses*100)+'%)' : ''}</div>
            </div>
          </div>

          <div class="grid-2">
            <div class="card">
              <div class="section-header"><div class="section-title">Category Breakdown</div></div>
              ${categories.map(([cat, amt]) => {
                const pct = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
                const barPct = Math.round((amt / maxAmt) * 100);
                return `<div style="margin-bottom:1rem">
                  <div class="flex justify-between mb-1"><span class="font-medium text-sm">${cat}</span><span class="font-bold text-sm">₹${fmt(amt)} <span class="text-xs text-muted">(${pct}%)</span></span></div>
                  <div style="background:var(--bg-secondary);border-radius:4px;height:10px;overflow:hidden">
                    <div style="width:${barPct}%;height:100%;background:linear-gradient(90deg,var(--accent-info),var(--accent-primary));border-radius:4px;transition:width 0.5s"></div>
                  </div>
                </div>`;
              }).join('')}
              ${!categories.length ? '<p class="text-muted">No expenses to show</p>' : ''}
            </div>

            <div class="card">
              <div class="section-header"><div class="section-title">Monthly Summary</div></div>
              ${months.length > 0 ? `<table class="table"><thead><tr><th>Month</th><th class="text-right">Amount</th><th>Breakdown</th></tr></thead><tbody>
                ${months.map(([m, data]) => `<tr>
                  <td class="font-medium">${m}</td>
                  <td class="text-right font-bold">₹${fmt(data.total)}</td>
                  <td class="text-xs text-muted">${Object.entries(data.categories).map(([c,a]) => c+': ₹'+fmt(a)).join(' • ')}</td>
                </tr>`).join('')}
              </tbody></table>` : '<p class="text-muted">No data</p>'}
            </div>
          </div>

          <div class="card mt-4">
            <div class="section-header"><div class="section-title">Expense Ledger (All Entries)</div></div>
            <div class="table-responsive" style="max-height:300px;overflow-y:auto">
              <table class="table"><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Paid From</th><th class="text-right">Amount</th></tr></thead>
              <tbody>${expenses.map(exp => {
                const payAcc = db.data.accounts.find(a => a.id === exp.paidFrom);
                return `<tr><td>${exp.date}</td><td><span class="badge badge-info">${exp.category}</span></td>
                  <td class="text-sm">${exp.description||'-'} ${exp.recurring?'<span class="badge badge-warning" style="font-size:0.55rem">Recurring</span>':''}</td>
                  <td class="text-sm">${payAcc?.name||'-'}</td>
                  <td class="text-right font-bold">₹${fmt(exp.amount)}</td></tr>`;
              }).join('')}
              ${!expenses.length?'<tr><td colspan="5" class="text-center text-muted">No expenses</td></tr>':''}
              </tbody></table>
            </div>
          </div>
        `;
    };

    // ══════════════════════════════════════
    // LOAN REPORT
    // ══════════════════════════════════════
    const renderLoanReport = (el) => {
        const { active, closed, totalTaken, totalGiven, all } = db.getLoanSummary();
        const takenLoans = all.filter(l => l.type === 'taken');
        const givenLoans = all.filter(l => l.type === 'given');
        
        const totalTakenOutstanding = takenLoans.filter(l => l.status === 'active').reduce((s, l) => s + Math.max(0, l.principalAmount - l.emis.reduce((ss, e) => ss + e.principalComponent, 0)), 0);
        const totalGivenOutstanding = givenLoans.filter(l => l.status === 'active').reduce((s, l) => s + Math.max(0, l.principalAmount - l.emis.reduce((ss, e) => ss + e.principalComponent, 0)), 0);
        const totalInterestPaid = takenLoans.reduce((s, l) => s + l.emis.reduce((ss, e) => ss + e.interestComponent, 0), 0);
        const totalInterestReceived = givenLoans.reduce((s, l) => s + l.emis.reduce((ss, e) => ss + e.interestComponent, 0), 0);

        el.innerHTML = `
          <div class="grid-4 mb-4">
            <div class="card stat-card"><div class="stat-header"><span>Borrowed</span></div><div class="stat-value text-danger">₹${fmt(totalTaken)}</div><div class="text-xs text-muted">Outstanding: ₹${fmt(totalTakenOutstanding)}</div></div>
            <div class="card stat-card"><div class="stat-header"><span>Given</span></div><div class="stat-value text-success">₹${fmt(totalGiven)}</div><div class="text-xs text-muted">Outstanding: ₹${fmt(totalGivenOutstanding)}</div></div>
            <div class="card stat-card"><div class="stat-header"><span>Interest Paid</span></div><div class="stat-value text-warning">₹${fmt(totalInterestPaid)}</div></div>
            <div class="card stat-card"><div class="stat-header"><span>Interest Received</span></div><div class="stat-value text-info">₹${fmt(totalInterestReceived)}</div></div>
          </div>

          <div class="card mb-4">
            <div class="section-header"><div class="section-title">Loan Schedule — Borrowed (${takenLoans.length})</div></div>
            ${takenLoans.length === 0 ? '<p class="text-muted">No borrowed loans</p>' : `
            <div class="table-responsive"><table class="table">
              <thead><tr><th>Party</th><th class="text-right">Principal</th><th>Rate</th><th>Tenure</th><th class="text-right">EMI</th><th class="text-right">Paid</th><th class="text-right">Outstanding</th><th>Status</th></tr></thead>
              <tbody>${takenLoans.map(l => {
                const outstanding = Math.max(0, l.principalAmount - l.emis.reduce((s, e) => s + e.principalComponent, 0));
                return `<tr><td class="font-medium">${l.partyName}</td><td class="text-right">₹${fmt(l.principalAmount)}</td>
                  <td>${l.interestRate}%</td><td>${l.tenureMonths}mo</td>
                  <td class="text-right">₹${fmt(l.emiAmount)}</td>
                  <td class="text-right text-success">₹${fmt(l.totalPaid)}</td>
                  <td class="text-right font-bold text-danger">₹${fmt(outstanding)}</td>
                  <td><span class="badge badge-${l.status==='active'?'warning':'success'}">${l.status}</span></td></tr>`;
              }).join('')}</tbody>
            </table></div>`}
          </div>

          <div class="card mb-4">
            <div class="section-header"><div class="section-title">Loan Schedule — Given / Advances (${givenLoans.length})</div></div>
            ${givenLoans.length === 0 ? '<p class="text-muted">No given loans/advances</p>' : `
            <div class="table-responsive"><table class="table">
              <thead><tr><th>Party</th><th class="text-right">Principal</th><th>Rate</th><th>Tenure</th><th class="text-right">EMI</th><th class="text-right">Received</th><th class="text-right">Outstanding</th><th>Status</th></tr></thead>
              <tbody>${givenLoans.map(l => {
                const outstanding = Math.max(0, l.principalAmount - l.emis.reduce((s, e) => s + e.principalComponent, 0));
                return `<tr><td class="font-medium">${l.partyName}</td><td class="text-right">₹${fmt(l.principalAmount)}</td>
                  <td>${l.interestRate}%</td><td>${l.tenureMonths}mo</td>
                  <td class="text-right">₹${fmt(l.emiAmount)}</td>
                  <td class="text-right text-success">₹${fmt(l.totalPaid)}</td>
                  <td class="text-right font-bold text-warning">₹${fmt(outstanding)}</td>
                  <td><span class="badge badge-${l.status==='active'?'warning':'success'}">${l.status}</span></td></tr>`;
              }).join('')}</tbody>
            </table></div>`}
          </div>

          ${all.length > 0 ? `
          <div class="card">
            <div class="section-header"><div class="section-title">EMI Payment History</div></div>
            <div class="table-responsive" style="max-height:300px;overflow-y:auto"><table class="table">
              <thead><tr><th>Date</th><th>Loan</th><th>Type</th><th class="text-right">Principal</th><th class="text-right">Interest</th><th class="text-right">Total EMI</th></tr></thead>
              <tbody>${all.flatMap(l => l.emis.map(e => ({...e, partyName: l.partyName, loanType: l.type})))
                .sort((a,b) => (a.date||'').localeCompare(b.date||''))
                .map(e => `<tr><td>${e.date}</td><td class="font-medium">${e.partyName}</td>
                  <td><span class="badge badge-${e.loanType==='taken'?'danger':'success'}">${e.loanType==='taken'?'Paid':'Received'}</span></td>
                  <td class="text-right">₹${fmt(e.principalComponent)}</td>
                  <td class="text-right text-muted">₹${fmt(e.interestComponent)}</td>
                  <td class="text-right font-bold">₹${fmt(e.totalAmount)}</td></tr>`).join('')}
              ${all.every(l => l.emis.length===0)?'<tr><td colspan="6" class="text-center text-muted">No EMI payments recorded</td></tr>':''}
              </tbody>
            </table></div>
          </div>` : ''}
        `;
    };

    // ══════════════════════════════════════
    // OUTSTANDING REPORT
    // ══════════════════════════════════════
    const renderOutstanding = (el) => {
        const receivables = db.getOutstandingReceivables();
        const payables = db.getOutstandingPayables();
        const totalReceivable = receivables.reduce((s, r) => s + r.amount, 0);
        const totalPayable = payables.reduce((s, r) => s + r.amount, 0);

        el.innerHTML = `
          <div class="grid-2 mb-4">
            <div class="card stat-card"><div class="stat-header"><span>Total Receivable</span><div class="stat-icon" style="color:var(--accent-success);background:rgba(34,197,94,0.1)"><i class="ph ph-arrow-down-left"></i></div></div>
              <div class="stat-value text-success">₹${fmt(totalReceivable)}</div>
              <div class="stat-trend text-muted">${receivables.length} parties</div></div>
            <div class="card stat-card"><div class="stat-header"><span>Total Payable</span><div class="stat-icon" style="color:var(--accent-danger);background:rgba(239,68,68,0.1)"><i class="ph ph-arrow-up-right"></i></div></div>
              <div class="stat-value text-danger">₹${fmt(totalPayable)}</div>
              <div class="stat-trend text-muted">${payables.length} parties</div></div>
          </div>

          <div class="grid-2">
            <div class="card">
              <div class="section-header"><div class="section-title">Receivable from Customers (${receivables.length})</div></div>
              <table class="table"><thead><tr><th>Customer</th><th>GSTIN</th><th class="text-right">Amount Due</th></tr></thead>
              <tbody>${receivables.map(r => `<tr><td class="font-medium">${r.party.name}</td><td class="text-sm text-muted">${r.party.gstin||'-'}</td><td class="text-right font-bold text-success">₹${fmt(r.amount)}</td></tr>`).join('')}
              ${!receivables.length?'<tr><td colspan="3" class="text-center text-muted">No outstanding receivables</td></tr>':''}
              </tbody>
              <tfoot><tr style="border-top:2px solid var(--border-color)"><td colspan="2" class="font-bold">Total</td><td class="text-right font-bold text-success">₹${fmt(totalReceivable)}</td></tr></tfoot>
              </table>
            </div>

            <div class="card">
              <div class="section-header"><div class="section-title">Payable to Suppliers (${payables.length})</div></div>
              <table class="table"><thead><tr><th>Supplier</th><th>GSTIN</th><th class="text-right">Amount Due</th></tr></thead>
              <tbody>${payables.map(r => `<tr><td class="font-medium">${r.party.name}</td><td class="text-sm text-muted">${r.party.gstin||'-'}</td><td class="text-right font-bold text-danger">₹${fmt(r.amount)}</td></tr>`).join('')}
              ${!payables.length?'<tr><td colspan="3" class="text-center text-muted">No outstanding payables</td></tr>':''}
              </tbody>
              <tfoot><tr style="border-top:2px solid var(--border-color)"><td colspan="2" class="font-bold">Total</td><td class="text-right font-bold text-danger">₹${fmt(totalPayable)}</td></tr></tfoot>
              </table>
            </div>
          </div>
        `;
    };

    // ══════════════════════════════════════
    // RETURNS REPORT (Purchase + Sales)
    // ══════════════════════════════════════
    const renderReturns = (el) => {
        const purchaseReturns = [...db.data.purchaseReturns].reverse();
        const salesReturns = [...db.data.salesReturns].reverse();
        const totalPR = purchaseReturns.reduce((s, r) => s + r.grandTotal, 0);
        const totalSR = salesReturns.reduce((s, r) => s + r.grandTotal, 0);

        el.innerHTML = `
          <div class="grid-2 mb-4">
            <div class="card stat-card"><div class="stat-header"><span>Purchase Returns (Debit Notes)</span></div>
              <div class="stat-value text-warning">₹${fmt(totalPR)}</div>
              <div class="stat-trend text-muted">${purchaseReturns.length} debit notes</div></div>
            <div class="card stat-card"><div class="stat-header"><span>Sales Returns (Credit Notes)</span></div>
              <div class="stat-value text-info">₹${fmt(totalSR)}</div>
              <div class="stat-trend text-muted">${salesReturns.length} credit notes</div></div>
          </div>

          <div class="card mb-4">
            <div class="section-header"><div class="section-title">Purchase Returns — Debit Notes (${purchaseReturns.length})</div></div>
            <div class="table-responsive"><table class="table">
              <thead><tr><th>Date</th><th>DN#</th><th>Supplier</th><th>Original Inv</th><th>Reason</th><th class="text-right">Amount</th></tr></thead>
              <tbody>${purchaseReturns.map(r => {
                const sup = db.data.suppliers.find(s => s.id === r.supplierId);
                return `<tr><td>${r.date}</td><td class="font-medium">${r.debitNoteNo}</td><td>${sup?.name||'N/A'}</td>
                  <td class="text-sm">${r.originalInvoiceNo||'-'}</td><td class="text-sm text-muted">${r.reason||'-'}</td>
                  <td class="text-right font-bold">₹${fmt(r.grandTotal)}</td></tr>`;
              }).join('')}
              ${!purchaseReturns.length?'<tr><td colspan="6" class="text-center text-muted">No purchase returns</td></tr>':''}
              </tbody>
              ${purchaseReturns.length > 0 ? `<tfoot><tr style="border-top:2px solid var(--border-color)"><td colspan="5" class="text-right font-bold">Total</td><td class="text-right font-bold text-warning">₹${fmt(totalPR)}</td></tr></tfoot>` : ''}
            </table></div>
          </div>

          <div class="card">
            <div class="section-header"><div class="section-title">Sales Returns — Credit Notes (${salesReturns.length})</div></div>
            <div class="table-responsive"><table class="table">
              <thead><tr><th>Date</th><th>CN#</th><th>Customer</th><th>Against Inv</th><th>Reason</th><th class="text-right">Amount</th></tr></thead>
              <tbody>${salesReturns.map(r => {
                const cust = db.data.customers.find(cu => cu.id === r.customerId);
                return `<tr><td>${r.date}</td><td class="font-medium">${r.creditNoteNo}</td><td>${cust?.name||'N/A'}</td>
                  <td class="text-sm">${r.originalInvoiceNo||'-'}</td><td class="text-sm text-muted">${r.reason||'-'}</td>
                  <td class="text-right font-bold">₹${fmt(r.grandTotal)}</td></tr>`;
              }).join('')}
              ${!salesReturns.length?'<tr><td colspan="6" class="text-center text-muted">No sales returns</td></tr>':''}
              </tbody>
              ${salesReturns.length > 0 ? `<tfoot><tr style="border-top:2px solid var(--border-color)"><td colspan="5" class="text-right font-bold">Total</td><td class="text-right font-bold text-info">₹${fmt(totalSR)}</td></tr></tfoot>` : ''}
            </table></div>
          </div>
        `;
    };

    render();
    return c;
}
