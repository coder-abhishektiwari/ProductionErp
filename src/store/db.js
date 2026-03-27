// ============================================================
// RUBBER FACTORY ERP — Complete Database Layer
// ============================================================

export const generateId = () => Math.random().toString(36).substr(2, 9);
export const formatDate = (date = new Date()) => new Date(date).toISOString().split('T')[0];
export const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Default Master Data ────────────────────────────────────
const defaultChemicals = [
  { id: 'chem_1', name: 'Carbon Black N330', unit: 'Kg', hsnCode: '28030010', gstRate: 18, minStock: 100 },
  { id: 'chem_2', name: 'Zinc Oxide', unit: 'Kg', hsnCode: '28170010', gstRate: 18, minStock: 50 },
  { id: 'chem_3', name: 'Sulphur', unit: 'Kg', hsnCode: '25030010', gstRate: 5, minStock: 25 },
  { id: 'chem_4', name: 'Stearic Acid', unit: 'Kg', hsnCode: '38231100', gstRate: 18, minStock: 30 },
  { id: 'chem_5', name: 'Silicon Rubber Compound', unit: 'Kg', hsnCode: '40021100', gstRate: 18, minStock: 200 },
  { id: 'chem_6', name: 'Non-Silicon Rubber Compound', unit: 'Kg', hsnCode: '40021900', gstRate: 18, minStock: 200 },
];

const defaultProducts = [
  { id: 'prod_1', name: 'Silicon O-Ring 25mm', hsnCode: '40169320', gstRate: 18, productType: 'silicon', unit: 'Pcs', rate: 15 },
  { id: 'prod_2', name: 'Non-Silicon Bush Washer 3mm', hsnCode: '40169390', gstRate: 18, productType: 'non-silicon', unit: 'Pcs', rate: 8 },
  { id: 'prod_3', name: 'Silicon Gasket 50mm', hsnCode: '40169320', gstRate: 18, productType: 'silicon', unit: 'Pcs', rate: 45 },
];

const defaultSheetTypes = [
  { id: 'sheet_silicon', name: 'Silicon Rubber Sheet', sheetType: 'silicon', unit: 'Kg' },
  { id: 'sheet_nonsilicon', name: 'Non-Silicon Rubber Sheet', sheetType: 'non-silicon', unit: 'Kg' },
];

const defaultCustomers = [
  { id: 'cust_1', name: 'Mahindra Auto Parts', address: 'Pune, MH', gstin: '27AABCM1234F1Z5', contact: '9876543210', creditDays: 30, stateCode: '27' },
  { id: 'cust_2', name: 'Tata Components Ltd', address: 'Mumbai, MH', gstin: '27AABCT5678G2Z3', contact: '9988776655', creditDays: 45, stateCode: '27' },
];

const defaultSuppliers = [
  { id: 'sup_1', name: 'National Chemicals', address: 'Delhi', gstin: '07AABCN1234H1Z9', contact: '9123456789', stateCode: '07' },
  { id: 'sup_2', name: 'Gujarat Rubber Co', address: 'Ahmedabad, GJ', gstin: '24AABCG5678I2Z7', contact: '9234567890', stateCode: '24' },
];

const defaultAccounts = [
  { id: 'acc_cash', name: 'Cash', group: 'Cash-in-hand', type: 'Asset', accountKind: 'cash' },
  { id: 'acc_sbi', name: 'SBI Current A/c', group: 'Bank Accounts', type: 'Asset', accountKind: 'bank', bankName: 'SBI', accountNo: '38012345678' },
  { id: 'acc_hdfc', name: 'HDFC Savings', group: 'Bank Accounts', type: 'Asset', accountKind: 'bank', bankName: 'HDFC', accountNo: '50100456789' },
  { id: 'acc_gpay', name: 'GPay UPI - 9876XXXXX', group: 'Bank Accounts', type: 'Asset', accountKind: 'upi' },
  { id: 'acc_sales', name: 'Sales Account', group: 'Sales Accounts', type: 'Income' },
  { id: 'acc_purchases', name: 'Purchase Account', group: 'Purchase Accounts', type: 'Expense' },
  { id: 'acc_mfg', name: 'Manufacturing Expenses', group: 'Direct Expenses', type: 'Expense' },
  { id: 'acc_capital', name: 'Capital Account', group: 'Capital Account', type: 'Equity' },
  { id: 'acc_gst_input', name: 'GST Input Tax (CGST)', group: 'Duties & Taxes', type: 'Asset' },
  { id: 'acc_gst_input_sgst', name: 'GST Input Tax (SGST)', group: 'Duties & Taxes', type: 'Asset' },
  { id: 'acc_gst_input_igst', name: 'GST Input Tax (IGST)', group: 'Duties & Taxes', type: 'Asset' },
  { id: 'acc_gst_output', name: 'GST Output Tax (CGST)', group: 'Duties & Taxes', type: 'Liability' },
  { id: 'acc_gst_output_sgst', name: 'GST Output Tax (SGST)', group: 'Duties & Taxes', type: 'Liability' },
  { id: 'acc_gst_output_igst', name: 'GST Output Tax (IGST)', group: 'Duties & Taxes', type: 'Liability' },
  { id: 'acc_scrap_income', name: 'Scrap Sale Income', group: 'Sales Accounts', type: 'Income' },
  { id: 'acc_waste', name: 'Cutting Waste (Non-Silicon)', group: 'Inventory', type: 'Asset' },
  // Expense Accounts
  { id: 'acc_electricity', name: 'Electricity', group: 'Indirect Expenses', type: 'Expense' },
  { id: 'acc_rent', name: 'Rent', group: 'Indirect Expenses', type: 'Expense' },
  { id: 'acc_salary', name: 'Salary & Wages', group: 'Indirect Expenses', type: 'Expense' },
  { id: 'acc_transport', name: 'Transport & Freight', group: 'Indirect Expenses', type: 'Expense' },
  { id: 'acc_misc_expense', name: 'Misc Expenses', group: 'Indirect Expenses', type: 'Expense' },
  { id: 'acc_repair', name: 'Repair & Maintenance', group: 'Indirect Expenses', type: 'Expense' },
  { id: 'acc_office', name: 'Office Expenses', group: 'Indirect Expenses', type: 'Expense' },
  // Returns
  { id: 'acc_purchase_return', name: 'Purchase Returns', group: 'Purchase Accounts', type: 'Income' },
  { id: 'acc_sales_return', name: 'Sales Returns', group: 'Sales Accounts', type: 'Expense' },
  // Loans
  { id: 'acc_loan_given', name: 'Loans & Advances (Given)', group: 'Loans (Asset)', type: 'Asset' },
  { id: 'acc_loan_taken', name: 'Loans (Taken)', group: 'Loans (Liability)', type: 'Liability' },
  { id: 'acc_interest_paid', name: 'Interest Paid', group: 'Indirect Expenses', type: 'Expense' },
  { id: 'acc_interest_received', name: 'Interest Received', group: 'Other Income', type: 'Income' },
];

// ── Initial State ──────────────────────────────────────────
const initialState = {
  companyInfo: {
    name: 'ABC Rubber Industries',
    address: 'Plot No. 45, MIDC Industrial Area, Pune - 411026',
    gstin: '27AABCA1234B1Z5',
    stateCode: '27',
    phone: '020-12345678',
    email: 'accounts@abcrubber.com',
  },
  chemicals: defaultChemicals,
  products: defaultProducts,
  sheetTypes: defaultSheetTypes,
  customers: defaultCustomers,
  suppliers: defaultSuppliers,
  accounts: defaultAccounts,
  
  // Transactions
  vouchers: [],           // { id, date, type, narration, voucherNo, refInvoiceNo }
  voucherDetails: [],     // { id, voucherId, accountId, partyId, drAmount, crAmount }
  
  // Inventory Transactions
  inventoryTransactions: [], // { id, voucherId, itemId, itemType:'chemical'|'sheet'|'product'|'waste', qty, rate, amount }
  
  // Production
  productionBatches: [],  // { id, date, stage:'sheet'|'product', productionType:'silicon'|'non-silicon', 
                          //   inputItems:[], outputItems:[], wasteKg, wastePercent, operatorName, narration, voucherId }
  
  // Customer Orders
  customerOrders: [],     // { id, customerId, date, dueDate, items:[{productId, qty, fulfilledQty, description}], status:'pending'|'partial'|'fulfilled', linkedInvoiceIds:[] }
  
  // Cheques
  cheques: [],            // { id, type:'issued'|'received', partyId, partyType:'customer'|'supplier', 
                          //   chequeNo, date, bankName, amount, status:'pending'|'cleared'|'bounced', voucherId }
  
  // Purchase Invoices (linked to vouchers)
  purchaseInvoices: [],   // { id, voucherId, supplierId, invoiceNo, date, items:[{chemicalId, qty, rate, amount, gstRate, gstAmount}], 
                          //   subtotal, cgst, sgst, igst, grandTotal, paymentMode, accountId, amountPaid }
  
  // Sales Invoices
  salesInvoices: [],      // { id, voucherId, customerId, invoiceNo, date, items:[{productId, qty, rate, amount, hsnCode, gstRate, gstAmount}],
                          //   subtotal, cgst, sgst, igst, grandTotal, paymentMode, accountId, amountReceived, orderId }

  // Purchase Returns (Debit Notes)
  purchaseReturns: [],    // { id, voucherId, supplierId, debitNoteNo, originalInvoiceNo, date, items:[{chemicalId, qty, rate, gstRate}],
                          //   subtotal, cgst, sgst, igst, grandTotal, reason }

  // Sales Returns (Credit Notes)
  salesReturns: [],       // { id, voucherId, customerId, creditNoteNo, originalInvoiceNo, date, items:[{productId, qty, rate, gstRate}],
                          //   subtotal, cgst, sgst, igst, grandTotal, reason }

  // Expenses
  expenses: [],           // { id, voucherId, date, category, accountId, amount, paidFrom, description, recurring:bool }

  // Loans
  loans: [],              // { id, type:'taken'|'given', partyName, principalAmount, interestRate, startDate, tenureMonths,
                          //   emiAmount, totalPaid, status:'active'|'closed', emis:[], accountId, description }
};

