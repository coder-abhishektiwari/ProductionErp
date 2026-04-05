import { db, fmt } from '../store/db.js';

export default function initAIAssistant() {
    const fab = document.createElement('div');
    fab.className = 'ai-fab';
    fab.innerHTML = `<i class="ph ph-sparkle"></i>`;
    document.body.appendChild(fab);

    const panel = document.createElement('div');
    panel.className = 'ai-panel closed';
    panel.innerHTML = `
        <div class="ai-header">
            <div class="ai-title"><i class="ph ph-sparkle"></i> AI Assistant</div>
            <button class="btn btn-ghost" id="ai-close"><i class="ph ph-x"></i></button>
        </div>
        <div class="ai-body" id="ai-messages">
            <div class="ai-msg bot">
                Hi! I'm your ERP Assistant. I can analyze your sales, expenses, inventory, and loans. What would you like to know?
            </div>
            <div class="ai-suggestions">
                <button class="ai-chip">Highest expenses this month?</button>
                <button class="ai-chip">Total outstanding receivables?</button>
                <button class="ai-chip">Stock alerts?</button>
            </div>
        </div>
        <div class="ai-footer">
            <input type="text" id="ai-input" placeholder="Ask about your business..." />
            <button id="ai-send"><i class="ph ph-paper-plane-right"></i></button>
        </div>
    `;
    document.body.appendChild(panel);

    // CSS Styling for AI Assistant
    const style = document.createElement('style');
    style.innerHTML = `
        .ai-fab { position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; background: linear-gradient(135deg, var(--accent-primary), #818cf8); border-radius: 50%; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.5); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 1000; font-size: 28px; color: white; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .ai-fab:hover { transform: scale(1.1) rotate(5deg); }
        
        .ai-panel { position: fixed; bottom: 100px; right: 30px; width: 380px; height: 500px; background: var(--bg-card); backdrop-filter: blur(16px); border: var(--glass-border); border-radius: var(--radius-lg); box-shadow: var(--glass-shadow); z-index: 1000; display: flex; flex-direction: column; overflow: hidden; transition: all 0.3s ease; opacity: 1; transform: translateY(0); }
        .ai-panel.closed { opacity: 0; transform: translateY(20px); pointer-events: none; }
        
        .ai-header { padding: 15px 20px; background: rgba(0,0,0,0.2); border-bottom: var(--glass-border); display: flex; justify-content: space-between; align-items: center; }
        .ai-title { font-weight: 600; display: flex; align-items: center; gap: 8px; color: #818cf8; }
        
        .ai-body { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
        .ai-msg { padding: 12px 16px; border-radius: 12px; max-width: 85%; line-height: 1.5; font-size: 14px; animation: fadeIn 0.3s ease; }
        .ai-msg.bot { background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); align-self: flex-start; border-bottom-left-radius: 4px; }
        .ai-msg.user { background: var(--bg-input); border: var(--glass-border); align-self: flex-end; border-bottom-right-radius: 4px; }
        
        .ai-suggestions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .ai-chip { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); padding: 8px 12px; border-radius: 20px; font-size: 12px; cursor: pointer; transition: 0.2s; }
        .ai-chip:hover { background: rgba(99, 102, 241, 0.2); color: white; border-color: var(--accent-primary); }
        
        .ai-footer { padding: 15px; border-top: var(--glass-border); background: rgba(0,0,0,0.2); display: flex; gap: 10px; }
        .ai-footer input { flex: 1; background: var(--bg-input); border: var(--glass-border); color: white; padding: 12px 15px; border-radius: 24px; outline: none; }
        .ai-footer input:focus { border-color: var(--accent-primary); }
        .ai-footer button { background: var(--accent-primary); color: white; border: none; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; transition: 0.2s; }
        .ai-footer button:hover { background: var(--accent-hover); transform: scale(1.05); }
        
        .typing-indicator { display: flex; gap: 4px; padding: 15px; }
        .typing-dot { width: 6px; height: 6px; background: #818cf8; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both; }
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
    `;
    document.head.appendChild(style);

    // Logic
    fab.addEventListener('click', () => panel.classList.toggle('closed'));
    document.getElementById('ai-close').addEventListener('click', () => panel.classList.add('closed'));

    const input = document.getElementById('ai-input');
    const sendBtn = document.getElementById('ai-send');
    const msgContainer = document.getElementById('ai-messages');

    const addMessage = (text, type) => {
        const div = document.createElement('div');
        div.className = `ai-msg ${type}`;
        div.innerHTML = text;
        msgContainer.appendChild(div);
        msgContainer.scrollTop = msgContainer.scrollHeight;
        if(type === 'user') {
            document.querySelector('.ai-suggestions')?.remove();
        }
    };

    const processQuery = (query) => {
        addMessage(query, 'user');
        input.value = '';
        
        // Show typing indicator
        const typingId = 'typing-' + Date.now();
        msgContainer.insertAdjacentHTML('beforeend', `<div class="ai-msg bot" id="${typingId}"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`);
        msgContainer.scrollTop = msgContainer.scrollHeight;

        setTimeout(() => {
            document.getElementById(typingId).remove();
            const response = generateAIResponse(query);
            addMessage(response, 'bot');
        }, 1200);
    };

    sendBtn.addEventListener('click', () => {
        if(input.value.trim()) processQuery(input.value.trim());
    });
    input.addEventListener('keypress', (e) => {
        if(e.key === 'Enter' && input.value.trim()) processQuery(input.value.trim());
    });
    document.querySelectorAll('.ai-chip').forEach(c => {
        c.addEventListener('click', e => processQuery(e.target.innerText));
    });
}

