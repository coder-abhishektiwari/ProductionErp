import { db, fmt } from '../store/db.js';

export default function GSTView() {
    const c = document.createElement('div');
    c.className = 'animate-fade-in';
    let activeTab = 'summary';

    const render = () => {
        c.innerHTML = `
          <div class="tabs">
            <div class="tab ${activeTab==='summary'?'active':''}" data-tab="summary">GSTR-3B Summary</div>
            <div class="tab ${activeTab==='gstr1'?'active':''}" data-tab="gstr1">GSTR-1 (Outward)</div>
            <div class="tab ${activeTab==='input'?'active':''}" data-tab="input">Input Tax Register</div>
            <div class="tab ${activeTab==='hsn'?'active':''}" data-tab="hsn">HSN Summary</div>
          </div>
          <div id="tab-content"></div>
        `;
        c.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { activeTab = t.dataset.tab; render(); }));
        const content = c.querySelector('#tab-content');
        if (activeTab === 'summary') renderSummary(content);
        else if (activeTab === 'gstr1') renderGSTR1(content);
        else if (activeTab === 'input') renderInput(content);
        else renderHSN(content);
    };

    const renderSummary = (el) => {
        const gst = db.getGSTSummary();
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">GSTR-3B Summary</div></div>
            <div class="table-responsive">
              <table class="table">
                <thead><tr><th></th><th class="text-right">CGST</th><th class="text-right">SGST</th><th class="text-right">IGST</th><th class="text-right">Total</th></tr></thead>
                <tbody>
                  <tr><td class="font-medium">Output Tax (Sales)</td>
                    <td class="text-right">₹${fmt(gst.outputCGST)}</td><td class="text-right">₹${fmt(gst.outputSGST)}</td>
                    <td class="text-right">₹${fmt(gst.outputIGST)}</td><td class="text-right font-bold">₹${fmt(gst.totalOutput)}</td></tr>
                  <tr><td class="font-medium">Input Tax Credit (Purchases)</td>
                    <td class="text-right">₹${fmt(gst.inputCGST)}</td><td class="text-right">₹${fmt(gst.inputSGST)}</td>
                    <td class="text-right">₹${fmt(gst.inputIGST)}</td><td class="text-right font-bold">₹${fmt(gst.totalInput)}</td></tr>
                </tbody>
                <tfoot><tr style="border-top:2px solid var(--border-color)">
                  <td class="font-bold">Net Tax Payable</td>
                  <td class="text-right font-bold">₹${fmt(gst.outputCGST - gst.inputCGST)}</td>
                  <td class="text-right font-bold">₹${fmt(gst.outputSGST - gst.inputSGST)}</td>
                  <td class="text-right font-bold">₹${fmt(gst.outputIGST - gst.inputIGST)}</td>
                  <td class="text-right font-bold ${gst.netPayable >= 0 ? 'text-danger' : 'text-success'}" style="font-size:1.1rem">₹${fmt(gst.netPayable)}</td>
                </tr></tfoot>
              </table>
            </div>
          </div>
        `;
    };

    const renderGSTR1 = (el) => {
        const invoices = [...db.data.salesInvoices].map(i => ({...i, isReturn: false}));
        const returns = [...db.data.salesReturns].map(r => ({...r, invoiceNo: r.creditNoteNo, isReturn: true}));
        const records = [...invoices, ...returns].sort((a,b) => new Date(b.date) - new Date(a.date));
        
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">GSTR-1: Outward Supplies</div></div>
            <div class="table-responsive">
              <table class="table">
                <thead><tr><th>Document No</th><th>Date</th><th>Customer</th><th>GSTIN</th><th class="text-right">Taxable</th><th class="text-right">CGST</th><th class="text-right">SGST</th><th class="text-right">IGST</th><th class="text-right">Total</th></tr></thead>
                <tbody>
                  ${records.map(inv => {
                    const cust = db.data.customers.find(cu => cu.id === inv.customerId);
                    const mult = inv.isReturn ? -1 : 1;
                    const docLabel = inv.isReturn ? `<span class="badge" style="background:var(--accent-danger);color:white;font-size:0.7rem;padding:2px 4px;">CN</span> ${inv.invoiceNo}` : inv.invoiceNo;
                    return `<tr><td>${docLabel}</td><td>${inv.date}</td><td>${cust?.name||'-'}</td><td class="text-xs">${cust?.gstin||'-'}</td>
                      <td class="text-right">₹${fmt(inv.subtotal * mult)}</td>
                      <td class="text-right">₹${fmt(inv.cgst * mult)}</td><td class="text-right">₹${fmt(inv.sgst * mult)}</td>
                      <td class="text-right">₹${fmt(inv.igst * mult)}</td>
                      <td class="text-right font-bold">₹${fmt(inv.grandTotal * mult)}</td></tr>`;
                  }).join('')}
                  ${records.length===0?'<tr><td colspan="9" class="text-center text-muted">No sales or returns</td></tr>':''}
                </tbody>
              </table>
            </div>
          </div>
        `;
    };

    const renderInput = (el) => {
        const invoices = [...db.data.purchaseInvoices].map(i => ({...i, isReturn: false}));
        const returns = [...db.data.purchaseReturns].map(r => ({...r, invoiceNo: r.debitNoteNo, isReturn: true}));
        const records = [...invoices, ...returns].sort((a,b) => new Date(b.date) - new Date(a.date));
        
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">GST Input Tax Register</div></div>
            <div class="table-responsive">
              <table class="table">
                <thead><tr><th>Document No</th><th>Date</th><th>Supplier</th><th class="text-right">Taxable</th><th class="text-right">CGST</th><th class="text-right">SGST</th><th class="text-right">IGST</th><th class="text-right">Total</th></tr></thead>
                <tbody>
                  ${records.map(inv => {
                    const sup = db.data.suppliers.find(s => s.id === inv.supplierId);
                    const mult = inv.isReturn ? -1 : 1;
                    const docLabel = inv.isReturn ? `<span class="badge" style="background:var(--accent-warning);color:black;font-size:0.7rem;padding:2px 4px;">DN</span> ${inv.invoiceNo}` : inv.invoiceNo;
                    return `<tr><td>${docLabel}</td><td>${inv.date}</td><td>${sup?.name||'-'}</td>
                      <td class="text-right">₹${fmt(inv.subtotal * mult)}</td>
                      <td class="text-right">₹${fmt(inv.cgst * mult)}</td><td class="text-right">₹${fmt(inv.sgst * mult)}</td>
                      <td class="text-right">₹${fmt(inv.igst * mult)}</td>
                      <td class="text-right font-bold">₹${fmt(inv.grandTotal * mult)}</td></tr>`;
                  }).join('')}
                  ${records.length===0?'<tr><td colspan="8" class="text-center text-muted">No purchases or returns</td></tr>':''}
                </tbody>
              </table>
            </div>
          </div>
        `;
    };

    const renderHSN = (el) => {
        const hsn = db.getHSNSummary();
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">HSN-Wise Summary</div></div>
            <div class="table-responsive">
              <table class="table">
                <thead><tr><th>HSN Code</th><th class="text-right">Taxable Value</th><th class="text-right">Total Tax</th></tr></thead>
                <tbody>
                  ${hsn.map(h => `<tr><td class="font-medium">${h.hsnCode}</td><td class="text-right">₹${fmt(h.taxableValue)}</td><td class="text-right">₹${fmt(h.totalTax)}</td></tr>`).join('')}
                  ${hsn.length===0?'<tr><td colspan="3" class="text-center text-muted">No data</td></tr>':''}
                </tbody>
              </table>
            </div>
          </div>
        `;
    };

    render();
    return c;
}