// ── Database Class ─────────────────────────────────────────
class Database {
  constructor() {
    this.listeners = [];
    this.data = this.loadData();
  }

  loadData() {
    const saved = localStorage.getItem('rubber_erp_db');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // ── Schema Migration ──────────────────────────────
        // 1. Add any missing top-level keys (new arrays like expenses, loans)
        for (const key of Object.keys(initialState)) {
          if (!(key in parsed)) parsed[key] = JSON.parse(JSON.stringify(initialState[key]));
        }
        // 2. Merge new accounts into existing accounts array (by id)
        //    This ensures old localStorage gets new ledger accounts
        //    like acc_electricity, acc_loan_taken, etc.
        const existingIds = new Set(parsed.accounts.map(a => a.id));
        const freshAccounts = JSON.parse(JSON.stringify(initialState.accounts));
        for (const acc of freshAccounts) {
          if (!existingIds.has(acc.id)) {
            parsed.accounts.push(acc);
            console.log(`🔄 Schema migration: added account "${acc.name}" (${acc.id})`);
          }
        }
        // 3. Merge new chemicals/products/sheets if missing
        if (parsed.chemicals) {
          const chemIds = new Set(parsed.chemicals.map(c => c.id));
          for (const ch of initialState.chemicals) {
            if (!chemIds.has(ch.id)) parsed.chemicals.push(JSON.parse(JSON.stringify(ch)));
          }
        }
        if (parsed.products) {
          const prodIds = new Set(parsed.products.map(p => p.id));
          for (const pr of initialState.products) {
            if (!prodIds.has(pr.id)) parsed.products.push(JSON.parse(JSON.stringify(pr)));
          }
        }
        localStorage.setItem('rubber_erp_db', JSON.stringify(parsed)); // Save migrated data (direct, no notify)
        return parsed;
      } catch (e) {
        console.error("Failed to parse DB", e);
      }
    }
    const data = JSON.parse(JSON.stringify(initialState));
    localStorage.setItem('rubber_erp_db', JSON.stringify(data));
    return data;
  }

  saveData(data = this.data) {
    localStorage.setItem('rubber_erp_db', JSON.stringify(data));
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  notify() { this.listeners.forEach(l => l(this.data)); }

  clearData() {
    this.data = JSON.parse(JSON.stringify(initialState));
    localStorage.removeItem('rubber_erp_db');
    this.saveData();
    this.seedSampleData();
  }

  // ── CRUD Helpers ───────────────────────────────────────
  nextVoucherNo() {
    return (this.data.vouchers.length + 1).toString().padStart(5, '0');
  }
  
  nextInvoiceNo(prefix = 'INV') {
    const count = this.data.salesInvoices.length + 1;
    return `${prefix}-${count.toString().padStart(5, '0')}`;
  }

  nextPurchaseInvoiceNo() {
    return `PUR-${(this.data.purchaseInvoices.length + 1).toString().padStart(5, '0')}`;
  }

  // ── Master CRUD (Add / Update / Delete) ────────────────
  addChemical(item) { item.id = generateId(); this.data.chemicals.push(item); this.saveData(); return item; }
  updateChemical(id, updates) { const i = this.data.chemicals.findIndex(c => c.id === id); if(i>=0) { Object.assign(this.data.chemicals[i], updates); this.saveData(); } }
  deleteChemical(id) { this.data.chemicals = this.data.chemicals.filter(c => c.id !== id); this.saveData(); }

  addProduct(item) { item.id = generateId(); this.data.products.push(item); this.saveData(); return item; }
  updateProduct(id, updates) { const i = this.data.products.findIndex(p => p.id === id); if(i>=0) { Object.assign(this.data.products[i], updates); this.saveData(); } }
  deleteProduct(id) { this.data.products = this.data.products.filter(p => p.id !== id); this.saveData(); }

  addCustomer(item) { item.id = generateId(); this.data.customers.push(item); this.saveData(); return item; }
  updateCustomer(id, updates) { const i = this.data.customers.findIndex(c => c.id === id); if(i>=0) { Object.assign(this.data.customers[i], updates); this.saveData(); } }
  deleteCustomer(id) { this.data.customers = this.data.customers.filter(c => c.id !== id); this.saveData(); }

  addSupplier(item) { item.id = generateId(); this.data.suppliers.push(item); this.saveData(); return item; }
  updateSupplier(id, updates) { const i = this.data.suppliers.findIndex(s => s.id === id); if(i>=0) { Object.assign(this.data.suppliers[i], updates); this.saveData(); } }
  deleteSupplier(id) { this.data.suppliers = this.data.suppliers.filter(s => s.id !== id); this.saveData(); }

  addAccount(item) { item.id = generateId(); this.data.accounts.push(item); this.saveData(); return item; }
  updateAccount(id, updates) { const i = this.data.accounts.findIndex(a => a.id === id); if(i>=0) { Object.assign(this.data.accounts[i], updates); this.saveData(); } }
  deleteAccount(id) {
    // Prevent deleting system accounts
    const systemIds = ['acc_cash','acc_sales','acc_purchases','acc_gst_input','acc_gst_input_sgst','acc_gst_input_igst','acc_gst_output','acc_gst_output_sgst','acc_gst_output_igst','acc_capital','acc_mfg','acc_scrap_income','acc_waste'];
    if(systemIds.includes(id)) { return false; }
    this.data.accounts = this.data.accounts.filter(a => a.id !== id); this.saveData(); return true;
  }

  // ── Delete Transactions ────────────────────────────────
  deleteVoucher(voucherId) {
    this.data.vouchers = this.data.vouchers.filter(v => v.id !== voucherId);
    this.data.voucherDetails = this.data.voucherDetails.filter(d => d.voucherId !== voucherId);
    this.data.inventoryTransactions = this.data.inventoryTransactions.filter(t => t.voucherId !== voucherId);
    // Also remove linked invoices/batches
    this.data.purchaseInvoices = this.data.purchaseInvoices.filter(i => i.voucherId !== voucherId);
    this.data.salesInvoices = this.data.salesInvoices.filter(i => i.voucherId !== voucherId);
    this.data.productionBatches = this.data.productionBatches.filter(b => b.voucherId !== voucherId);
    this.saveData();
  }

  deletePurchaseInvoice(invoiceId) {
    const inv = this.data.purchaseInvoices.find(i => i.id === invoiceId);
    if(inv) { this.deleteVoucher(inv.voucherId); }
  }

  deleteSalesInvoice(invoiceId) {
    const inv = this.data.salesInvoices.find(i => i.id === invoiceId);
    if(inv) {
      // Reverse fulfilled qty on linked order
      if(inv.orderId) {
        const order = this.data.customerOrders.find(o => o.id === inv.orderId);
        if(order) {
          (inv.items || []).forEach(saleItem => {
            const orderItem = order.items.find(oi => oi.productId === saleItem.productId);
            if(orderItem) { orderItem.fulfilledQty = Math.max(0, (orderItem.fulfilledQty || 0) - (saleItem.qty || 0)); }
          });
          order.linkedInvoiceIds = (order.linkedInvoiceIds || []).filter(id => id !== invoiceId);
          // Recalculate status
          const allFulfilled = order.items.every(oi => (oi.fulfilledQty || 0) >= oi.qty);
          const anyFulfilled = order.items.some(oi => (oi.fulfilledQty || 0) > 0);
          order.status = allFulfilled ? 'fulfilled' : anyFulfilled ? 'partial' : 'pending';
        }
      }
      this.deleteVoucher(inv.voucherId);
    }
  }

  deleteProductionBatch(batchId) {
    const batch = this.data.productionBatches.find(b => b.id === batchId);
    if(batch) { this.deleteVoucher(batch.voucherId); }
  }

  deleteCustomerOrder(orderId) {
    this.data.customerOrders = this.data.customerOrders.filter(o => o.id !== orderId);
    this.saveData();
  }

  deleteCheque(chequeId) {
    this.data.cheques = this.data.cheques.filter(c => c.id !== chequeId);
    this.saveData();
  }

  updateCustomerOrder(id, updates) {
    const i = this.data.customerOrders.findIndex(o => o.id === id);
    if(i >= 0) { Object.assign(this.data.customerOrders[i], updates); this.saveData(); }
  }

  // ── Voucher + Accounting ───────────────────────────────
  addVoucher(voucherData, detailsData, inventoryData = []) {
    const voucherId = generateId();
    const newVoucher = {
      id: voucherId,
      date: voucherData.date || formatDate(),
      type: voucherData.type,
      narration: voucherData.narration || '',
      voucherNo: this.nextVoucherNo(),
      refInvoiceNo: voucherData.refInvoiceNo || ''
    };
    this.data.vouchers.push(newVoucher);

    detailsData.forEach(d => {
      if (d.drAmount > 0 || d.crAmount > 0) {
        this.data.voucherDetails.push({
          id: generateId(), voucherId,
          accountId: d.accountId,
          partyId: d.partyId || '',
          drAmount: Number(d.drAmount) || 0,
          crAmount: Number(d.crAmount) || 0
        });
      }
    });

    inventoryData.forEach(inv => {
      if (inv.qty !== 0) {
        this.data.inventoryTransactions.push({
          id: generateId(), voucherId,
          itemId: inv.itemId,
          itemType: inv.itemType || 'chemical',
          qty: Number(inv.qty),
          rate: Number(inv.rate) || 0,
          amount: Number(inv.amount) || 0
        });
      }
    });

    this.saveData();
    return newVoucher;
  }

  // ── Purchase Invoice ──────────────────────────────────
  addPurchaseInvoice(invoiceData) {
    const id = generateId();
    const isInterState = invoiceData.supplierStateCode && invoiceData.supplierStateCode !== this.data.companyInfo.stateCode;
    
    let subtotal = 0;
    let totalCgst = 0, totalSgst = 0, totalIgst = 0;
    const inventoryData = [];

    invoiceData.items.forEach(item => {
      const amount = item.qty * item.rate;
      subtotal += amount;
      const gstAmt = amount * (item.gstRate / 100);
      if (isInterState) {
        totalIgst += gstAmt;
      } else {
        totalCgst += gstAmt / 2;
        totalSgst += gstAmt / 2;
      }
      item.amount = amount;
      item.gstAmount = gstAmt;

      // Add to inventory (chemicals inward)
      inventoryData.push({ itemId: item.chemicalId, itemType: 'chemical', qty: item.qty, rate: item.rate, amount });
    });

    const grandTotal = subtotal + totalCgst + totalSgst + totalIgst;

    // Create accounting voucher
    const detailsData = [
      { accountId: 'acc_purchases', drAmount: subtotal, crAmount: 0 },
    ];

    if (isInterState) {
      detailsData.push({ accountId: 'acc_gst_input_igst', drAmount: totalIgst, crAmount: 0 });
    } else {
      detailsData.push({ accountId: 'acc_gst_input', drAmount: totalCgst, crAmount: 0 });
      detailsData.push({ accountId: 'acc_gst_input_sgst', drAmount: totalSgst, crAmount: 0 });
    }

    // Credit supplier or payment account
    if (invoiceData.paymentMode === 'credit') {
      // Create a creditor account for the supplier if not existing, use a "supplier" ledger approach
      const supAcc = this._getOrCreatePartyAccount(invoiceData.supplierId, 'supplier');
      detailsData.push({ accountId: supAcc.id, partyId: invoiceData.supplierId, drAmount: 0, crAmount: grandTotal });
    } else {
      detailsData.push({ accountId: invoiceData.accountId, drAmount: 0, crAmount: grandTotal });
    }

    const voucher = this.addVoucher({
      date: invoiceData.date,
      type: 'Purchase',
      narration: `Purchase from ${invoiceData.supplierName || ''} - Inv# ${invoiceData.invoiceNo}`,
      refInvoiceNo: invoiceData.invoiceNo
    }, detailsData, inventoryData);

    const invoice = {
      id, voucherId: voucher.id,
      supplierId: invoiceData.supplierId,
      invoiceNo: invoiceData.invoiceNo || this.nextPurchaseInvoiceNo(),
      date: invoiceData.date || formatDate(),
      items: invoiceData.items,
      subtotal, cgst: totalCgst, sgst: totalSgst, igst: totalIgst, grandTotal,
      paymentMode: invoiceData.paymentMode || 'credit',
      accountId: invoiceData.accountId || '',
      amountPaid: invoiceData.paymentMode === 'credit' ? 0 : grandTotal
    };
    this.data.purchaseInvoices.push(invoice);
    this.saveData();
    return invoice;
  }

  // ── Sales Invoice ──────────────────────────────────────
  addSalesInvoice(invoiceData) {
    const id = generateId();
    const isInterState = invoiceData.customerStateCode && invoiceData.customerStateCode !== this.data.companyInfo.stateCode;

    let subtotal = 0;
    let totalCgst = 0, totalSgst = 0, totalIgst = 0;
    const inventoryData = [];

    invoiceData.items.forEach(item => {
      const amount = item.qty * item.rate;
      subtotal += amount;
      const gstAmt = amount * (item.gstRate / 100);
      if (isInterState) {
        totalIgst += gstAmt;
      } else {
        totalCgst += gstAmt / 2;
        totalSgst += gstAmt / 2;
      }
      item.amount = amount;
      item.gstAmount = gstAmt;
      
      // Decrease finished goods stock
      inventoryData.push({ itemId: item.productId, itemType: 'product', qty: -item.qty, rate: item.rate, amount });
    });

    const grandTotal = subtotal + totalCgst + totalSgst + totalIgst;

    const detailsData = [];
    
    // Debit customer or payment account
    if (invoiceData.paymentMode === 'credit') {
      const custAcc = this._getOrCreatePartyAccount(invoiceData.customerId, 'customer');
      detailsData.push({ accountId: custAcc.id, partyId: invoiceData.customerId, drAmount: grandTotal, crAmount: 0 });
    } else {
      detailsData.push({ accountId: invoiceData.accountId, drAmount: grandTotal, crAmount: 0 });
    }

    detailsData.push({ accountId: 'acc_sales', drAmount: 0, crAmount: subtotal });

    if (isInterState) {
      detailsData.push({ accountId: 'acc_gst_output_igst', drAmount: 0, crAmount: totalIgst });
    } else {
      detailsData.push({ accountId: 'acc_gst_output', drAmount: 0, crAmount: totalCgst });
      detailsData.push({ accountId: 'acc_gst_output_sgst', drAmount: 0, crAmount: totalSgst });
    }

    const voucher = this.addVoucher({
      date: invoiceData.date,
      type: 'Sales',
      narration: `Sale to ${invoiceData.customerName || ''} - Inv# ${invoiceData.invoiceNo || ''}`,
      refInvoiceNo: invoiceData.invoiceNo
    }, detailsData, inventoryData);

    const invoice = {
      id, voucherId: voucher.id,
      customerId: invoiceData.customerId,
      invoiceNo: invoiceData.invoiceNo || this.nextInvoiceNo(),
      date: invoiceData.date || formatDate(),
      items: invoiceData.items,
      subtotal, cgst: totalCgst, sgst: totalSgst, igst: totalIgst, grandTotal,
      paymentMode: invoiceData.paymentMode || 'credit',
      accountId: invoiceData.accountId || '',
      amountReceived: invoiceData.paymentMode === 'credit' ? 0 : grandTotal,
      orderId: invoiceData.orderId || ''
    };
    this.data.salesInvoices.push(invoice);

    // Update order fulfilled qty (per item) if linked
    if (invoiceData.orderId) {
      const order = this.data.customerOrders.find(o => o.id === invoiceData.orderId);
      if (order) {
        // Track per-item fulfilled qty
        (invoiceData.items || []).forEach(saleItem => {
          const orderItem = order.items.find(oi => oi.productId === saleItem.productId);
          if(orderItem) {
            orderItem.fulfilledQty = (orderItem.fulfilledQty || 0) + (saleItem.qty || 0);
          }
        });
        // Track linked invoices
        if(!order.linkedInvoiceIds) order.linkedInvoiceIds = [];
        order.linkedInvoiceIds.push(invoice.id);
        // Update status based on remaining qty
        const allFulfilled = order.items.every(oi => (oi.fulfilledQty || 0) >= oi.qty);
        const anyFulfilled = order.items.some(oi => (oi.fulfilledQty || 0) > 0);
        order.status = allFulfilled ? 'fulfilled' : anyFulfilled ? 'partial' : 'pending';
      }
    }
    this.saveData();
    return invoice;
  }

  // ── Production: Stage 1 (Sheet Making) ────────────────
  addSheetMakingBatch(batchData) {
    const id = generateId();
    const inventoryData = [];

    // Deduct chemicals consumed
    batchData.inputItems.forEach(inp => {
      inventoryData.push({ itemId: inp.itemId, itemType: inp.itemType || 'chemical', qty: -Math.abs(inp.qty), rate: inp.rate || 0, amount: 0 });
    });

    // Add sheet produced
    const sheetId = batchData.productionType === 'silicon' ? 'sheet_silicon' : 'sheet_nonsilicon';
    inventoryData.push({ itemId: sheetId, itemType: 'sheet', qty: Math.abs(batchData.outputKg), rate: 0, amount: 0 });

    const voucher = this.addVoucher({
      date: batchData.date,
      type: 'Manufacturing',
      narration: `Sheet Making - ${batchData.productionType} - ${batchData.narration || ''}`
    }, [], inventoryData);

    const batch = {
      id, date: batchData.date || formatDate(),
      stage: 'sheet',
      productionType: batchData.productionType,
      inputItems: batchData.inputItems,
      outputKg: batchData.outputKg,
      operatorName: batchData.operatorName || '',
      narration: batchData.narration || '',
      voucherId: voucher.id
    };
    this.data.productionBatches.push(batch);
    this.saveData();
    return batch;
  }

  // ── Production: Stage 2 (Product Making) ──────────────
  addProductMakingBatch(batchData) {
    const id = generateId();
    const inventoryData = [];

    // Deduct sheet consumed
    const sheetId = batchData.productionType === 'silicon' ? 'sheet_silicon' : 'sheet_nonsilicon';
    inventoryData.push({ itemId: sheetId, itemType: 'sheet', qty: -Math.abs(batchData.sheetConsumedKg), rate: 0, amount: 0 });

    // Deduct additional chemicals if any
    if (batchData.additionalChemicals) {
      batchData.additionalChemicals.forEach(ch => {
        inventoryData.push({ itemId: ch.itemId, itemType: 'chemical', qty: -Math.abs(ch.qty), rate: 0, amount: 0 });
      });
    }

    // Add finished goods produced
    inventoryData.push({ itemId: batchData.productId, itemType: 'product', qty: Math.abs(batchData.outputQty), rate: 0, amount: 0 });

    // Add cutting waste (non-silicon only)
    let wasteKg = Number(batchData.wasteKg) || 0;
    let wastePercent = 0;
    if (batchData.productionType === 'non-silicon' && wasteKg > 0) {
      inventoryData.push({ itemId: 'waste_nonsilicon', itemType: 'waste', qty: wasteKg, rate: 0, amount: 0 });
      wastePercent = batchData.sheetConsumedKg > 0 ? ((wasteKg / batchData.sheetConsumedKg) * 100).toFixed(1) : 0;
    }

    const voucher = this.addVoucher({
      date: batchData.date,
      type: 'Manufacturing',
      narration: `Product Making - ${batchData.productName || ''} - ${batchData.narration || ''}`
    }, [], inventoryData);

    const batch = {
      id, date: batchData.date || formatDate(),
      stage: 'product',
      productionType: batchData.productionType,
      productId: batchData.productId,
      sheetConsumedKg: batchData.sheetConsumedKg,
      additionalChemicals: batchData.additionalChemicals || [],
      outputQty: batchData.outputQty,
      wasteKg, wastePercent: Number(wastePercent),
      operatorName: batchData.operatorName || '',
      narration: batchData.narration || '',
      voucherId: voucher.id
    };
    this.data.productionBatches.push(batch);
    this.saveData();
    return batch;
  }

  // ── Customer Order ─────────────────────────────────────
  addCustomerOrder(order) {
    order.id = generateId();
    order.status = 'pending';
    order.date = order.date || formatDate();
    order.linkedInvoiceIds = [];
    // Initialize fulfilledQty = 0 for each item
    (order.items || []).forEach(item => { item.fulfilledQty = 0; });
    this.data.customerOrders.push(order);
    this.saveData();
    return order;
  }

  // Helper: get remaining qty for an order
  getOrderRemainingQty(orderId) {
    const order = this.data.customerOrders.find(o => o.id === orderId);
    if(!order) return [];
    return order.items.map(item => ({
      productId: item.productId,
      orderedQty: item.qty,
      fulfilledQty: item.fulfilledQty || 0,
      remainingQty: Math.max(0, item.qty - (item.fulfilledQty || 0)),
      description: item.description
    }));
  }

  // ── Payment / Receipt Voucher ─────────────────────────
  addPaymentVoucher(data) {
    const supAcc = this._getOrCreatePartyAccount(data.partyId, 'supplier');
    const detailsData = [
      { accountId: supAcc.id, partyId: data.partyId, drAmount: data.amount, crAmount: 0 },
      { accountId: data.accountId, drAmount: 0, crAmount: data.amount }
    ];

    const voucher = this.addVoucher({
      date: data.date,
      type: 'Payment',
      narration: data.narration || `Payment to supplier`
    }, detailsData);

    // Cheque tracking
    if (data.chequeNo) {
      this.data.cheques.push({
        id: generateId(), type: 'issued', partyId: data.partyId, partyType: 'supplier',
        chequeNo: data.chequeNo, date: data.date, bankName: data.bankName || '',
        amount: data.amount, status: 'pending', voucherId: voucher.id
      });
      this.saveData();
    }

    return voucher;
  }

  addReceiptVoucher(data) {
    const custAcc = this._getOrCreatePartyAccount(data.partyId, 'customer');
    const detailsData = [
      { accountId: data.accountId, drAmount: data.amount, crAmount: 0 },
      { accountId: custAcc.id, partyId: data.partyId, drAmount: 0, crAmount: data.amount }
    ];

    const voucher = this.addVoucher({
      date: data.date,
      type: 'Receipt',
      narration: data.narration || `Receipt from customer`
    }, detailsData);

    if (data.chequeNo) {
      this.data.cheques.push({
        id: generateId(), type: 'received', partyId: data.partyId, partyType: 'customer',
        chequeNo: data.chequeNo, date: data.date, bankName: data.bankName || '',
        amount: data.amount, status: 'pending', voucherId: voucher.id
      });
      this.saveData();
    }

    return voucher;
  }

  updateChequeStatus(chequeId, status) {
    const ch = this.data.cheques.find(c => c.id === chequeId);
    if (ch) { ch.status = status; this.saveData(); }
  }

  // ── Helper: Get or create party ledger account ────────
  _getOrCreatePartyAccount(partyId, partyType) {
    const accId = `party_${partyId}`;
    let acc = this.data.accounts.find(a => a.id === accId);
    if (!acc) {
      let name, group, type;
      if (partyType === 'customer') {
        const cust = this.data.customers.find(c => c.id === partyId);
        name = cust ? cust.name : 'Unknown Customer';
        group = 'Sundry Debtors';
        type = 'Asset';
      } else {
        const sup = this.data.suppliers.find(s => s.id === partyId);
        name = sup ? sup.name : 'Unknown Supplier';
        group = 'Sundry Creditors';
        type = 'Liability';
      }
      acc = { id: accId, name, group, type };
      this.data.accounts.push(acc);
      this.saveData();
    }
    return acc;
  }

  // ══════════════════════════════════════════════════════
  // QUERIES
  // ══════════════════════════════════════════════════════

  getLedgerBalance(accountId) {
    const details = this.data.voucherDetails.filter(d => d.accountId === accountId);
    let dr = 0, cr = 0;
    details.forEach(d => { dr += d.drAmount; cr += d.crAmount; });
    return dr - cr; // positive = debit balance
  }

  getLedgerEntries(accountId) {
    return this.data.voucherDetails
      .filter(d => d.accountId === accountId)
      .map(d => {
        const v = this.data.vouchers.find(v => v.id === d.voucherId);
        return { ...d, voucher: v };
      })
      .sort((a, b) => new Date(a.voucher?.date) - new Date(b.voucher?.date));
  }

  getTrialBalance() {
    const tb = [];
    let totDr = 0, totCr = 0;
    this.data.accounts.forEach(acc => {
      const bal = this.getLedgerBalance(acc.id);
      if (bal !== 0) {
        const isDebit = bal > 0;
        tb.push({ account: acc, dr: isDebit ? bal : 0, cr: !isDebit ? Math.abs(bal) : 0 });
        if (isDebit) totDr += bal; else totCr += Math.abs(bal);
      }
    });
    return { accounts: tb, totDr, totCr };
  }

  getBalanceSheet() {
    const assets = { group: 'Assets', items: [], total: 0 };
    const liabilities = { group: 'Liabilities & Capital', items: [], total: 0 };
    let profitLoss = 0;

    this.data.accounts.forEach(acc => {
      const bal = this.getLedgerBalance(acc.id);
      if (bal === 0) return;
      if (acc.type === 'Asset') { assets.items.push({ name: acc.name, amount: bal }); assets.total += bal; }
      else if (acc.type === 'Liability' || acc.type === 'Equity') { liabilities.items.push({ name: acc.name, amount: -bal }); liabilities.total += -bal; }
      else if (acc.type === 'Income') { profitLoss += (-bal); }
      else if (acc.type === 'Expense') { profitLoss -= bal; }
    });

    if (profitLoss !== 0) {
      liabilities.items.push({ name: 'Profit & Loss (Current Year)', amount: profitLoss });
      liabilities.total += profitLoss;
    }
    return { assets, liabilities };
  }

  getProfitAndLoss() {
    const incomes = [];
    const expenses = [];
    let totalIncome = 0, totalExpense = 0;

    this.data.accounts.forEach(acc => {
      const bal = this.getLedgerBalance(acc.id);
      if (bal === 0) return;
      if (acc.type === 'Income') {
        const amt = -bal; // income is credit balance
        incomes.push({ name: acc.name, amount: amt });
        totalIncome += amt;
      } else if (acc.type === 'Expense') {
        expenses.push({ name: acc.name, amount: bal });
        totalExpense += bal;
      }
    });
    return { incomes, expenses, totalIncome, totalExpense, netProfit: totalIncome - totalExpense };
  }

  // ── Stock Queries ──────────────────────────────────────
  getChemicalStock() {
    const stock = {};
    this.data.chemicals.forEach(c => { stock[c.id] = { item: c, qty: 0 }; });
    this.data.inventoryTransactions.filter(t => t.itemType === 'chemical').forEach(t => {
      if (stock[t.itemId]) stock[t.itemId].qty += t.qty;
    });
    return Object.values(stock);
  }

  getSheetStock() {
    const stock = {};
    this.data.sheetTypes.forEach(s => { stock[s.id] = { item: s, qty: 0 }; });
    this.data.inventoryTransactions.filter(t => t.itemType === 'sheet').forEach(t => {
      if (stock[t.itemId]) stock[t.itemId].qty += t.qty;
    });
    return Object.values(stock);
  }

  getProductStock() {
    const stock = {};
    this.data.products.forEach(p => { stock[p.id] = { item: p, qty: 0 }; });
    this.data.inventoryTransactions.filter(t => t.itemType === 'product').forEach(t => {
      if (stock[t.itemId]) stock[t.itemId].qty += t.qty;
    });
    return Object.values(stock);
  }

  getWasteStock() {
    let qty = 0;
    this.data.inventoryTransactions.filter(t => t.itemType === 'waste').forEach(t => { qty += t.qty; });
    return qty;
  }

  getLowStockAlerts() {
    const alerts = [];
    this.getChemicalStock().forEach(s => {
      if (s.qty < (s.item.minStock || 0)) {
        alerts.push({ type: 'chemical', name: s.item.name, currentQty: s.qty, minStock: s.item.minStock, unit: s.item.unit });
      }
    });
    return alerts;
  }

  // ── GST Queries ────────────────────────────────────────
  getGSTSummary() {
    let inputCGST = 0, inputSGST = 0, inputIGST = 0;
    let outputCGST = 0, outputSGST = 0, outputIGST = 0;
    
    this.data.purchaseInvoices.forEach(inv => {
      inputCGST += inv.cgst; inputSGST += inv.sgst; inputIGST += inv.igst;
    });
    this.data.salesInvoices.forEach(inv => {
      outputCGST += inv.cgst; outputSGST += inv.sgst; outputIGST += inv.igst;
    });

    const totalInput = inputCGST + inputSGST + inputIGST;
    const totalOutput = outputCGST + outputSGST + outputIGST;
    return { inputCGST, inputSGST, inputIGST, outputCGST, outputSGST, outputIGST, totalInput, totalOutput, netPayable: totalOutput - totalInput };
  }

  getHSNSummary() {
    const hsn = {};
    this.data.salesInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const key = item.hsnCode || 'N/A';
        if (!hsn[key]) hsn[key] = { hsnCode: key, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
        hsn[key].taxableValue += item.amount;
        const gst = item.gstAmount || 0;
        // Simplified allocation
        hsn[key].totalTax += gst;
      });
    });
    return Object.values(hsn);
  }

  // ── Outstanding ────────────────────────────────────────
  getOutstandingReceivables() {
    const result = [];
    this.data.customers.forEach(cust => {
      const acc = this.data.accounts.find(a => a.id === `party_${cust.id}`);
      if (acc) {
        const bal = this.getLedgerBalance(acc.id);
        if (bal > 0) result.push({ party: cust, amount: bal });
      }
    });
    return result;
  }

  getOutstandingPayables() {
    const result = [];
    this.data.suppliers.forEach(sup => {
      const acc = this.data.accounts.find(a => a.id === `party_${sup.id}`);
      if (acc) {
        const bal = this.getLedgerBalance(acc.id);
        if (bal < 0) result.push({ party: sup, amount: Math.abs(bal) });
      }
    });
    return result;
  }

  // ── Account Balances ───────────────────────────────────
  getAccountBalances() {
    return this.data.accounts
      .filter(a => a.accountKind === 'cash' || a.accountKind === 'bank' || a.accountKind === 'upi')
      .map(a => ({ account: a, balance: this.getLedgerBalance(a.id) }));
  }

  getRecentTransactions(limit = 10) {
    return [...this.data.vouchers].reverse().slice(0, limit);
  }

  getProductionBatches(stage = null) {
    let batches = [...this.data.productionBatches].reverse();
    if (stage) batches = batches.filter(b => b.stage === stage);
    return batches;
  }

  // ══════════════════════════════════════════════════════
  // PURCHASE RETURN (Debit Note)
  // ══════════════════════════════════════════════════════
  addPurchaseReturn(data) {
    const id = generateId();
    const isInterState = data.supplierStateCode && data.supplierStateCode !== this.data.companyInfo.stateCode;
    let subtotal = 0, totalCgst = 0, totalSgst = 0, totalIgst = 0;
    const inventoryData = [];

    data.items.forEach(item => {
      const amt = item.qty * item.rate;
      const gst = amt * (item.gstRate / 100);
      subtotal += amt;
      if (isInterState) { totalIgst += gst; } else { totalCgst += gst / 2; totalSgst += gst / 2; }
      item.amount = amt; item.gstAmount = gst;
      // Reverse inventory (negative qty = stock going out)
      inventoryData.push({ itemId: item.chemicalId, itemType: 'chemical', qty: -item.qty, rate: item.rate, amount: amt });
    });

    const grandTotal = subtotal + totalCgst + totalSgst + totalIgst;
    const detailsData = [];

    // Cr Supplier (reduce payable) or Dr payment account
    const supAcc = this._getOrCreatePartyAccount(data.supplierId, 'supplier');
    detailsData.push({ accountId: supAcc.id, partyId: data.supplierId, drAmount: grandTotal, crAmount: 0 });
    // Dr Purchase Returns
    detailsData.push({ accountId: 'acc_purchase_return', drAmount: 0, crAmount: subtotal });
    // Reverse GST input
    if (isInterState) {
      detailsData.push({ accountId: 'acc_gst_input_igst', drAmount: 0, crAmount: totalIgst });
    } else {
      detailsData.push({ accountId: 'acc_gst_input', drAmount: 0, crAmount: totalCgst });
      detailsData.push({ accountId: 'acc_gst_input_sgst', drAmount: 0, crAmount: totalSgst });
    }

    const voucher = this.addVoucher({
      date: data.date, type: 'Debit Note',
      narration: `Purchase Return to ${data.supplierName || ''} - DN# ${data.debitNoteNo || ''}`,
      refInvoiceNo: data.debitNoteNo
    }, detailsData, inventoryData);

    const returnEntry = {
      id, voucherId: voucher.id, supplierId: data.supplierId,
      debitNoteNo: data.debitNoteNo || `DN-${(this.data.purchaseReturns.length + 1).toString().padStart(5, '0')}`,
      originalInvoiceNo: data.originalInvoiceNo || '',
      date: data.date || formatDate(), items: data.items,
      subtotal, cgst: totalCgst, sgst: totalSgst, igst: totalIgst, grandTotal,
      reason: data.reason || ''
    };
    this.data.purchaseReturns.push(returnEntry);
    this.saveData();
    return returnEntry;
  }

  deletePurchaseReturn(id) {
    const ret = this.data.purchaseReturns.find(r => r.id === id);
    if(ret) { this.deleteVoucher(ret.voucherId); this.data.purchaseReturns = this.data.purchaseReturns.filter(r => r.id !== id); this.saveData(); }
  }

  // ══════════════════════════════════════════════════════
  // SALES RETURN (Credit Note)
  // ══════════════════════════════════════════════════════
  addSalesReturn(data) {
    const id = generateId();
    const isInterState = data.customerStateCode && data.customerStateCode !== this.data.companyInfo.stateCode;
    let subtotal = 0, totalCgst = 0, totalSgst = 0, totalIgst = 0;
    const inventoryData = [];

    data.items.forEach(item => {
      const amt = item.qty * item.rate;
      const gst = amt * (item.gstRate / 100);
      subtotal += amt;
      if (isInterState) { totalIgst += gst; } else { totalCgst += gst / 2; totalSgst += gst / 2; }
      item.amount = amt; item.gstAmount = gst;
      // Add back to inventory (positive qty = stock coming in)
      inventoryData.push({ itemId: item.productId, itemType: 'product', qty: item.qty, rate: item.rate, amount: amt });
    });

    const grandTotal = subtotal + totalCgst + totalSgst + totalIgst;
    const detailsData = [];

    // Cr Customer (reduce receivable)
    const custAcc = this._getOrCreatePartyAccount(data.customerId, 'customer');
    detailsData.push({ accountId: custAcc.id, partyId: data.customerId, drAmount: 0, crAmount: grandTotal });
    // Dr Sales Returns
    detailsData.push({ accountId: 'acc_sales_return', drAmount: subtotal, crAmount: 0 });
    // Reverse GST output
    if (isInterState) {
      detailsData.push({ accountId: 'acc_gst_output_igst', drAmount: totalIgst, crAmount: 0 });
    } else {
      detailsData.push({ accountId: 'acc_gst_output', drAmount: totalCgst, crAmount: 0 });
      detailsData.push({ accountId: 'acc_gst_output_sgst', drAmount: totalSgst, crAmount: 0 });
    }

    const voucher = this.addVoucher({
      date: data.date, type: 'Credit Note',
      narration: `Sales Return from ${data.customerName || ''} - CN# ${data.creditNoteNo || ''}`,
      refInvoiceNo: data.creditNoteNo
    }, detailsData, inventoryData);

    const returnEntry = {
      id, voucherId: voucher.id, customerId: data.customerId,
      creditNoteNo: data.creditNoteNo || `CN-${(this.data.salesReturns.length + 1).toString().padStart(5, '0')}`,
      originalInvoiceNo: data.originalInvoiceNo || '',
      date: data.date || formatDate(), items: data.items,
      subtotal, cgst: totalCgst, sgst: totalSgst, igst: totalIgst, grandTotal,
      reason: data.reason || ''
    };
    this.data.salesReturns.push(returnEntry);
    this.saveData();
    return returnEntry;
  }

  deleteSalesReturn(id) {
    const ret = this.data.salesReturns.find(r => r.id === id);
    if(ret) { this.deleteVoucher(ret.voucherId); this.data.salesReturns = this.data.salesReturns.filter(r => r.id !== id); this.saveData(); }
  }

  // ══════════════════════════════════════════════════════
  // EXPENSE MANAGEMENT
  // ══════════════════════════════════════════════════════
  addExpense(data) {
    const id = generateId();
    const detailsData = [
      { accountId: data.expenseAccountId, drAmount: data.amount, crAmount: 0 },
      { accountId: data.paidFrom, drAmount: 0, crAmount: data.amount }
    ];

    const expenseAcc = this.data.accounts.find(a => a.id === data.expenseAccountId);
    const voucher = this.addVoucher({
      date: data.date, type: 'Expense',
      narration: `${expenseAcc?.name || 'Expense'} — ${data.description || ''}`
    }, detailsData);

    const expense = {
      id, voucherId: voucher.id, date: data.date || formatDate(),
      category: expenseAcc?.name || 'Uncategorized',
      expenseAccountId: data.expenseAccountId,
      amount: data.amount, paidFrom: data.paidFrom,
      description: data.description || '',
      recurring: data.recurring || false
    };
    this.data.expenses.push(expense);
    this.saveData();
    return expense;
  }

  deleteExpense(id) {
    const exp = this.data.expenses.find(e => e.id === id);
    if(exp) { this.deleteVoucher(exp.voucherId); this.data.expenses = this.data.expenses.filter(e => e.id !== id); this.saveData(); }
  }

  getExpenseSummary() {
    const byCategory = {};
    let totalExpenses = 0;
    this.data.expenses.forEach(exp => {
      if(!byCategory[exp.category]) byCategory[exp.category] = 0;
      byCategory[exp.category] += exp.amount;
      totalExpenses += exp.amount;
    });
    return { byCategory, totalExpenses, expenses: [...this.data.expenses].reverse() };
  }

  // ══════════════════════════════════════════════════════
  // LOAN MANAGEMENT
  // ══════════════════════════════════════════════════════
  addLoan(data) {
    const id = generateId();
    const loanAccountId = data.type === 'taken' ? 'acc_loan_taken' : 'acc_loan_given';
    const monthlyRate = (data.interestRate || 0) / 12 / 100;
    let emiAmount = 0;
    if(monthlyRate > 0 && data.tenureMonths > 0) {
      emiAmount = Math.round((data.principalAmount * monthlyRate * Math.pow(1 + monthlyRate, data.tenureMonths)) / (Math.pow(1 + monthlyRate, data.tenureMonths) - 1));
    } else if(data.tenureMonths > 0) {
      emiAmount = Math.round(data.principalAmount / data.tenureMonths);
    }

    // Journal entry for loan disbursement
    const detailsData = [];
    if(data.type === 'taken') {
      // Loan taken: Dr Bank/Cash, Cr Loan Liability
      detailsData.push({ accountId: data.receiveInto || 'acc_cash', drAmount: data.principalAmount, crAmount: 0 });
      detailsData.push({ accountId: loanAccountId, drAmount: 0, crAmount: data.principalAmount });
    } else {
      // Loan given: Dr Loan Asset, Cr Bank/Cash
      detailsData.push({ accountId: loanAccountId, drAmount: data.principalAmount, crAmount: 0 });
      detailsData.push({ accountId: data.paidFrom || 'acc_cash', drAmount: 0, crAmount: data.principalAmount });
    }

    const voucher = this.addVoucher({
      date: data.startDate, type: 'Journal',
      narration: `Loan ${data.type} — ${data.partyName} — ₹${data.principalAmount}`
    }, detailsData);

    const loan = {
      id, type: data.type, partyName: data.partyName || '',
      principalAmount: data.principalAmount, interestRate: data.interestRate || 0,
      startDate: data.startDate || formatDate(), tenureMonths: data.tenureMonths || 12,
      emiAmount, totalPaid: 0, status: 'active', emis: [],
      accountId: data.receiveInto || data.paidFrom || 'acc_cash',
      description: data.description || '', voucherId: voucher.id
    };
    this.data.loans.push(loan);
    this.saveData();
    return loan;
  }

  addLoanEMI(loanId, data) {
    const loan = this.data.loans.find(l => l.id === loanId);
    if(!loan) return null;

    const principal = data.principalComponent || 0;
    const interest = data.interestComponent || 0;
    const totalEmi = principal + interest;

    const detailsData = [];
    if(loan.type === 'taken') {
      // EMI paid: Dr Loan A/c (principal), Dr Interest (interest), Cr Bank
      detailsData.push({ accountId: 'acc_loan_taken', drAmount: principal, crAmount: 0 });
      if(interest > 0) detailsData.push({ accountId: 'acc_interest_paid', drAmount: interest, crAmount: 0 });
      detailsData.push({ accountId: data.paidFrom || 'acc_cash', drAmount: 0, crAmount: totalEmi });
    } else {
      // EMI received: Dr Bank, Cr Loan A/c (principal), Cr Interest (interest)
      detailsData.push({ accountId: data.receivedIn || 'acc_cash', drAmount: totalEmi, crAmount: 0 });
      detailsData.push({ accountId: 'acc_loan_given', drAmount: 0, crAmount: principal });
      if(interest > 0) detailsData.push({ accountId: 'acc_interest_received', drAmount: 0, crAmount: interest });
    }

    const voucher = this.addVoucher({
      date: data.date, type: 'Journal',
      narration: `EMI ${loan.type === 'taken' ? 'payment' : 'receipt'} — ${loan.partyName} — ₹${totalEmi}`
    }, detailsData);

    const emiEntry = {
      id: generateId(), date: data.date || formatDate(), voucherId: voucher.id,
      principalComponent: principal, interestComponent: interest, totalAmount: totalEmi,
      paidFrom: data.paidFrom || data.receivedIn || 'acc_cash'
    };
    loan.emis.push(emiEntry);
    loan.totalPaid += totalEmi;

    // Check if loan is fully paid
    if(loan.totalPaid >= loan.principalAmount + (loan.principalAmount * (loan.interestRate/100) * (loan.tenureMonths/12))) {
      loan.status = 'closed';
    }
    this.saveData();
    return emiEntry;
  }

  deleteLoan(id) {
    const loan = this.data.loans.find(l => l.id === id);
    if(loan) {
      // Delete all EMI vouchers
      loan.emis.forEach(emi => this.deleteVoucher(emi.voucherId));
      // Delete disbursement voucher
      this.deleteVoucher(loan.voucherId);
      this.data.loans = this.data.loans.filter(l => l.id !== id);
      this.saveData();
    }
  }

  getLoanSummary() {
    const active = this.data.loans.filter(l => l.status === 'active');
    const closed = this.data.loans.filter(l => l.status === 'closed');
    const totalTaken = active.filter(l => l.type === 'taken').reduce((s, l) => s + l.principalAmount, 0);
    const totalGiven = active.filter(l => l.type === 'given').reduce((s, l) => s + l.principalAmount, 0);
    const totalPaidEMI = active.reduce((s, l) => s + l.totalPaid, 0);
    return { active, closed, totalTaken, totalGiven, totalPaidEMI, all: [...this.data.loans].reverse() };
  }

  // ── Outstanding Reports ─────────────────────────────
  getOutstandingReceivables() {
    // Each customer with positive balance (they owe us)
    return this.data.customers.map(c => {
      const acc = this.data.accounts.find(a => a.id === c.accountId);
      if(!acc) return null;
      const bal = this.getLedgerBalance(acc.id);
      return bal > 0 ? { party: c, account: acc, amount: bal } : null;
    }).filter(Boolean);
  }

  getOutstandingPayables() {
    // Each supplier with positive credit balance (we owe them)
    return this.data.suppliers.map(s => {
      const acc = this.data.accounts.find(a => a.id === s.accountId);
      if(!acc) return null;
      const bal = this.getLedgerBalance(acc.id);
      // Creditors have credit balance, so negative ledger bal means we owe
      return bal < 0 ? { party: s, account: acc, amount: Math.abs(bal) } : null;
    }).filter(Boolean);
  }

  // SEED SAMPLE DATA — Realistic 2-week factory flow
  // ══════════════════════════════════════════════════════
  seedSampleData() {
    // Only seed if no vouchers exist
    if(this.data.vouchers.length > 0) return;

    // ─── Day 1: Capital injection ──────────────────────
    this.addVoucher(
      { date: '2026-03-12', type: 'Receipt', narration: 'Owner capital investment' },
      [
        { accountId: 'acc_sbi', drAmount: 500000, crAmount: 0 },
        { accountId: 'acc_cash', drAmount: 100000, crAmount: 0 },
        { accountId: 'acc_capital', drAmount: 0, crAmount: 600000 }
      ]
    );

    // ─── Day 2: Purchase from National Chemicals (Delhi = inter-state) ─
    this.addPurchaseInvoice({
      supplierId: 'sup_1', supplierName: 'National Chemicals', supplierStateCode: '07',
      invoiceNo: 'NC-2026-1087', date: '2026-03-13',
      items: [
        { chemicalId: 'chem_1', qty: 500, rate: 65, gstRate: 18 },
        { chemicalId: 'chem_2', qty: 200, rate: 140, gstRate: 18 },
        { chemicalId: 'chem_3', qty: 100, rate: 45, gstRate: 5 },
        { chemicalId: 'chem_4', qty: 80, rate: 95, gstRate: 18 },
      ],
      paymentMode: 'credit'
    });

    // ─── Day 3: Purchase from Gujarat Rubber (Gujarat = inter-state) ─
    this.addPurchaseInvoice({
      supplierId: 'sup_2', supplierName: 'Gujarat Rubber Co', supplierStateCode: '24',
      invoiceNo: 'GRC-4421', date: '2026-03-14',
      items: [
        { chemicalId: 'chem_5', qty: 800, rate: 210, gstRate: 18 },
        { chemicalId: 'chem_6', qty: 600, rate: 180, gstRate: 18 },
      ],
      paymentMode: 'credit'
    });

    // ─── Day 4: Partial payment to National Chemicals ──
    this.addPaymentVoucher({
      partyId: 'sup_1', amount: 30000, date: '2026-03-15',
      accountId: 'acc_sbi', narration: 'Part payment to National Chemicals'
    });

    // ─── Day 5: Sheet Making Batch 1 (Silicon) ─────────
    this.addSheetMakingBatch({
      date: '2026-03-16', productionType: 'silicon',
      inputItems: [
        { itemId: 'chem_5', itemType: 'chemical', qty: 300 },
        { itemId: 'chem_1', itemType: 'chemical', qty: 50 },
        { itemId: 'chem_4', itemType: 'chemical', qty: 15 },
      ],
      outputKg: 340,
      operatorName: 'Raju', narration: 'Silicon Batch #1'
    });

    // ─── Day 5: Sheet Making Batch 2 (Non-Silicon) ─────
    this.addSheetMakingBatch({
      date: '2026-03-16', productionType: 'non-silicon',
      inputItems: [
        { itemId: 'chem_6', itemType: 'chemical', qty: 250 },
        { itemId: 'chem_1', itemType: 'chemical', qty: 80 },
        { itemId: 'chem_2', itemType: 'chemical', qty: 40 },
        { itemId: 'chem_3', itemType: 'chemical', qty: 20 },
      ],
      outputKg: 370,
      operatorName: 'Ramesh', narration: 'Non-Silicon Batch #1'
    });

    // ─── Day 7: Product Making — Silicon O-Ring ────────
    this.addProductMakingBatch({
      date: '2026-03-18', productionType: 'silicon',
      productId: 'prod_1', productName: 'Silicon O-Ring 25mm',
      sheetConsumedKg: 120,
      additionalChemicals: [],
      outputQty: 5000,
      wasteKg: 0, // silicon — no waste tracking
      operatorName: 'Raju', narration: 'O-Ring Batch #1'
    });

    // ─── Day 7: Product Making — Silicon Gasket ────────
    this.addProductMakingBatch({
      date: '2026-03-18', productionType: 'silicon',
      productId: 'prod_3', productName: 'Silicon Gasket 50mm',
      sheetConsumedKg: 80,
      additionalChemicals: [],
      outputQty: 1200,
      wasteKg: 0,
      operatorName: 'Raju', narration: 'Gasket Batch #1'
    });

    // ─── Day 8: Product Making — Non-Silicon Bush Washer ─
    this.addProductMakingBatch({
      date: '2026-03-19', productionType: 'non-silicon',
      productId: 'prod_2', productName: 'Non-Silicon Bush Washer 3mm',
      sheetConsumedKg: 150,
      additionalChemicals: [
        { itemId: 'chem_3', qty: 5 }
      ],
      outputQty: 8000,
      wasteKg: 18,
      operatorName: 'Ramesh', narration: 'Bush Washer Batch #1 — 12% waste'
    });

    // ─── Day 9: Customer Order 1 — Mahindra ────────────
    this.addCustomerOrder({
      customerId: 'cust_1', date: '2026-03-20', dueDate: '2026-04-05',
      items: [
        { productId: 'prod_1', qty: 2000, description: 'Silicon O-Ring 25mm as per sample ref MAH-OR-25' },
        { productId: 'prod_3', qty: 500, description: 'Silicon Gasket 50mm — tolerance ±0.5mm' },
      ]
    });

    // ─── Day 9: Customer Order 2 — Tata ────────────────
    this.addCustomerOrder({
      customerId: 'cust_2', date: '2026-03-20', dueDate: '2026-04-10',
      items: [
        { productId: 'prod_2', qty: 5000, description: 'Non-Silicon Bush Washer 3mm for engine assembly' },
      ]
    });

    // ─── Day 10: Sales Invoice 1 — Mahindra (fulfilling order 1) ─
    const orders = this.data.customerOrders;
    const ord1 = orders.find(o => o.customerId === 'cust_1' && o.status === 'pending');
    this.addSalesInvoice({
      customerId: 'cust_1', customerName: 'Mahindra Auto Parts', customerStateCode: '27',
      invoiceNo: 'INV-00001', date: '2026-03-21',
      items: [
        { productId: 'prod_1', qty: 2000, rate: 15, gstRate: 18, hsnCode: '40169320' },
        { productId: 'prod_3', qty: 500, rate: 45, gstRate: 18, hsnCode: '40169320' },
      ],
      paymentMode: 'credit',
      orderId: ord1 ? ord1.id : ''
    });

    // ─── Day 11: Sales Invoice 2 — Tata (partial fulfillment) ─
    const ord2 = orders.find(o => o.customerId === 'cust_2' && o.status === 'pending');
    this.addSalesInvoice({
      customerId: 'cust_2', customerName: 'Tata Components Ltd', customerStateCode: '27',
      invoiceNo: 'INV-00002', date: '2026-03-22',
      items: [
        { productId: 'prod_2', qty: 5000, rate: 8, gstRate: 18, hsnCode: '40169390' },
      ],
      paymentMode: 'credit',
      orderId: ord2 ? ord2.id : ''
    });

    // ─── Day 12: Receipt from Mahindra (partial) ───────
    this.addReceiptVoucher({
      partyId: 'cust_1', amount: 25000, date: '2026-03-23',
      accountId: 'acc_sbi', narration: 'Part payment from Mahindra - Cheque',
      chequeNo: '784521', bankName: 'ICICI'
    });

    // ─── Day 13: Payment to Gujarat Rubber ─────────────
    this.addPaymentVoucher({
      partyId: 'sup_2', amount: 100000, date: '2026-03-24',
      accountId: 'acc_hdfc', narration: 'Payment to Gujarat Rubber Co',
      chequeNo: '112233', bankName: 'HDFC'
    });

    // ─── Day 13: Receipt from Tata via UPI ─────────────
    this.addReceiptVoucher({
      partyId: 'cust_2', amount: 20000, date: '2026-03-24',
      accountId: 'acc_gpay', narration: 'UPI payment from Tata Components'
    });

    // ─── Day 14: Sheet Making Batch 3 (Non-Silicon) ────
    // Recycling some cutting waste back into production!
    this.addSheetMakingBatch({
      date: '2026-03-25', productionType: 'non-silicon',
      inputItems: [
        { itemId: 'chem_6', itemType: 'chemical', qty: 200 },
        { itemId: 'chem_1', itemType: 'chemical', qty: 60 },
        { itemId: 'waste_nonsilicon', itemType: 'waste', qty: 10 }, // recycling waste!
      ],
      outputKg: 260,
      operatorName: 'Ramesh', narration: 'Non-Silicon Batch #2 — with recycled waste'
    });

    // ─── Day 14: Scrap sale of remaining waste ─────────
    const wasteLeft = this.getWasteStock();
    if(wasteLeft > 0) {
      const scrapQty = Math.min(5, wasteLeft);
      this.addVoucher(
        { date: '2026-03-25', type: 'Sales', narration: `Scrap sale to Raju Scrap Dealer - ${scrapQty}Kg @ ₹12` },
        [
          { accountId: 'acc_cash', drAmount: scrapQty * 12, crAmount: 0 },
          { accountId: 'acc_scrap_income', drAmount: 0, crAmount: scrapQty * 12 }
        ],
        [{ itemId: 'waste_nonsilicon', itemType: 'waste', qty: -scrapQty, rate: 12, amount: scrapQty * 12 }]
      );
    }

    // Mark one cheque as cleared
    const pendingCheque = this.data.cheques.find(c => c.status === 'pending' && c.type === 'received');
    if(pendingCheque) this.updateChequeStatus(pendingCheque.id, 'cleared');

    // ═══════════════════════════════════════════════════
    // NEW MODULES SEED DATA
    // ═══════════════════════════════════════════════════

    // ─── Purchase Return: Returning defective Zinc Oxide ──
    this.addPurchaseReturn({
      supplierId: 'sup_1', supplierName: 'National Chemicals', supplierStateCode: '07',
      originalInvoiceNo: 'NC-2026-1087', date: '2026-03-20',
      items: [{ chemicalId: 'chem_2', qty: 25, rate: 140, gstRate: 18 }],
      reason: 'Zinc Oxide batch defective — impurities found during quality check'
    });

    // ─── Sales Return: Customer returned defective O-Rings ──
    this.addSalesReturn({
      customerId: 'cust_1', customerName: 'Mahindra Auto Parts', customerStateCode: '27',
      originalInvoiceNo: 'INV-00001', date: '2026-03-24',
      items: [{ productId: 'prod_1', qty: 100, rate: 15, gstRate: 18 }],
      reason: 'Size mismatch — 100 pcs O-Ring didn\'t meet tolerance spec'
    });

    // ─── Expenses ──
    this.addExpense({ expenseAccountId: 'acc_electricity', amount: 18500, date: '2026-03-15', paidFrom: 'acc_sbi', description: 'March electricity bill — MSEDCL', recurring: true });
    this.addExpense({ expenseAccountId: 'acc_rent', amount: 35000, date: '2026-03-12', paidFrom: 'acc_sbi', description: 'Factory rent for March 2026', recurring: true });
    this.addExpense({ expenseAccountId: 'acc_salary', amount: 85000, date: '2026-03-25', paidFrom: 'acc_sbi', description: 'Salary to 6 workers — March 2026', recurring: true });
    this.addExpense({ expenseAccountId: 'acc_transport', amount: 4500, date: '2026-03-14', paidFrom: 'acc_cash', description: 'Freight for chemical delivery from Delhi' });
    this.addExpense({ expenseAccountId: 'acc_repair', amount: 7800, date: '2026-03-18', paidFrom: 'acc_cash', description: 'Vulcanizer machine repair — bearing replacement' });
    this.addExpense({ expenseAccountId: 'acc_office', amount: 2200, date: '2026-03-20', paidFrom: 'acc_cash', description: 'Stationery + printer cartridge' });
    this.addExpense({ expenseAccountId: 'acc_misc_expense', amount: 1500, date: '2026-03-22', paidFrom: 'acc_cash', description: 'Tea & refreshments for factory' });

    // ─── Loan: Machinery loan from HDFC Bank ──
    const loanResult = this.addLoan({
      type: 'taken', partyName: 'HDFC Bank',
      principalAmount: 300000, interestRate: 12,
      tenureMonths: 24, startDate: '2026-01-15',
      receiveInto: 'acc_hdfc',
      description: 'Term loan for new hydraulic press machine'
    });

    // 2 EMIs already paid
    if(loanResult) {
      this.addLoanEMI(loanResult.id, { date: '2026-02-15', principalComponent: 10000, interestComponent: 3000, paidFrom: 'acc_hdfc' });
      this.addLoanEMI(loanResult.id, { date: '2026-03-15', principalComponent: 10500, interestComponent: 2500, paidFrom: 'acc_hdfc' });
    }

    // ─── Loan Given: Advance to worker Raju ──
    const advanceResult = this.addLoan({
      type: 'given', partyName: 'Raju (Worker)',
      principalAmount: 15000, interestRate: 0,
      tenureMonths: 3, startDate: '2026-03-01',
      paidFrom: 'acc_cash',
      description: 'Salary advance — will deduct ₹5000/month'
    });

    if(advanceResult) {
      this.addLoanEMI(advanceResult.id, { date: '2026-03-25', principalComponent: 5000, interestComponent: 0, receivedIn: 'acc_cash' });
    }

    console.log('✅ Sample data seeded successfully!');
  }
}

export const db = new Database();

// Auto-seed on first load if no data
db.seedSampleData();