function generateAIResponse(query) {
    const q = query.toLowerCase();
    
    if (q.includes('expense') || q.includes('spending')) {
        const exps = db.getExpenseSummary();
        const top = exps.categories.sort((a,b)=>b.amount - a.amount).slice(0,3);
        return `Your total expenses are <b>₹${fmt(exps.total)}</b>.<br><br>Top 3 categories:<br>1. ${top[0]?.name}: ₹${fmt(top[0]?.amount)}<br>2. ${top[1]?.name}: ₹${fmt(top[1]?.amount)}<br>3. ${top[2]?.name}: ₹${fmt(top[2]?.amount)}`;
    } 
    else if (q.includes('outstanding') || q.includes('receivable') || q.includes('payable')) {
        const rec = db.getOutstandingReceivables();
        const pay = db.getOutstandingPayables();
        const totRec = rec.reduce((s,x)=>s+x.amount,0);
        const totPay = pay.reduce((s,x)=>s+x.amount,0);
        return `<b>Outstanding Overview:</b><br><br>Receivables (To Collect): <b><span style="color:#10b981">₹${fmt(totRec)}</span></b><br>Payables (To Pay): <b><span style="color:#ef4444">₹${fmt(totPay)}</span></b>`;
    }
    else if (q.includes('stock') || q.includes('inventory') || q.includes('alert')) {
        const chemAlerts = db.data.chemicals.map(c => {
            const qty = db.getChemicalStock(c.id);
            return { name: c.name, qty, min: c.minStock };
        }).filter(c => c.qty < c.min);
        
        if (chemAlerts.length === 0) return 'All raw materials are above minimum stock levels. Looking good! ✅';
        return `<b>Low Stock Alerts (${chemAlerts.length} items):</b><br>${chemAlerts.map(c => `- ${c.name}: ${c.qty} Kg (Min: ${c.min} Kg)`).join('<br>')}`;
    }
    else if (q.includes('loan') || q.includes('emi')) {
        const loans = db.getLoanSummary();
        const activeTaken = loans.active.filter(l => l.type === 'taken');
        const totPrincipal = activeTaken.reduce((s,l)=>s+l.principalAmount,0);
        const totPaid = activeTaken.reduce((s,l)=>s+l.totalPaid,0);
        return `You have <b>${activeTaken.length} active borrowed loan(s)</b>.<br>Total Principal: ₹${fmt(totPrincipal)}<br>Total Repaid: ₹${fmt(totPaid)}<br>Outstanding: ₹${fmt(totPrincipal - totPaid)}`;
    }
    else if (q.includes('profit') || q.includes('loss') || q.includes('p&l') || q.includes('income')) {
        let inc = 0, exp = 0;
        db._calculateLedgerBalances(db.data.accounts).forEach(a => {
            if(a.type === 'Income' && a.balance < 0) inc += Math.abs(a.balance);
            if(a.type === 'Expense' && a.balance > 0) exp += a.balance;
        });
        const net = inc - exp;
        return `<b>Current P&L Snapshot:</b><br><br>Total Income: ₹${fmt(inc)}<br>Total Expenses: ₹${fmt(exp)}<br>Net ${net >= 0 ? '<span style="color:#10b981">Profit</span>' : '<span style="color:#ef4444">Loss</span>'}: <b>₹${fmt(Math.abs(net))}</b>`;
    }
    else {
        return "I can provide insights on your <b>Expenses, Outstanding Receivables/Payables, Inventory Alerts, Loans,</b> and <b>Profit/Loss</b>. Try asking about one of these topics!";
    }
}
