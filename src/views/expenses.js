import { db, formatDate, fmt } from '../store/db.js';

export default function ExpensesView() {
    const c = document.createElement('div');
    c.className = 'animate-fade-in';
    let activeTab = 'entry';

    const render = () => {
        c.innerHTML = `
          <div class="tabs">
            <div class="tab ${activeTab==='entry'?'active':''}" data-tab="entry">New Expense</div>
            <div class="tab ${activeTab==='list'?'active':''}" data-tab="list">Expense List</div>
            <div class="tab ${activeTab==='summary'?'active':''}" data-tab="summary">Category Summary</div>
          </div>
          <div id="tab-content"></div>
        `;
        c.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { activeTab = t.dataset.tab; render(); }));
        const content = c.querySelector('#tab-content');
        if (activeTab === 'entry') renderEntry(content);
        else if (activeTab === 'list') renderList(content);
        else renderSummary(content);
    };

    const renderEntry = (el) => {
        const expenseAccounts = db.data.accounts.filter(a => a.group === 'Indirect Expenses' || a.group === 'Direct Expenses');
        const payAccounts = db.data.accounts.filter(a => a.accountKind === 'cash' || a.accountKind === 'bank' || a.accountKind === 'upi');

        el.innerHTML = `
          <div class="card" style="max-width:700px">
            <div class="section-header"><div class="section-title">Record Expense</div></div>

            <div class="grid-2 mb-4">
              <div class="form-group"><label class="form-label">Expense Category</label>
                <select class="form-control" id="exp-category">
                  <option value="">-- Select Category --</option>
                  ${expenseAccounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                </select></div>
              <div class="form-group"><label class="form-label">Date</label>
                <input type="date" class="form-control" id="exp-date" value="${formatDate()}"></div>
            </div>

            <div class="grid-2 mb-4">
              <div class="form-group"><label class="form-label">Amount (₹)</label>
                <input type="number" class="form-control" id="exp-amount" placeholder="Enter amount" style="font-size:1.2rem"></div>
              <div class="form-group"><label class="form-label">Paid From</label>
                <select class="form-control" id="exp-paid-from">
                  ${payAccounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                </select></div>
            </div>

            <div class="form-group mb-4"><label class="form-label">Description / Bill Ref</label>
              <input class="form-control" id="exp-desc" placeholder="E.g., March electricity bill / Rent for March 2026 / Salary to workers"></div>

            <div class="flex justify-between items-center">
              <label class="flex items-center" style="gap:0.5rem;cursor:pointer">
                <input type="checkbox" id="exp-recurring"> <span class="text-sm">Recurring Expense</span>
              </label>
              <button class="btn btn-primary" id="btn-save-exp"><i class="ph ph-floppy-disk"></i> Save Expense</button>
            </div>
          </div>

          <div class="card mt-4" style="max-width:700px">
            <div class="section-header"><div class="section-title">Quick Expense Buttons</div></div>
            <div class="flex" style="gap:0.5rem;flex-wrap:wrap">
              ${expenseAccounts.map(a => `<button class="btn btn-sm btn-secondary quick-exp" data-id="${a.id}">${a.name}</button>`).join('')}
            </div>
          </div>
        `;

        // Quick expense buttons auto-select category
        el.querySelectorAll('.quick-exp').forEach(btn => btn.addEventListener('click', e => {
            el.querySelector('#exp-category').value = e.currentTarget.dataset.id;
            el.querySelector('#exp-amount').focus();
        }));

        el.querySelector('#btn-save-exp').addEventListener('click', () => {
            const expenseAccountId = el.querySelector('#exp-category').value;
            const amount = Number(el.querySelector('#exp-amount').value);
            if(!expenseAccountId) { alert('Select expense category'); return; }
            if(!amount || amount <= 0) { alert('Enter valid amount'); return; }

            db.addExpense({
                expenseAccountId, amount,
                date: el.querySelector('#exp-date').value,
                paidFrom: el.querySelector('#exp-paid-from').value,
                description: el.querySelector('#exp-desc').value,
                recurring: el.querySelector('#exp-recurring').checked
            });
            alert('Expense Saved!'); render();
        });
    };

    const renderList = (el) => {
        const { expenses } = db.getExpenseSummary();
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">All Expenses (${expenses.length})</div></div>
            <div class="table-responsive"><table class="table">
              <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Paid From</th><th class="text-right">Amount</th><th>Action</th></tr></thead>
              <tbody>
                ${expenses.map(exp => {
                  const payAcc = db.data.accounts.find(a => a.id === exp.paidFrom);
                  return `<tr>
                    <td>${exp.date}</td>
                    <td><span class="badge badge-info">${exp.category}</span></td>
                    <td class="text-sm">${exp.description || '-'} ${exp.recurring ? '<span class="badge badge-warning" style="font-size:0.6rem">Recurring</span>' : ''}</td>
                    <td class="text-sm">${payAcc?.name || '-'}</td>
                    <td class="text-right font-bold">₹${fmt(exp.amount)}</td>
                    <td><button class="btn btn-sm btn-ghost del-exp" data-id="${exp.id}"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button></td>
                  </tr>`;
                }).join('')}
                ${!expenses.length ? '<tr><td colspan="6" class="text-center text-muted">No expenses recorded</td></tr>' : ''}
              </tbody>
            </table></div>
          </div>
        `;
        el.querySelectorAll('.del-exp').forEach(btn => btn.addEventListener('click', e => {
            if(confirm('Delete this expense?')) { db.deleteExpense(e.currentTarget.dataset.id); render(); }
        }));
    };

    const renderSummary = (el) => {
        const { byCategory, totalExpenses } = db.getExpenseSummary();
        const categories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
        const maxAmt = categories.length > 0 ? categories[0][1] : 1;

        el.innerHTML = `
          <div class="grid-2">
            <div class="card">
              <div class="section-header"><div class="section-title">Expenses by Category</div></div>
              <div class="stat-value mb-4" style="color:var(--accent-danger)">₹${fmt(totalExpenses)}</div>
              ${categories.map(([cat, amt]) => {
                const pct = Math.round((amt / totalExpenses) * 100);
                const barPct = Math.round((amt / maxAmt) * 100);
                return `<div style="margin-bottom:1rem">
                  <div class="flex justify-between mb-1"><span class="font-medium">${cat}</span><span class="font-bold">₹${fmt(amt)} <span class="text-xs text-muted">(${pct}%)</span></span></div>
                  <div style="background:var(--bg-secondary);border-radius:4px;height:10px;overflow:hidden">
                    <div style="width:${barPct}%;height:100%;background:linear-gradient(90deg,var(--accent-info),var(--accent-primary));border-radius:4px;transition:width 0.5s"></div>
                  </div>
                </div>`;
              }).join('')}
              ${!categories.length ? '<p class="text-muted">No expenses to show</p>' : ''}
            </div>
            <div class="card">
              <div class="section-header"><div class="section-title">Monthly Trend</div></div>
              ${(() => {
                const monthly = {};
                db.data.expenses.forEach(exp => {
                  const month = exp.date?.substring(0, 7) || 'N/A';
                  if(!monthly[month]) monthly[month] = 0;
                  monthly[month] += exp.amount;
                });
                const months = Object.entries(monthly).sort();
                const maxM = months.length > 0 ? Math.max(...months.map(m => m[1])) : 1;
                return months.map(([m, amt]) => `
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-medium">${m}</span>
                    <div class="flex items-center" style="gap:0.5rem;flex:1;margin-left:1rem">
                      <div style="flex:1;background:var(--bg-secondary);border-radius:4px;height:8px;overflow:hidden">
                        <div style="width:${Math.round(amt/maxM*100)}%;height:100%;background:var(--accent-warning);border-radius:4px"></div>
                      </div>
                      <span class="font-bold text-sm">₹${fmt(amt)}</span>
                    </div>
                  </div>
                `).join('') || '<p class="text-muted">No data yet</p>';
              })()}
            </div>
          </div>
        `;
    };

    render(); return c;
}
