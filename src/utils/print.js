import { db, fmt } from '../store/db.js';

export function printDocument(type, docId) {
    const company = db.data.companyInfo;
    let title = '';
    let partyInfo = {};
    let items = [];
    let docInfo = {};
    let subtotal = 0, cgst = 0, sgst = 0, igst = 0, grandTotal = 0;
    
    // Fetch Data based on type
    if (type === 'sales_invoice') {
        title = 'TAX INVOICE';
        const doc = db.data.salesInvoices.find(i => i.id === docId);
        if(!doc) return;
        const cust = db.data.customers.find(c => c.id === doc.customerId);
        partyInfo = { name: cust?.name, address: cust?.address, gstin: cust?.gstin, stateCode: cust?.stateCode };
        docInfo = { no: doc.invoiceNo, date: doc.date, against: doc.orderId ? 'Order Ref: '+doc.orderId : '' };
        
        items = doc.items.map(i => {
            const product = db.data.products.find(p => p.id === i.productId);
            return { name: product?.name, hsn: i.hsnCode || product?.hsnCode, qty: i.qty, unit: product?.unit || 'Pcs', rate: i.rate, gstRate: i.gstRate, amount: i.amount };
        });
        subtotal = doc.subtotal; cgst = doc.cgst || 0; sgst = doc.sgst || 0; igst = doc.igst || 0; grandTotal = doc.grandTotal;
    } 
    else if (type === 'debit_note') {
        title = 'DEBIT NOTE (Purchase Return)';
        const doc = db.data.purchaseReturns.find(i => i.id === docId);
        if(!doc) return;
        const sup = db.data.suppliers.find(s => s.id === doc.supplierId);
        partyInfo = { name: sup?.name, address: sup?.address, gstin: sup?.gstin, stateCode: sup?.stateCode };
        docInfo = { no: doc.debitNoteNo, date: doc.date, against: 'Against Inv: '+doc.originalInvoiceNo, reason: doc.reason };
        
        items = doc.items.map(i => {
            const chem = db.data.chemicals.find(c => c.id === i.chemicalId);
            return { name: chem?.name, hsn: chem?.hsnCode, qty: i.qty, unit: chem?.unit || 'Kg', rate: i.rate, gstRate: i.gstRate, amount: i.qty * i.rate };
        });
        subtotal = doc.subtotal; cgst = doc.cgst || 0; sgst = doc.sgst || 0; igst = doc.igst || 0; grandTotal = doc.grandTotal;
    }
    else if (type === 'credit_note') {
        title = 'CREDIT NOTE (Sales Return)';
        const doc = db.data.salesReturns.find(i => i.id === docId);
        if(!doc) return;
        const cust = db.data.customers.find(c => c.id === doc.customerId);
        partyInfo = { name: cust?.name, address: cust?.address, gstin: cust?.gstin, stateCode: cust?.stateCode };
        docInfo = { no: doc.creditNoteNo, date: doc.date, against: 'Against Inv: '+doc.originalInvoiceNo, reason: doc.reason };
        
        items = doc.items.map(i => {
            const product = db.data.products.find(p => p.id === i.productId);
            return { name: product?.name, hsn: product?.hsnCode, qty: i.qty, unit: product?.unit || 'Pcs', rate: i.rate, gstRate: i.gstRate, amount: i.qty * i.rate };
        });
        subtotal = doc.subtotal; cgst = doc.cgst || 0; sgst = doc.sgst || 0; igst = doc.igst || 0; grandTotal = doc.grandTotal;
    }

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>${title} - ${docInfo.no}</title>
        <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Arial', sans-serif; font-size: 13px; color: #000; background: #fff; margin: 0; padding: 0; }
            .container { border: 1px solid #000; width: 100%; max-width: 800px; margin: 0 auto; box-sizing: border-box; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: bold; }
            
            .header { border-bottom: 1px solid #000; padding: 10px; }
            .header h1 { margin: 0; font-size: 22px; text-transform: uppercase; }
            .header p { margin: 3px 0; font-size: 13px; }
            
            .title-strip { background-color: #f0f0f0; border-bottom: 1px solid #000; padding: 5px; font-weight: bold; text-align: center; font-size: 16px; letter-spacing: 1px; }
            
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #000; }
            .info-box { padding: 10px; }
            .info-box:first-child { border-right: 1px solid #000; }
            .info-p { margin: 3px 0; }
            
            .items-table { width: 100%; border-collapse: collapse; }
            .items-table th { background-color: #f9f9f9; padding: 8px 5px; border-bottom: 1px solid #000; border-right: 1px solid #000; font-size: 12px; text-align: left; }
            .items-table th:last-child { border-right: none; }
            .items-table td { padding: 6px 5px; border-right: 1px solid #000; vertical-align: top; }
            .items-table td:last-child { border-right: none; }
            .items-table tr.border-bottom td { border-bottom: 1px solid #000; }
            
            .totals-row td { font-weight: bold; border-top: 1px solid #000; padding: 8px 5px; }
            
            .summary-grid { display: grid; grid-template-columns: 60% 40%; border-top: 1px solid #000; }
            .amount-in-words { padding: 10px; border-right: 1px solid #000; }
            .tax-summary { padding: 0; }
            
            table.tax-table { width: 100%; border-collapse: collapse; }
            table.tax-table td { padding: 5px; border-bottom: 1px solid #ccc; border-left: 1px solid #000; }
            table.tax-table tr:first-child td { border-top: none; }
            table.tax-table tr:last-child td { border-bottom: none; }
            
            .footer { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #000; height: 100px; }
            .declaration { padding: 10px; border-right: 1px solid #000; font-size: 11px; color: #333; }
            .signature { padding: 10px; position: relative; }
            .sig-line { position: absolute; bottom: 10px; right: 20px; text-align: center; width: 200px; font-weight: bold; border-top: 1px dashed #000; padding-top: 5px; }
            
            .watermark { position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(0,0,0,0.05); z-index: -1; pointer-events: none; white-space: nowrap; }
        </style>
    </head>
    <body onload="window.print(); setTimeout(() => window.close(), 500);">
        <div class="container">
            <div class="watermark">${company.name}</div>
            
            <!-- Company Header -->
            <div class="header text-center">
                <h1>${company.name}</h1>
                <p>${company.address}</p>
                <p><span class="font-bold">GSTIN:</span> ${company.gstin} | <span class="font-bold">STATE:</span> ${company.stateCode} | <span class="font-bold">Ph:</span> ${company.phone}</p>
            </div>
            
            <div class="title-strip">${title}</div>
            
            <!-- Parties Info -->
            <div class="info-grid">
                <div class="info-box">
                    <p class="font-bold" style="text-decoration:underline;margin-top:0;">Billed To / Party:</p>
                    <p class="font-bold" style="font-size:14px;">${partyInfo.name || 'CASH'}</p>
                    <p class="info-p">${partyInfo.address || ''}</p>
                    <p class="info-p"><span class="font-bold">GSTIN:</span> ${partyInfo.gstin || 'URD'}</p>
                    <p class="info-p"><span class="font-bold">State Code:</span> ${partyInfo.stateCode || ''}</p>
                </div>
                <div class="info-box">
                    <div style="display:flex; justify-content:space-between;">
                        <div>
                            <p class="info-p"><span class="font-bold">${title.includes('INVOICE') ? 'Invoice No:' : 'Note No:'}</span></p>
                            <p class="info-p"><span class="font-bold">Date:</span></p>
                            ${docInfo.against ? '<p class="info-p"><span class="font-bold">Ref/Against:</span></p>' : ''}
                            ${docInfo.reason ? '<p class="info-p"><span class="font-bold">Reason:</span></p>' : ''}
                        </div>
                        <div class="text-right">
                            <p class="info-p">${docInfo.no}</p>
                            <p class="info-p">${docInfo.date}</p>
                            ${docInfo.against ? '<p class="info-p">'+docInfo.against+'</p>' : ''}
                            ${docInfo.reason ? '<p class="info-p">'+docInfo.reason+'</p>' : ''}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Items Table -->
            <div style="min-height: 400px;">
                <table class="items-table">
                    <thead>
                        <tr>
                            <th width="5%">S.N.</th>
                            <th width="40%">Item Description</th>
                            <th width="10%">HSN</th>
                            <th width="10%" class="text-right">Qty</th>
                            <th width="10%">Unit</th>
                            <th width="10%" class="text-right">Rate</th>
                            <th width="15%" class="text-right">Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((it, idx) => `
                        <tr>
                            <td>${idx + 1}</td>
                            <td class="font-bold">${it.name}</td>
                            <td>${it.hsn || '-'}</td>
                            <td class="text-right">${it.qty}</td>
                            <td>${it.unit}</td>
                            <td class="text-right">${fmt(it.rate)}</td>
                            <td class="text-right">${fmt(it.amount)}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            
            <!-- Grand Totals -->
            <table class="items-table">
                <tr class="totals-row">
                    <td colspan="6" class="text-right" style="border-right: none;">Total Amount Before Tax:</td>
                    <td width="15%" class="text-right" style="border-left: 1px solid #000;">₹${fmt(subtotal)}</td>
                </tr>
            </table>

            <!-- Tax Summary -->
            <div class="summary-grid">
                <div class="amount-in-words">
                    <p class="font-bold" style="margin-top:0;">Amount in Words:</p>
                    <p style="text-transform: capitalize; font-style: italic;">Rupees ${numberToWords(Math.round(grandTotal))} Only.</p>
                </div>
                <div class="tax-summary">
                    <table class="tax-table">
                        ${igst > 0 ? `
                        <tr>
                            <td>Add: IGST</td>
                            <td class="text-right">₹${fmt(igst)}</td>
                        </tr>` : `
                        <tr>
                            <td>Add: CGST</td>
                            <td class="text-right">₹${fmt(cgst)}</td>
                        </tr>
                        <tr>
                            <td>Add: SGST</td>
                            <td class="text-right">₹${fmt(sgst)}</td>
                        </tr>`}
                        <tr style="background-color: #f0f0f0;">
                            <td class="font-bold" style="font-size: 15px;">GRAND TOTAL</td>
                            <td class="text-right font-bold" style="font-size: 15px;">₹${fmt(grandTotal)}</td>
                        </tr>
                    </table>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="declaration">
                    <p class="font-bold" style="margin-top:0; border-bottom:1px solid #ccc; padding-bottom:3px;">Terms & Conditions</p>
                    <ol style="margin-top:5px; padding-left:15px; margin-bottom:0;">
                        <li>Subject to ${company.address.split(',')[0]} jurisdiction.</li>
                        <li>Goods once sold will not be taken back without note.</li>
                        <li>Interest @ 18% p.a. will be charged if payment delayed.</li>
                    </ol>
                </div>
                <div class="signature">
                    <div class="sig-line">For ${company.name}<br><span style="font-weight:normal;font-size:10px;">Authorized Signatory</span></div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    // Write html and print
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();

    // Clean up iframe after printing
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 2000);
}

// Basic Number to Words converter for Indian Rupees
function numberToWords(num) {
    const a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
    const b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return; let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() || 'zero';
}
