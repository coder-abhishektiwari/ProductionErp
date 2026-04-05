// ============================================================
// RUBBER FACTORY ERP — Complete Database Layer (Supabase Ready)
// ============================================================
// ARCHITECTURE: Offline-First with Supabase Cloud Sync
//   - IndexedDB is the PRIMARY data store (reads/writes)
//   - Supabase is the CLOUD SYNC target (via SyncEngine)
//   - No Express server dependency
// ============================================================

import { SyncEngine } from './supabase-sync.js';

// ── FIX 4: Use crypto.randomUUID() — collision-safe ───────
export const generateId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;

export const formatDate = (date = new Date()) => new Date(date).toISOString().split('T')[0];
export const fmt = (n) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Default Master Data ────────────────────────────────────
const defaultChemicals = [];
const defaultProducts = [];
const defaultSheetTypes = [];
const defaultCustomers = [];
const defaultSuppliers = [];

const defaultAccounts = [
  // 💰 CASH & BANK
  { id: 'acc_cash', name: 'Cash', group: 'Cash-in-Hand', type: 'Asset', accountKind: 'cash' },
  { id: 'acc_bank', name: 'Bank Account', group: 'Bank Accounts', type: 'Asset', accountKind: 'bank' },

  // 👤 PARTIES
  { id: 'acc_debtors', name: 'Sundry Debtors', group: 'Sundry Debtors', type: 'Asset', accountKind: 'customer' },
  { id: 'acc_creditors', name: 'Sundry Creditors', group: 'Sundry Creditors', type: 'Liability', accountKind: 'supplier' },

  // 💼 CAPITAL
  { id: 'acc_capital', name: 'Capital Account', group: 'Capital Account', type: 'Liability', accountKind: 'equity' },
  { id: 'acc_drawings', name: 'Drawings', group: 'Capital Account', type: 'Liability', accountKind: 'equity' },

  // 📦 SALES
  { id: 'acc_sales', name: 'Sales Account', group: 'Sales Accounts', type: 'Income', accountKind: 'income' },
  { id: 'acc_sales_return', name: 'Sales Return', group: 'Direct Expenses', type: 'Expense', accountKind: 'expense' },

  // 🛒 PURCHASE
  { id: 'acc_purchases', name: 'Purchase Account', group: 'Purchase Accounts', type: 'Expense', accountKind: 'expense' },
  { id: 'acc_purchase_return', name: 'Purchase Return', group: 'Direct Incomes', type: 'Income', accountKind: 'income' },

  // 🏭 DIRECT EXPENSES
  { id: 'acc_mfg', name: 'Manufacturing Expenses', group: 'Direct Expenses', type: 'Expense', accountKind: 'expense' },

  // 🏢 INDIRECT EXPENSES
  { id: 'acc_salary', name: 'Salary & Wages', group: 'Indirect Expenses', type: 'Expense', accountKind: 'expense' },
  { id: 'acc_rent', name: 'Rent', group: 'Indirect Expenses', type: 'Expense', accountKind: 'expense' },
  { id: 'acc_electricity', name: 'Electricity', group: 'Indirect Expenses', type: 'Expense', accountKind: 'expense' },
  { id: 'acc_transport', name: 'Transport & Freight', group: 'Indirect Expenses', type: 'Expense', accountKind: 'expense' },
  { id: 'acc_repair', name: 'Repair & Maintenance', group: 'Indirect Expenses', type: 'Expense', accountKind: 'expense' },
  { id: 'acc_office', name: 'Office Expenses', group: 'Indirect Expenses', type: 'Expense', accountKind: 'expense' },
  { id: 'acc_misc_expense', name: 'Misc Expenses', group: 'Indirect Expenses', type: 'Expense', accountKind: 'expense' },
  { id: 'acc_interest_paid', name: 'Interest Paid', group: 'Indirect Expenses', type: 'Expense', accountKind: 'expense' },
  { id: 'acc_discount_given', name: 'Discount Given', group: 'Indirect Expenses', type: 'Expense', accountKind: 'expense' },

  // 💵 INDIRECT INCOME
  { id: 'acc_interest_received', name: 'Interest Received', group: 'Indirect Incomes', type: 'Income', accountKind: 'income' },
  { id: 'acc_discount_received', name: 'Discount Received', group: 'Indirect Incomes', type: 'Income', accountKind: 'income' },

  // 📊 GST / TAXES
  { id: 'acc_gst_input_cgst', name: 'Input CGST', group: 'Duties & Taxes', type: 'Asset', accountKind: 'tax' },
  { id: 'acc_gst_input_sgst', name: 'Input SGST', group: 'Duties & Taxes', type: 'Asset', accountKind: 'tax' },
  { id: 'acc_gst_input_igst', name: 'Input IGST', group: 'Duties & Taxes', type: 'Asset', accountKind: 'tax' },

  { id: 'acc_gst_output_cgst', name: 'Output CGST', group: 'Duties & Taxes', type: 'Liability', accountKind: 'tax' },
  { id: 'acc_gst_output_sgst', name: 'Output SGST', group: 'Duties & Taxes', type: 'Liability', accountKind: 'tax' },
  { id: 'acc_gst_output_igst', name: 'Output IGST', group: 'Duties & Taxes', type: 'Liability', accountKind: 'tax' },

  // 🏦 LOANS
  { id: 'acc_loan_taken', name: 'Loan Taken', group: 'Loans (Liability)', type: 'Liability', accountKind: 'loan' },
  { id: 'acc_loan_given', name: 'Loan Given', group: 'Loans & Advances (Asset)', type: 'Asset', accountKind: 'loan' },

  // 📦 STOCK
  { id: 'acc_stock', name: 'Stock-in-Hand', group: 'Stock-in-Hand', type: 'Asset', accountKind: 'inventory' },

  // 🧾 OTHER SALES TYPES (optional advanced)
  { id: 'acc_scrap_income', name: 'Scrap Sales', group: 'Sales Accounts', type: 'Income', accountKind: 'income' },
  { id: 'acc_sheet_sale', name: 'Sheet Sales', group: 'Sales Accounts', type: 'Income', accountKind: 'income' }
];

// ── FIX 7: Sequence counters independent of array length ──
const defaultSequences = {
  voucher: 1,
  salesInvoice: 1,
  purchaseInvoice: 1,
  debitNote: 1,
  creditNote: 1,
  scrapInvoice: 1,
  sheetInvoice: 1,
  deliveryChallan: 1,
};

// ── Initial State ──────────────────────────────────────────
const initialState = {
  companyInfo: {
    name: 'ABC Rubber Industries',
    address: '',
    pincode: '',
    state: 'Maharashtra',
    stateCode: '27',
    country: 'India',
    countryCode: 'IN',
    gstin: '',
    phone: '',
    email: '',
    website: '',
    bankName: '',
    bankAcc: '',
    bankIfsc: '',
    bankBranch: '',
  },
  chemicals: defaultChemicals,
  products: defaultProducts,
  sheetTypes: defaultSheetTypes,
  customers: defaultCustomers,
  suppliers: defaultSuppliers,
  accounts: defaultAccounts,
  accountGroups: [
    { id: 'g_current_ast', name: 'Current Assets', type: 'Asset', parent: null },
    { id: 'g_fixed_ast', name: 'Fixed Assets', type: 'Asset', parent: null },

    { id: 'g_current_lib', name: 'Current Liabilities', type: 'Liability', parent: null },
    { id: 'g_capital', name: 'Capital Account', type: 'Liability', parent: null },
    { id: 'g_loans_lib', name: 'Loans (Liability)', type: 'Liability', parent: null },

    { id: 'g_direct_inc', name: 'Direct Incomes', type: 'Income', parent: null },
    { id: 'g_sales', name: 'Sales Accounts', type: 'Income', parent: 'g_direct_inc' },
    { id: 'g_other_inc', name: 'Indirect Incomes', type: 'Income', parent: null },

    { id: 'g_purchase', name: 'Purchase Accounts', type: 'Expense', parent: null },
    { id: 'g_dir_exp', name: 'Direct Expenses', type: 'Expense', parent: null },
    { id: 'g_indir_exp', name: 'Indirect Expenses', type: 'Expense', parent: null },

    { id: 'g_bank', name: 'Bank Accounts', type: 'Asset', parent: 'g_current_ast' },
    { id: 'g_cash', name: 'Cash-in-Hand', type: 'Asset', parent: 'g_current_ast' },
    { id: 'g_debtors', name: 'Sundry Debtors', type: 'Asset', parent: 'g_current_ast' },

    { id: 'g_creditors', name: 'Sundry Creditors', type: 'Liability', parent: 'g_current_lib' },

    { id: 'g_loans_ast', name: 'Loans & Advances (Asset)', type: 'Asset', parent: 'g_current_ast' },

    { id: 'g_duties', name: 'Duties & Taxes', type: 'Neutral', parent: null },

    { id: 'g_stock', name: 'Stock-in-Hand', type: 'Asset', parent: 'g_current_ast' },
  ],
  sequences: { ...defaultSequences }, // FIX 7

  // Transactions
  vouchers: [],
  voucherDetails: [],
  inventoryTransactions: [],

  // Production
  productionBatches: [],

  // Orders
  customerOrders: [],

  // Cheques
  cheques: [],

  // Invoices
  purchaseInvoices: [],
  salesInvoices: [],
  scrapSaleInvoices: [], // FIX 5 & FIX 11
  sheetSaleInvoices: [], // FIX 8 & FIX 11
  purchaseReturns: [],
  salesReturns: [],
  deliveryChallans: [],

  // Misc
  expenses: [],
  loans: [],

  // Company-level users (operators, accountants — NOT master login)
  companyUsers: [],
};

// ── FIX 3: Offline-first IndexedDB cache (Tenant Isolated) ──
const IDB = (() => {
  let db = null;
  // DB Name includes company_id to isolate local offline storage between companies
  const _getDbName = () => 'erp_offline_' + (localStorage.getItem('company_id') || 'DEFAULT');
  const DB_VER = 1;
  const STORE = 'state';

  function open() {
    return new Promise((resolve, reject) => {
      if (db) return resolve(db);
      const req = indexedDB.open(_getDbName(), DB_VER);
      req.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE);
      req.onsuccess = (e) => { db = e.target.result; resolve(db); };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function get(key) {
    const idb = await open();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function set(key, value) {
    const idb = await open();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(STORE, 'readwrite');
      const req = tx.objectStore(STORE).put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  return { get, set };
})();

// ── Database Class ─────────────────────────────────────────
class Database {
  constructor() {
    this.listeners = [];
    this.data = null;
    this._dirtyKeys = new Set();
  }

  async init() {
    this.data = await this._loadData();
    if (!this.data.vouchers || this.data.vouchers.length === 0) {
      this.seedSampleData();
    }
  }

  // ── Load — IndexedDB only (offline-first) ─────────────
  async _loadData() {
    // Primary: IndexedDB
    try {
      const cached = await IDB.get('state');
      if (cached) {
        console.info('📦 Loaded state from IndexedDB.');
        return this._migrate(cached);
      }
    } catch (e) {
      console.warn('IndexedDB read failed:', e.message);
    }

    // Fresh start
    const fresh = JSON.parse(JSON.stringify(initialState));
    await IDB.set('state', fresh).catch(() => { });
    return fresh;
  }

  // ── Schema migration helper ────────────────────────────
  _migrate(parsed) {
    // Add missing top-level keys
    for (const key of Object.keys(initialState)) {
      if (!(key in parsed)) parsed[key] = JSON.parse(JSON.stringify(initialState[key]));
    }

    // FIX 7: Seed sequences from existing array lengths if migrating from old schema
    if (!parsed.sequences) {
      parsed.sequences = {
        voucher: parsed.vouchers?.length + 1 || 1,
        salesInvoice: parsed.salesInvoices?.length + 1 || 1,
        purchaseInvoice: parsed.purchaseInvoices?.length + 1 || 1,
        debitNote: parsed.purchaseReturns?.length + 1 || 1,
        creditNote: parsed.salesReturns?.length + 1 || 1,
        scrapInvoice: parsed.scrapSaleInvoices?.length + 1 || 1,
        sheetInvoice: parsed.sheetSaleInvoices?.length + 1 || 1,
        deliveryChallan: parsed.deliveryChallans?.length + 1 || 1,
      };
    }

    // Merge system accounts (non-destructive)
    const existingIds = new Set(parsed.accounts.map(a => a.id));
    for (const acc of initialState.accounts) {
      if (!existingIds.has(acc.id)) {
        parsed.accounts.push(JSON.parse(JSON.stringify(acc)));
        console.log(`🔄 Migration: added account "${acc.name}"`);
      }
    }

    // Merge default chemicals / products
    const chemIds = new Set(parsed.chemicals.map(c => c.id));
    for (const ch of initialState.chemicals) {
      if (!chemIds.has(ch.id)) parsed.chemicals.push(JSON.parse(JSON.stringify(ch)));
    }
    const prodIds = new Set(parsed.products.map(p => p.id));
    for (const pr of initialState.products) {
      if (!prodIds.has(pr.id)) parsed.products.push(JSON.parse(JSON.stringify(pr)));
    }

    // CRITICAL: Ensure all Customers/Suppliers have linked accounts (Lazy migration)
    parsed.customers.forEach(c => this._syncPartyAccount(c, 'customer', parsed));
    parsed.suppliers.forEach(s => this._syncPartyAccount(s, 'supplier', parsed));

    return parsed;
  }

  _syncPartyAccount(party, partyType, dataObj) {
    const data = dataObj || this.data;
    const accId = `party_${party.id}`;
    let acc = data.accounts.find(a => a.id === accId);
    if (!acc) {
      acc = {
        id: accId,
        name: party.name,
        alias: party.alias || '',
        group: partyType === 'customer' ? 'Sundry Debtors' : 'Sundry Creditors',
        type: partyType === 'customer' ? 'Asset' : 'Liability',
        isLinked: true,
        gstin: party.gstin || '',
        state: party.state || '',
        address: party.address || '',
        mobile: party.phone || '',
        openingBalance: Number(party.openingBalance) || 0,
        openingBalanceType: partyType === 'customer' ? 'Dr' : 'Cr'
      };
      data.accounts.push(acc);
      if (this.data) this._markDirty('accounts');
    } else {
      acc.name = party.name;
      acc.alias = party.alias || '';
      acc.group = partyType === 'customer' ? 'Sundry Debtors' : 'Sundry Creditors';
      acc.gstin = party.gstin || '';
      acc.state = party.state || '';
      acc.address = party.address || '';
      acc.mobile = party.phone || '';
      acc.isLinked = true;
    }
  }

  // ── Mark dirty + notify sync engine ─────────────────────
  _markDirty(...keys) {
    keys.forEach(k => this._dirtyKeys.add(k));
  }

  saveData() {
    // Persist to IndexedDB immediately (offline-first)
    IDB.set('state', this.data).catch(e => console.error('IDB write failed:', e));
    // Notify sync engine that data has changed
    SyncEngine.markPendingChanges();
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  notify() { this.listeners.forEach(l => l(this.data)); }

  clearData() {
    this.data = JSON.parse(JSON.stringify(initialState));
    this._markDirty(...Object.keys(initialState));
    this.saveData();
    this.seedSampleData();
  }

  // ── Merge remote state (for cloud download) ─────────────
  mergeRemoteState(remoteState) {
    if (!remoteState) return;
    const merged = this._migrate(remoteState);
    this.data = merged;
    IDB.set('state', this.data).catch(e => console.error('IDB merge write failed:', e));
    this.notify();
    // Refresh current view
    window.dispatchEvent(new CustomEvent('view-activated', {
      detail: { route: window.location.hash.substring(1) }
    }));
  }

  // ── FIX 7: Sequence-based numbering (delete-safe) ─────
  _nextSeq(key, prefix, pad = 5) {
    const n = this.data.sequences[key]++;
    this._markDirty('sequences');
    return `${prefix}-${n.toString().padStart(pad, '0')}`;
  }

  nextVoucherNo() { return this._nextSeq('voucher', 'VCH'); }
  nextInvoiceNo() { return this._nextSeq('salesInvoice', 'INV'); }
  nextPurchaseInvoiceNo() { return this._nextSeq('purchaseInvoice', 'PUR'); }
  nextDebitNoteNo() { return this._nextSeq('debitNote', 'DN'); }
  nextCreditNoteNo() { return this._nextSeq('creditNote', 'CN'); }
  nextScrapInvoiceNo() { return this._nextSeq('scrapInvoice', 'SCR'); }
  nextSheetInvoiceNo() { return this._nextSeq('sheetInvoice', 'SHT'); }
  nextDeliveryChallanNo() { return this._nextSeq('deliveryChallan', 'CHL'); }

  // ── FIX 6: Stock validation helper ────────────────────
  /**
   * Returns true if all consumptions are satisfiable.
   * consumptions: [{ itemId, itemType, qty }]  — qty should be positive (amount to deduct)
   * throws Error with detail if any item would go negative.
   */
  _validateStock(consumptions) {
    for (const c of consumptions) {
      const current = this._getStockQty(c.itemId, c.itemType);
      if (current - c.qty < 0) {
        const name = this._resolveItemName(c.itemId, c.itemType);
        throw new Error(
          `Insufficient stock for "${name}": available ${current.toFixed(3)}, required ${c.qty.toFixed(3)}`
        );
      }
    }
    return true;
  }

  _getStockQty(itemId, itemType) {
    return this.data.inventoryTransactions
      .filter(t => t.itemId === itemId && t.itemType === itemType)
      .reduce((sum, t) => sum + t.qty, 0);
  }

  _resolveItemName(itemId, itemType) {
    if (itemType === 'chemical') return this.data.chemicals.find(c => c.id === itemId)?.name || itemId;
    if (itemType === 'product') return this.data.products.find(p => p.id === itemId)?.name || itemId;
    if (itemType === 'sheet') return itemId === 'sheet_silicon' ? 'Silicon Sheet' : 'Non-Silicon Sheet';
    if (itemType === 'waste') return 'Cutting Waste';
    return itemId;
  }

  getItemAverageRate(itemId, itemType) {
    // Computes moving average cost basis of stock for dynamic manufacturing allocation
    const inflows = this.data.inventoryTransactions.filter(t => t.itemId === itemId && t.itemType === itemType && t.qty > 0 && t.rate > 0);
    if (inflows.length === 0) {
      if (itemType === 'chemical') return this.data.chemicals.find(c => c.id === itemId)?.rate || 0;
      return 0;
    }
    let totalAmt = 0, totalQty = 0;
    for (const t of inflows) { totalAmt += t.amount || (t.qty * t.rate); totalQty += t.qty; }
    return totalQty > 0 ? (totalAmt / totalQty) : 0;
  }

  // ── FIX 9: Validated party account helper ─────────────
  _getOrCreatePartyAccount(partyId, partyType) {
    // Guard: partyId must be a valid customer/supplier id
    if (!partyId) throw new Error(`Invalid partyId (empty) for ${partyType}`);

    const partyList = partyType === 'customer' ? this.data.customers : this.data.suppliers;
    const party = partyList.find(p => p.id === partyId);
    if (!party) throw new Error(`${partyType} with id "${partyId}" not found`);

    const accId = `party_${partyId}`;
    let acc = this.data.accounts.find(a => a.id === accId);
    if (!acc) {
      acc = {
        id: accId,
        name: party.name,
        group: partyType === 'customer' ? 'Sundry Debtors' : 'Sundry Creditors',
        type: partyType === 'customer' ? 'Asset' : 'Liability',
      };
      this.data.accounts.push(acc);
      this._markDirty('accounts');
    }
    return acc;
  }

  // ── Master CRUD ────────────────────────────────────────
  addChemical(item) { item.id = generateId(); this.data.chemicals.push(item); this._markDirty('chemicals'); this.saveData(); return item; }
  updateChemical(id, updates) { const i = this.data.chemicals.findIndex(c => c.id === id); if (i >= 0) { Object.assign(this.data.chemicals[i], updates); this._markDirty('chemicals'); this.saveData(); } }
  deleteChemical(id) { this.data.chemicals = this.data.chemicals.filter(c => c.id !== id); this._markDirty('chemicals'); this._remoteDelete('chemicals', id); this.saveData(); }

  addProduct(item) { item.id = generateId(); this.data.products.push(item); this._markDirty('products'); this.saveData(); return item; }
  updateProduct(id, updates) { const i = this.data.products.findIndex(p => p.id === id); if (i >= 0) { Object.assign(this.data.products[i], updates); this._markDirty('products'); this.saveData(); } }
  deleteProduct(id) { this.data.products = this.data.products.filter(p => p.id !== id); this._markDirty('products'); this._remoteDelete('products', id); this.saveData(); }

  addCustomer(item) {
    item.id = generateId();
    this.data.customers.push(item); this._markDirty('customers');
    this._syncPartyAccount(item, 'customer');
    this.saveData(); return item;
  }
  updateCustomer(id, updates) {
    const i = this.data.customers.findIndex(c => c.id === id);
    if (i >= 0) {
      Object.assign(this.data.customers[i], updates); this._markDirty('customers');
      this._syncPartyAccount(this.data.customers[i], 'customer');
      this.saveData();
    }
  }
  deleteCustomer(id) {
    this.data.customers = this.data.customers.filter(c => c.id !== id);
    this.data.accounts = this.data.accounts.filter(a => a.id !== `party_${id}`);
    this._markDirty('customers', 'accounts'); this._remoteDelete('customers', id); this.saveData();
  }

  addSupplier(item) {
    item.id = generateId();
    this.data.suppliers.push(item); this._markDirty('suppliers');
    this._syncPartyAccount(item, 'supplier');
    this.saveData(); return item;
  }
  updateSupplier(id, updates) {
    const i = this.data.suppliers.findIndex(s => s.id === id);
    if (i >= 0) {
      Object.assign(this.data.suppliers[i], updates); this._markDirty('suppliers');
      this._syncPartyAccount(this.data.suppliers[i], 'supplier');
      this.saveData();
    }
  }
  deleteSupplier(id) {
    this.data.suppliers = this.data.suppliers.filter(s => s.id !== id);
    this.data.accounts = this.data.accounts.filter(a => a.id !== `party_${id}`);
    this._markDirty('suppliers', 'accounts'); this._remoteDelete('suppliers', id); this.saveData();
  }

  addAccount(item) { item.id = item.id || generateId(); this.data.accounts.push(item); this._markDirty('accounts'); this.saveData(); return item; }
  updateAccount(id, updates) { const i = this.data.accounts.findIndex(a => a.id === id); if (i >= 0) { Object.assign(this.data.accounts[i], updates); this._markDirty('accounts'); this.saveData(); } }
  deleteAccount(id) {
    const SYSTEM_IDS = new Set([
      'acc_cash', 'acc_sales', 'acc_purchases', 'acc_gst_input', 'acc_gst_input_sgst', 'acc_gst_input_igst',
      'acc_gst_output', 'acc_gst_output_sgst', 'acc_gst_output_igst', 'acc_capital', 'acc_mfg',
      'acc_scrap_income', 'acc_sheet_sale_income', 'acc_waste',
    ]);
    if (SYSTEM_IDS.has(id)) return false;
    this.data.accounts = this.data.accounts.filter(a => a.id !== id);
    this._markDirty('accounts');
    this._remoteDelete('accounts', id);
    this.saveData();
    return true;
  }

  addAccountGroup(item) { item.id = generateId(); this.data.accountGroups.push(item); this._markDirty('accountGroups'); this.saveData(); return item; }
  updateAccountGroup(id, updates) { const i = this.data.accountGroups.findIndex(g => g.id === id); if (i >= 0) { Object.assign(this.data.accountGroups[i], updates); this._markDirty('accountGroups'); this.saveData(); } }
  deleteAccountGroup(id) {
    const SYSTEM_GRPS = new Set(['g_bank', 'g_cash', 'g_debtors', 'g_creditors', 'g_dir_exp', 'g_indir_exp', 'g_sales', 'g_purchase', 'g_capital', 'g_loans_lib', 'g_loans_ast', 'g_fixed_ast', 'g_current_ast', 'g_current_lib', 'g_duties', 'g_other_inc', 'g_inventory']);
    if (SYSTEM_GRPS.has(id)) return false;
    this.data.accountGroups = this.data.accountGroups.filter(g => g.id !== id);
    this._markDirty('accountGroups');
    this._remoteDelete('account_groups', id);
    this.saveData();
    return true;
  }

  // ── Delete Transactions ────────────────────────────────
  deleteVoucher(voucherId) {
    // Global Cascade Delete: Find and remove any parent entities linked to this voucher globally
    this.data.salesInvoices = this.data.salesInvoices.filter(i => i.voucherId !== voucherId);
    this.data.purchaseInvoices = this.data.purchaseInvoices.filter(i => i.voucherId !== voucherId);
    this.data.scrapSaleInvoices = this.data.scrapSaleInvoices.filter(i => i.voucherId !== voucherId);
    this.data.sheetSaleInvoices = this.data.sheetSaleInvoices.filter(i => i.voucherId !== voucherId);
    this.data.productionBatches = this.data.productionBatches.filter(i => i.voucherId !== voucherId);
    this.data.expenses = this.data.expenses.filter(i => i.voucherId !== voucherId);
    this.data.purchaseReturns = this.data.purchaseReturns.filter(i => i.voucherId !== voucherId);
    this.data.salesReturns = this.data.salesReturns.filter(i => i.voucherId !== voucherId);
    this.data.deliveryChallans = this.data.deliveryChallans.filter(i => i.voucherId !== voucherId);

    this._markDirty('salesInvoices', 'purchaseInvoices', 'scrapSaleInvoices', 'sheetSaleInvoices', 'productionBatches', 'expenses', 'purchaseReturns', 'salesReturns', 'deliveryChallans');

    // Remove core voucher records
    this.data.vouchers = this.data.vouchers.filter(v => v.id !== voucherId);
    this.data.voucherDetails = this.data.voucherDetails.filter(d => d.voucherId !== voucherId);
    this.data.inventoryTransactions = this.data.inventoryTransactions.filter(t => t.voucherId !== voucherId);

    this._markDirty('vouchers', 'voucherDetails', 'inventoryTransactions');
    this._remoteDelete('vouchers', voucherId);
    this.saveData();
  }

  deletePurchaseInvoice(invoiceId) {
    const inv = this.data.purchaseInvoices.find(i => i.id === invoiceId);
    if (!inv) return;
    try {
      const consumptions = inv.items.map(item => ({ itemId: item.chemicalId, itemType: 'chemical', qty: item.qty }));
      this._validateStock(consumptions);
    } catch (e) {
      alert("Cannot delete Purchase Invoice: " + e.message);
      return;
    }
    this._remoteDelete('purchase_invoices', invoiceId);
    this.deleteVoucher(inv.voucherId);
  }

  deleteSalesInvoice(invoiceId) {
    const inv = this.data.salesInvoices.find(i => i.id === invoiceId);
    if (!inv) return;
    if (inv.orderId) {
      const order = this.data.customerOrders.find(o => o.id === inv.orderId);
      if (order) {
        (inv.items || []).forEach(saleItem => {
          const oi = order.items.find(oi => oi.productId === saleItem.productId);
          if (oi) oi.fulfilledQty = Math.max(0, (oi.fulfilledQty || 0) - (saleItem.qty || 0));
        });
        order.linkedInvoiceIds = (order.linkedInvoiceIds || []).filter(id => id !== invoiceId);
        order.status = this._calcOrderStatus(order);
        this._markDirty('customerOrders');
      }
    }
    this._remoteDelete('sales_invoices', invoiceId);
    this.deleteVoucher(inv.voucherId);
  }

  deleteProductionBatch(batchId) {
    const b = this.data.productionBatches.find(b => b.id === batchId);
    if (!b) return;
    try {
      const outputs = (b.outputItems || []).map(item => ({ itemId: item.itemId, itemType: item.itemType, qty: item.qty }));
      this._validateStock(outputs);
    } catch (e) {
      alert("Cannot delete Production Batch: " + e.message);
      return;
    }
    this._remoteDelete('production_batches', batchId);
    this.deleteVoucher(b.voucherId);
  }

  deleteCustomerOrder(orderId) {
    this.data.customerOrders = this.data.customerOrders.filter(o => o.id !== orderId);
    this._markDirty('customerOrders');
    this._remoteDelete('customer_orders', orderId);
    this.saveData();
  }

  deleteCheque(chequeId) {
    this.data.cheques = this.data.cheques.filter(c => c.id !== chequeId);
    this._markDirty('cheques');
    this._remoteDelete('cheques', chequeId);
    this.saveData();
  }

  updateCustomerOrder(id, updates) {
    const i = this.data.customerOrders.findIndex(o => o.id === id);
    if (i >= 0) { Object.assign(this.data.customerOrders[i], updates); this._markDirty('customerOrders'); this.saveData(); }
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
      refInvoiceNo: voucherData.refInvoiceNo || '',
    };
    this.data.vouchers.push(newVoucher);

    for (const d of detailsData) {
      if (d.drAmount > 0 || d.crAmount > 0) {
        this.data.voucherDetails.push({
          id: generateId(),
          voucherId,
          accountId: d.accountId,
          partyId: d.partyId || '',
          drAmount: Number(d.drAmount) || 0,
          crAmount: Number(d.crAmount) || 0,
        });
      }
    }

    for (const inv of inventoryData) {
      if (inv.qty !== 0) {
        this.data.inventoryTransactions.push({
          id: generateId(),
          voucherId,
          itemId: inv.itemId,
          itemType: inv.itemType || 'chemical',
          qty: Number(inv.qty),
          rate: Number(inv.rate) || 0,
          amount: Number(inv.amount) || 0,
        });
      }
    }

    this._markDirty('vouchers', 'voucherDetails', 'inventoryTransactions');
    this.saveData();
    return newVoucher;
  }

  // ── GST Calc helper ────────────────────────────────────
  _calcGST(items, isInterState) {
    let subtotal = 0, cgst = 0, sgst = 0, igst = 0;
    for (const item of items) {
      const amt = item.qty * item.rate;
      const gst = amt * ((item.gstRate || 0) / 100);
      subtotal += amt;
      item.amount = amt;
      item.gstAmount = gst;
      if (isInterState) { igst += gst; }
      else { cgst += gst / 2; sgst += gst / 2; }
    }
    return { subtotal, cgst, sgst, igst, grandTotal: subtotal + cgst + sgst + igst };
  }

  _gstDetailEntries(isInterState, { cgst, sgst, igst }, direction /* 'input' | 'output' */) {
    const prefix = direction === 'input' ? 'acc_gst_input' : 'acc_gst_output';
    const isDr = direction === 'input';
    const entries = [];
    if (isInterState) {
      entries.push({ accountId: `${prefix}_igst`, drAmount: isDr ? igst : 0, crAmount: isDr ? 0 : igst });
    } else {
      entries.push({ accountId: prefix, drAmount: isDr ? cgst : 0, crAmount: isDr ? 0 : cgst });
      entries.push({ accountId: `${prefix}_sgst`, drAmount: isDr ? sgst : 0, crAmount: isDr ? 0 : sgst });
    }
    return entries;
  }

  // ── Purchase Invoice ──────────────────────────────────
  addPurchaseInvoice(invoiceData) {
    const isInterState = invoiceData.supplierStateCode &&
      invoiceData.supplierStateCode !== this.data.companyInfo.stateCode;

    const { subtotal, cgst, sgst, igst, grandTotal } = this._calcGST(invoiceData.items, isInterState);

    const inventoryData = invoiceData.items.map(item => ({
      itemId: item.chemicalId, itemType: 'chemical',
      qty: item.qty, rate: item.rate, amount: item.amount,
    }));

    const detailsData = [
      { accountId: 'acc_purchases', drAmount: subtotal, crAmount: 0 },
      ...this._gstDetailEntries(isInterState, { cgst, sgst, igst }, 'input'),
    ];

    if (invoiceData.paymentMode === 'credit') {
      const supAcc = this._getOrCreatePartyAccount(invoiceData.supplierId, 'supplier');
      detailsData.push({ accountId: supAcc.id, partyId: invoiceData.supplierId, drAmount: 0, crAmount: grandTotal });
    } else {
      detailsData.push({ accountId: invoiceData.accountId, drAmount: 0, crAmount: grandTotal });
    }

    const invoiceNo = invoiceData.invoiceNo || this.nextPurchaseInvoiceNo();
    const voucher = this.addVoucher({
      date: invoiceData.date,
      type: 'Purchase',
      narration: `Purchase from ${invoiceData.supplierName || ''} — Inv# ${invoiceNo}`,
      refInvoiceNo: invoiceNo,
    }, detailsData, inventoryData);

    const invoice = {
      id: generateId(),
      voucherId: voucher.id,
      supplierId: invoiceData.supplierId,
      invoiceNo,
      date: invoiceData.date || formatDate(),
      items: invoiceData.items,
      subtotal, cgst, sgst, igst, grandTotal,
      paymentMode: invoiceData.paymentMode || 'credit',
      accountId: invoiceData.accountId || '',
      amountPaid: invoiceData.paymentMode === 'credit' ? 0 : grandTotal,
    };
    this.data.purchaseInvoices.push(invoice);
    this._markDirty('purchaseInvoices');
    this.saveData();
    return invoice;
  }

  // ── Sales Invoice ──────────────────────────────────────
  addSalesInvoice(invoiceData) {
    // FIX 6: Validate stock before proceeding
    const consumptions = invoiceData.items.map(item => ({
      itemId: item.productId,
      itemType: 'product',
      qty: item.qty,
    }));
    this._validateStock(consumptions); // throws if insufficient

    const isInterState = invoiceData.customerStateCode &&
      invoiceData.customerStateCode !== this.data.companyInfo.stateCode;

    const { subtotal, cgst, sgst, igst, grandTotal } = this._calcGST(invoiceData.items, isInterState);

    const inventoryData = invoiceData.items.map(item => ({
      itemId: item.productId, itemType: 'product',
      qty: -item.qty, rate: item.rate, amount: item.amount,
    }));

    const detailsData = [];
    if (invoiceData.paymentMode === 'credit') {
      const custAcc = this._getOrCreatePartyAccount(invoiceData.customerId, 'customer');
      detailsData.push({ accountId: custAcc.id, partyId: invoiceData.customerId, drAmount: grandTotal, crAmount: 0 });
    } else {
      detailsData.push({ accountId: invoiceData.accountId, drAmount: grandTotal, crAmount: 0 });
    }
    detailsData.push({ accountId: 'acc_sales', drAmount: 0, crAmount: subtotal });
    detailsData.push(...this._gstDetailEntries(isInterState, { cgst, sgst, igst }, 'output'));

    const invoiceNo = invoiceData.invoiceNo || this.nextInvoiceNo();
    const voucher = this.addVoucher({
      date: invoiceData.date,
      type: 'Sales',
      narration: `Sale to ${invoiceData.customerName || ''} — Inv# ${invoiceNo}`,
      refInvoiceNo: invoiceNo,
    }, detailsData, inventoryData);

    const invoice = {
      id: generateId(),
      voucherId: voucher.id,
      customerId: invoiceData.customerId,
      invoiceNo,
      date: invoiceData.date || formatDate(),
      items: invoiceData.items,
      subtotal, cgst, sgst, igst, grandTotal,
      paymentMode: invoiceData.paymentMode || 'credit',
      accountId: invoiceData.accountId || '',
      amountReceived: invoiceData.paymentMode === 'credit' ? 0 : grandTotal,
      orderId: invoiceData.orderId || '',
    };
    this.data.salesInvoices.push(invoice);
    this._markDirty('salesInvoices');

    // Update linked customer order
    if (invoiceData.orderId) {
      const order = this.data.customerOrders.find(o => o.id === invoiceData.orderId);
      if (order) {
        (invoiceData.items || []).forEach(si => {
          const oi = order.items.find(oi => oi.productId === si.productId);
          if (oi) oi.fulfilledQty = (oi.fulfilledQty || 0) + si.qty;
        });
        order.linkedInvoiceIds = [...(order.linkedInvoiceIds || []), invoice.id];
        order.status = this._calcOrderStatus(order);
        this._markDirty('customerOrders');
      }
    }
    this.saveData();
    return invoice;
  }

  // ── FIX 5: Scrap Sale Invoice (with GST) ──────────────
  /**
   * invoiceData: {
   *   date, customerId?, customerName?, customerStateCode?,
   *   invoiceNo?, paymentMode, accountId,
   *   items: [{ description, qty, unit, rate, gstRate, hsnCode }],
   * }
   * Typical gstRate for rubber waste = 5%, metal scrap = 18%
   */
  addScrapSaleInvoice(invoiceData) {
    const isInterState = invoiceData.customerStateCode &&
      invoiceData.customerStateCode !== this.data.companyInfo.stateCode;

    const { subtotal, cgst, sgst, igst, grandTotal } = this._calcGST(invoiceData.items, isInterState);

    // Deduct waste stock
    const inventoryData = invoiceData.items.map(item => ({
      itemId: item.wasteId || 'waste_nonsilicon',
      itemType: 'waste',
      qty: -(item.qty),
      rate: item.rate,
      amount: item.amount,
    }));

    const detailsData = [];
    if (invoiceData.paymentMode === 'credit' && invoiceData.customerId) {
      const custAcc = this._getOrCreatePartyAccount(invoiceData.customerId, 'customer');
      detailsData.push({ accountId: custAcc.id, partyId: invoiceData.customerId, drAmount: grandTotal, crAmount: 0 });
    } else {
      detailsData.push({ accountId: invoiceData.accountId || 'acc_cash', drAmount: grandTotal, crAmount: 0 });
    }
    detailsData.push({ accountId: 'acc_scrap_income', drAmount: 0, crAmount: subtotal });
    detailsData.push(...this._gstDetailEntries(isInterState, { cgst, sgst, igst }, 'output'));

    const invoiceNo = invoiceData.invoiceNo || this.nextScrapInvoiceNo();
    const voucher = this.addVoucher({
      date: invoiceData.date,
      type: 'Scrap Sale',
      narration: `Scrap Sale — Inv# ${invoiceNo}`,
      refInvoiceNo: invoiceNo,
    }, detailsData, inventoryData);

    const invoice = {
      id: generateId(),
      voucherId: voucher.id,
      customerId: invoiceData.customerId || '',
      invoiceNo,
      date: invoiceData.date || formatDate(),
      items: invoiceData.items,
      subtotal, cgst, sgst, igst, grandTotal,
      paymentMode: invoiceData.paymentMode || 'cash',
      accountId: invoiceData.accountId || 'acc_cash',
    };
    this.data.scrapSaleInvoices.push(invoice);
    this._markDirty('scrapSaleInvoices');
    this.saveData();
    return invoice;
  }

  deleteScrapSaleInvoice(id) {
    const inv = this.data.scrapSaleInvoices.find(i => i.id === id);
    if (inv) this.deleteVoucher(inv.voucherId);
  }

  // ── FIX 8: Sheet Sale Invoice (with GST) ──────────────
  /**
   * invoiceData: {
   *   date, customerId, customerStateCode?,
   *   invoiceNo?, paymentMode, accountId,
   *   items: [{ sheetId:'sheet_silicon'|'sheet_nonsilicon', description, qty, rate, gstRate, hsnCode }]
   * }
   */
  addSheetSaleInvoice(invoiceData) {
    // FIX 6: Validate sheet stock
    const consumptions = invoiceData.items.map(item => ({
      itemId: item.sheetId,
      itemType: 'sheet',
      qty: item.qty,
    }));
    this._validateStock(consumptions);

    const isInterState = invoiceData.customerStateCode &&
      invoiceData.customerStateCode !== this.data.companyInfo.stateCode;

    const { subtotal, cgst, sgst, igst, grandTotal } = this._calcGST(invoiceData.items, isInterState);

    const inventoryData = invoiceData.items.map(item => ({
      itemId: item.sheetId,
      itemType: 'sheet',
      qty: -item.qty,
      rate: item.rate,
      amount: item.amount,
    }));

    const detailsData = [];
    if (invoiceData.paymentMode === 'credit') {
      const custAcc = this._getOrCreatePartyAccount(invoiceData.customerId, 'customer');
      detailsData.push({ accountId: custAcc.id, partyId: invoiceData.customerId, drAmount: grandTotal, crAmount: 0 });
    } else {
      detailsData.push({ accountId: invoiceData.accountId || 'acc_cash', drAmount: grandTotal, crAmount: 0 });
    }
    detailsData.push({ accountId: 'acc_sheet_sale_income', drAmount: 0, crAmount: subtotal });
    detailsData.push(...this._gstDetailEntries(isInterState, { cgst, sgst, igst }, 'output'));

    const invoiceNo = invoiceData.invoiceNo || this.nextSheetInvoiceNo();
    const voucher = this.addVoucher({
      date: invoiceData.date,
      type: 'Sheet Sale',
      narration: `Sheet Sale to ${invoiceData.customerName || ''} — Inv# ${invoiceNo}`,
      refInvoiceNo: invoiceNo,
    }, detailsData, inventoryData);

    const invoice = {
      id: generateId(),
      voucherId: voucher.id,
      customerId: invoiceData.customerId,
      invoiceNo,
      date: invoiceData.date || formatDate(),
      items: invoiceData.items,
      subtotal, cgst, sgst, igst, grandTotal,
      paymentMode: invoiceData.paymentMode || 'credit',
      accountId: invoiceData.accountId || '',
    };
    this.data.sheetSaleInvoices.push(invoice);
    this._markDirty('sheetSaleInvoices');
    this.saveData();
    return invoice;
  }

  deleteSheetSaleInvoice(id) {
    const inv = this.data.sheetSaleInvoices.find(i => i.id === id);
    if (inv) this.deleteVoucher(inv.voucherId);
  }

  // ── Production: Stage 1 (Sheet Making) ────────────────
  addSheetMakingBatch(batchData) {
    // FIX 6: Validate chemical stock
    const consumptions = batchData.inputItems.map(inp => ({
      itemId: inp.itemId,
      itemType: inp.itemType || 'chemical',
      qty: Math.abs(inp.qty),
    }));
    this._validateStock(consumptions);

    let totalCost = 0;
    const inventoryData = batchData.inputItems.map(inp => {
      const rate = this.getItemAverageRate(inp.itemId, inp.itemType || 'chemical');
      const amount = Math.abs(inp.qty) * rate;
      totalCost += amount;
      return {
        itemId: inp.itemId, itemType: inp.itemType || 'chemical',
        qty: -Math.abs(inp.qty), rate, amount,
      };
    });

    const sheetId = batchData.productionType === 'silicon' ? 'sheet_silicon' : 'sheet_nonsilicon';
    const outputKg = Math.abs(batchData.outputKg);
    const costPerKg = outputKg > 0 ? (totalCost / outputKg) : 0;

    // Track monetary value of manufactured sheet back into the inventory transactions!
    inventoryData.push({ itemId: sheetId, itemType: 'sheet', qty: outputKg, rate: costPerKg, amount: totalCost });

    const voucher = this.addVoucher({
      date: batchData.date,
      type: 'Manufacturing',
      narration: `Sheet Making — ${batchData.productionType} — ${batchData.narration || ''}`,
    }, [], inventoryData);

    const batch = {
      id: generateId(),
      date: batchData.date || formatDate(),
      stage: 'sheet',
      productionType: batchData.productionType,
      inputItems: batchData.inputItems,
      outputKg,
      totalCost,
      costPerKg,
      outputItems: [{ itemId: sheetId, itemType: 'sheet', qty: outputKg }],
      operatorName: batchData.operatorName || '',
      narration: batchData.narration || '',
      voucherId: voucher.id,
    };
    this.data.productionBatches.push(batch);
    this._markDirty('productionBatches');
    this.saveData();
    return batch;
  }

  // ── Production: Stage 2 (Product Making) ──────────────
  addProductMakingBatch(batchData) {
    const sheetId = batchData.productionType === 'silicon' ? 'sheet_silicon' : 'sheet_nonsilicon';

    // FIX 6: Validate sheet stock
    const consumptions = [{ itemId: sheetId, itemType: 'sheet', qty: Math.abs(batchData.sheetConsumedKg) }];
    if (batchData.additionalChemicals) {
      batchData.additionalChemicals.forEach(ch => {
        consumptions.push({ itemId: ch.itemId, itemType: 'chemical', qty: Math.abs(ch.qty) });
      });
    }
    this._validateStock(consumptions);

    const inventoryData = [];
    inventoryData.push({ itemId: sheetId, itemType: 'sheet', qty: -Math.abs(batchData.sheetConsumedKg), rate: 0, amount: 0 });

    if (batchData.additionalChemicals) {
      batchData.additionalChemicals.forEach(ch => {
        inventoryData.push({ itemId: ch.itemId, itemType: 'chemical', qty: -Math.abs(ch.qty), rate: 0, amount: 0 });
      });
    }

    const outputQty = Math.abs(batchData.outputQty);
    inventoryData.push({ itemId: batchData.productId, itemType: 'product', qty: outputQty, rate: 0, amount: 0 });

    const wasteKg = batchData.productionType === 'non-silicon' ? (Number(batchData.wasteKg) || 0) : 0;
    const wastePercent = (wasteKg > 0 && batchData.sheetConsumedKg > 0)
      ? Number(((wasteKg / batchData.sheetConsumedKg) * 100).toFixed(2))
      : 0;

    if (wasteKg > 0) {
      inventoryData.push({ itemId: 'waste_nonsilicon', itemType: 'waste', qty: wasteKg, rate: 0, amount: 0 });
    }

    const voucher = this.addVoucher({
      date: batchData.date,
      type: 'Manufacturing',
      narration: `Product Making — ${batchData.productName || ''} — ${batchData.narration || ''}`,
    }, [], inventoryData);

    // FIX 10: outputItems normalized (mirrors sheet stage)
    const batch = {
      id: generateId(),
      date: batchData.date || formatDate(),
      stage: 'product',
      productionType: batchData.productionType,
      productId: batchData.productId,
      sheetConsumedKg: batchData.sheetConsumedKg,
      additionalChemicals: batchData.additionalChemicals || [],
      outputQty,                                                           // convenience field
      outputItems: [{ itemId: batchData.productId, itemType: 'product', qty: outputQty }], // FIX 10
      wasteKg, wastePercent,
      operatorName: batchData.operatorName || '',
      narration: batchData.narration || '',
      voucherId: voucher.id,
    };
    this.data.productionBatches.push(batch);
    this._markDirty('productionBatches');
    this.saveData();
    return batch;
  }

  // ── Customer Order ─────────────────────────────────────
  addCustomerOrder(order) {
    order.id = generateId();
    order.status = 'pending';
    order.date = order.date || formatDate();
    order.linkedInvoiceIds = [];
    (order.items || []).forEach(item => { item.fulfilledQty = 0; });
    this.data.customerOrders.push(order);
    this._markDirty('customerOrders');
    this.saveData();
    return order;
  }

  _calcOrderStatus(order) {
    const allFulfilled = order.items.every(oi => (oi.fulfilledQty || 0) >= oi.qty);
    const anyFulfilled = order.items.some(oi => (oi.fulfilledQty || 0) > 0);
    return allFulfilled ? 'fulfilled' : anyFulfilled ? 'partial' : 'pending';
  }

  getOrderRemainingQty(orderId) {
    const order = this.data.customerOrders.find(o => o.id === orderId);
    if (!order) return [];
    return order.items.map(item => ({
      productId: item.productId,
      orderedQty: item.qty,
      fulfilledQty: item.fulfilledQty || 0,
      remainingQty: Math.max(0, item.qty - (item.fulfilledQty || 0)),
      description: item.description,
    }));
  }

  // ── Payment / Receipt Voucher ─────────────────────────
  addPaymentVoucher(data) {
    const supAcc = this._getOrCreatePartyAccount(data.partyId, 'supplier');
    const detailsData = [
      { accountId: supAcc.id, partyId: data.partyId, drAmount: data.amount, crAmount: 0 },
      { accountId: data.accountId, drAmount: 0, crAmount: data.amount },
    ];

    const voucher = this.addVoucher({
      date: data.date,
      type: 'Payment',
      narration: data.narration || 'Payment to supplier',
    }, detailsData);

    if (data.chequeNo) {
      this.data.cheques.push({
        id: generateId(), type: 'issued',
        partyId: data.partyId, partyType: 'supplier',
        chequeNo: data.chequeNo, date: data.date, bankName: data.bankName || '',
        amount: data.amount, status: 'pending', voucherId: voucher.id,
      });
      this._markDirty('cheques');
      this.saveData();
    }
    return voucher;
  }

  addReceiptVoucher(data) {
    const custAcc = this._getOrCreatePartyAccount(data.partyId, 'customer');
    const detailsData = [
      { accountId: data.accountId, drAmount: data.amount, crAmount: 0 },
      { accountId: custAcc.id, partyId: data.partyId, drAmount: 0, crAmount: data.amount },
    ];

    const voucher = this.addVoucher({
      date: data.date,
      type: 'Receipt',
      narration: data.narration || 'Receipt from customer',
    }, detailsData);

    if (data.chequeNo) {
      this.data.cheques.push({
        id: generateId(), type: 'received',
        partyId: data.partyId, partyType: 'customer',
        chequeNo: data.chequeNo, date: data.date, bankName: data.bankName || '',
        amount: data.amount, status: 'pending', voucherId: voucher.id,
      });
      this._markDirty('cheques');
      this.saveData();
    }
    return voucher;
  }

  updateChequeStatus(chequeId, status) {
    const ch = this.data.cheques.find(c => c.id === chequeId);
    if (ch) { ch.status = status; this._markDirty('cheques'); this.saveData(); }
  }

  // ══════════════════════════════════════════════════════
  // QUERIES
  // ══════════════════════════════════════════════════════

  getLedgerBalance(accountId) {
    let dr = 0, cr = 0;

    // Process Opening Balances
    const partyId = accountId.startsWith('party_') ? accountId.replace('party_', '') : null;
    if (partyId) {
      const party = this.data.customers.find(c => c.id === partyId) || this.data.suppliers.find(s => s.id === partyId);
      if (party && party.openingBal) {
        if (party.openingType === 'Dr') dr += party.openingBal;
        else cr += party.openingBal;
      }
    } else {
      const acc = this.data.accounts.find(a => a.id === accountId);
      if (acc && acc.openingBalance) {
        if (acc.openingBalanceType === 'Dr') dr += acc.openingBalance;
        else cr += acc.openingBalance;
      }
    }

    // Process Ledger Movements
    for (const d of this.data.voucherDetails) {
      if (d.accountId === accountId) { dr += d.drAmount; cr += d.crAmount; }
    }
    return dr - cr;
  }

  getLedgerEntries(accountId) {
    return this.data.voucherDetails
      .filter(d => d.accountId === accountId)
      .map(d => ({ ...d, voucher: this.data.vouchers.find(v => v.id === d.voucherId) }))
      .sort((a, b) => new Date(a.voucher?.date) - new Date(b.voucher?.date));
  }

  getTrialBalance() {
    let totDr = 0, totCr = 0;
    const accounts = [];

    // Process all accounts and categorize by group
    const groups = {};
    for (const acc of this.data.accounts) {
      const bal = this.getLedgerBalance(acc.id);
      if (bal === 0) continue;

      const isDebit = bal > 0;
      const dr = isDebit ? bal : 0;
      const cr = isDebit ? 0 : Math.abs(bal);

      if (!groups[acc.group]) groups[acc.group] = { name: acc.group, dr: 0, cr: 0, accounts: [] };
      groups[acc.group].dr += dr;
      groups[acc.group].cr += cr;
      groups[acc.group].accounts.push({ name: acc.name, dr, cr });

      totDr += dr;
      totCr += cr;
    }

    return { groups: Object.values(groups), totDr, totCr };
  }

  getBalanceSheet() {
    const assets = { group: 'Assets', subGroups: {}, total: 0 };
    const liabilities = { group: 'Liabilities & Capital', subGroups: {}, total: 0 };
    let profitLoss = 0;

    for (const acc of this.data.accounts) {
      const bal = this.getLedgerBalance(acc.id);
      if (bal === 0) continue;

      if (acc.type === 'Asset') {
        if (!assets.subGroups[acc.group]) assets.subGroups[acc.group] = { name: acc.group, total: 0, items: [] };
        assets.subGroups[acc.group].items.push({ name: acc.name, amount: bal });
        assets.subGroups[acc.group].total += bal;
        assets.total += bal;
      } else if (acc.type === 'Liability' || acc.type === 'Equity') {
        const val = -bal;
        if (!liabilities.subGroups[acc.group]) liabilities.subGroups[acc.group] = { name: acc.group, total: 0, items: [] };
        liabilities.subGroups[acc.group].items.push({ name: acc.name, amount: val });
        liabilities.subGroups[acc.group].total += val;
        liabilities.total += val;
      } else if (acc.type === 'Income') { profitLoss += -bal; }
      else if (acc.type === 'Expense') { profitLoss -= bal; }
    }

    if (profitLoss > 0) {
      // Profit is a liability (it belongs to owners)
      if (!liabilities.subGroups['Reserves & Surplus']) liabilities.subGroups['Reserves & Surplus'] = { name: 'Reserves & Surplus', total: 0, items: [] };
      liabilities.subGroups['Reserves & Surplus'].items.push({ name: 'Net Profit (Current Year)', amount: profitLoss });
      liabilities.subGroups['Reserves & Surplus'].total += profitLoss;
      liabilities.total += profitLoss;
    } else if (profitLoss < 0) {
      // Loss is an asset (or negative liability, but in Busy it's often shown as asset or minus liability)
      const lossVal = Math.abs(profitLoss);
      if (!assets.subGroups['Profit & Loss A/c']) assets.subGroups['Profit & Loss A/c'] = { name: 'Profit & Loss A/c (Loss)', total: 0, items: [] };
      assets.subGroups['Profit & Loss A/c'].items.push({ name: 'Net Loss (Current Year)', amount: lossVal });
      assets.subGroups['Profit & Loss A/c'].total += lossVal;
      assets.total += lossVal;
    }

    return {
      assets: { ...assets, subGroups: Object.values(assets.subGroups) },
      liabilities: { ...liabilities, subGroups: Object.values(liabilities.subGroups) }
    };
  }

  getProfitAndLoss() {
    const incomes = {}, expenses = {};
    let totalIncome = 0, totalExpense = 0;

    for (const acc of this.data.accounts) {
      const bal = this.getLedgerBalance(acc.id);
      if (bal === 0) continue;

      if (acc.type === 'Income') {
        const amt = -bal;
        if (!incomes[acc.group]) incomes[acc.group] = { name: acc.group, total: 0, items: [] };
        incomes[acc.group].items.push({ name: acc.name, amount: amt });
        incomes[acc.group].total += amt;
        totalIncome += amt;
      } else if (acc.type === 'Expense') {
        if (!expenses[acc.group]) expenses[acc.group] = { name: acc.group, total: 0, items: [] };
        expenses[acc.group].items.push({ name: acc.name, amount: bal });
        expenses[acc.group].total += bal;
        totalExpense += bal;
      }
    }
    return {
      incomes: Object.values(incomes),
      expenses: Object.values(expenses),
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense
    };
  }

  // ── Stock Queries ──────────────────────────────────────
  getChemicalStock() {
    const stock = Object.fromEntries(this.data.chemicals.map(c => [c.id, { item: c, qty: c.openingQty || 0 }]));
    for (const t of this.data.inventoryTransactions) {
      if (t.itemType === 'chemical' && stock[t.itemId]) stock[t.itemId].qty += t.qty;
    }
    return Object.values(stock);
  }

  getSheetStock() {
    const stock = Object.fromEntries(this.data.sheetTypes.map(s => [s.id, { item: s, qty: s.openingQty || 0 }]));
    for (const t of this.data.inventoryTransactions) {
      if (t.itemType === 'sheet' && stock[t.itemId]) stock[t.itemId].qty += t.qty;
    }
    return Object.values(stock);
  }

  getProductStock() {
    const stock = Object.fromEntries(this.data.products.map(p => [p.id, { item: p, qty: p.openingQty || 0 }]));
    for (const t of this.data.inventoryTransactions) {
      if (t.itemType === 'product' && stock[t.itemId]) stock[t.itemId].qty += t.qty;
    }
    return Object.values(stock);
  }

  getWasteStock() {
    return this.data.inventoryTransactions
      .filter(t => t.itemType === 'waste')
      .reduce((sum, t) => sum + t.qty, 0);
  }

  getLowStockAlerts() {
    return this.getChemicalStock()
      .filter(s => s.qty < (s.item.minStock || 0))
      .map(s => ({ type: 'chemical', name: s.item.name, currentQty: s.qty, minStock: s.item.minStock, unit: s.item.unit }));
  }

  // ── FIX 11: GST Summary includes ALL invoice types ────
  getGSTSummary() {
    let inputCGST = 0, inputSGST = 0, inputIGST = 0;
    let outputCGST = 0, outputSGST = 0, outputIGST = 0;

    const addInput = inv => { inputCGST += inv.cgst; inputSGST += inv.sgst; inputIGST += inv.igst; };
    const addOutput = inv => { outputCGST += inv.cgst; outputSGST += inv.sgst; outputIGST += inv.igst; };

    this.data.purchaseInvoices.forEach(addInput);
    this.data.salesInvoices.forEach(addOutput);
    this.data.scrapSaleInvoices.forEach(addOutput);  // FIX 11
    this.data.sheetSaleInvoices.forEach(addOutput);  // FIX 11

    // Subtract purchase returns (reverse input)
    this.data.purchaseReturns.forEach(r => { inputCGST -= r.cgst; inputSGST -= r.sgst; inputIGST -= r.igst; });
    // Subtract sales returns (reverse output)
    this.data.salesReturns.forEach(r => { outputCGST -= r.cgst; outputSGST -= r.sgst; outputIGST -= r.igst; });

    const totalInput = inputCGST + inputSGST + inputIGST;
    const totalOutput = outputCGST + outputSGST + outputIGST;
    return {
      inputCGST, inputSGST, inputIGST,
      outputCGST, outputSGST, outputIGST,
      totalInput, totalOutput,
      netPayable: totalOutput - totalInput,
    };
  }

  getHSNSummary() {
    const hsn = {};
    const allSalesInvoices = [
      ...this.data.salesInvoices,
      ...this.data.scrapSaleInvoices,  // FIX 11
      ...this.data.sheetSaleInvoices,  // FIX 11
    ];
    for (const inv of allSalesInvoices) {
      for (const item of inv.items) {
        const key = item.hsnCode || 'N/A';
        if (!hsn[key]) hsn[key] = { hsnCode: key, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
        hsn[key].taxableValue += item.amount || 0;
        hsn[key].totalTax += item.gstAmount || 0;
      }
    }
    return Object.values(hsn);
  }

  // ── Contra / Journal / Misc ───────────────────────────
  addContraVoucher(data) {
    const detailsData = [
      { accountId: data.toAccountId, drAmount: data.amount, crAmount: 0 },
      { accountId: data.fromAccountId, drAmount: 0, crAmount: data.amount },
    ];
    return this.addVoucher({
      date: data.date, type: 'Contra',
      narration: data.narration || `Transfer from ${data.fromAccountName} to ${data.toAccountName}`,
    }, detailsData);
  }

  addJournalVoucher(data) {
    // data.entries = [{ accountId, drAmount, crAmount }]
    const totalDr = data.entries.reduce((s, e) => s + e.drAmount, 0);
    const totalCr = data.entries.reduce((s, e) => s + e.crAmount, 0);
    if (Math.abs(totalDr - totalCr) > 0.01) throw new Error('Trial balance mismatch in Journal entry');

    return this.addVoucher({
      date: data.date, type: 'Journal',
      narration: data.narration || 'Journal adjustment',
    }, data.entries);
  }

  getDetailedLedgerReport(accountId, fromDate, toDate, filterVchType = 'all') {
    if (!accountId) return null;

    // 1. Calculate Opening Balance UP TO fromDate
    let dr = 0, cr = 0;

    // Base account/party opening
    const partyId = accountId.startsWith('party_') ? accountId.replace('party_', '') : null;
    if (partyId) {
      const party = this.data.customers.find(c => c.id === partyId) || this.data.suppliers.find(s => s.id === partyId);
      if (party) {
        const amt = Number(party.openingBalance || 0);
        if (party.openingBalanceType === 'Dr') dr += amt; else cr += amt;
      }
    } else {
      const acc = this.data.accounts.find(a => a.id === accountId);
      if (acc) {
        const amt = Number(acc.openingBalance || 0);
        if (acc.openingBalanceType === 'Dr') dr += amt; else cr += amt;
      }
    }

    // Transactions BEFORE fromDate
    for (const d of this.data.voucherDetails) {
      const v = this.data.vouchers.find(v => v.id === d.voucherId);
      if (!v) continue;
      if (d.accountId === accountId && v.date < fromDate) {
        dr += d.drAmount; cr += d.crAmount;
      }
    }
    const openingBal = dr - cr;

    // 2. Filter transactions IN date range
    let entries = this.data.voucherDetails
      .filter(d => d.accountId === accountId)
      .map(d => ({ ...d, voucher: this.data.vouchers.find(v => v.id === d.voucherId) }))
      .filter(e => e.voucher && e.voucher.date >= fromDate && e.voucher.date <= toDate)
      .filter(e => filterVchType === 'all' || e.voucher.type === filterVchType)
      .sort((a, b) => a.voucher.date.localeCompare(b.voucher.date));

    // 3. Final Closing
    const currentPeriodResult = entries.reduce((s, e) => s + (e.drAmount - e.crAmount), 0);
    const closingBal = openingBal + currentPeriodResult;

    return { openingBal, entries, closingBal };
  }

  // ── Outstanding ────────────────────────────────────────
  getOutstandingReceivables() {
    return this.data.customers
      .map(cust => {
        const acc = this.data.accounts.find(a => a.id === `party_${cust.id}`);
        if (!acc) return null;
        const bal = this.getLedgerBalance(acc.id);
        return bal > 0 ? { party: cust, amount: bal } : null;
      })
      .filter(Boolean);
  }

  getOutstandingPayables() {
    return this.data.suppliers
      .map(sup => {
        const acc = this.data.accounts.find(a => a.id === `party_${sup.id}`);
        if (!acc) return null;
        const bal = this.getLedgerBalance(acc.id);
        return bal < 0 ? { party: sup, amount: Math.abs(bal) } : null;
      })
      .filter(Boolean);
  }

  getAccountBalances() {
    return this.data.accounts
      .filter(a => a.accountKind === 'cash' || a.accountKind === 'bank' || a.accountKind === 'upi')
      .map(a => ({ account: a, balance: this.getLedgerBalance(a.id) }));
  }

  getRecentTransactions(limit = 10) {
    return [...this.data.vouchers].reverse().slice(0, limit);
  }

  getProductionBatches(stage = null) {
    const batches = [...this.data.productionBatches].reverse();
    return stage ? batches.filter(b => b.stage === stage) : batches;
  }

  // ── Purchase Return (Debit Note) ───────────────────────
  addPurchaseReturn(data) {
    const isInterState = data.supplierStateCode &&
      data.supplierStateCode !== this.data.companyInfo.stateCode;

    const { subtotal, cgst, sgst, igst, grandTotal } = this._calcGST(data.items, isInterState);

    const inventoryData = data.items.map(item => ({
      itemId: item.chemicalId, itemType: 'chemical',
      qty: -item.qty, rate: item.rate, amount: item.amount,
    }));

    const supAcc = this._getOrCreatePartyAccount(data.supplierId, 'supplier');
    const detailsData = [
      { accountId: supAcc.id, partyId: data.supplierId, drAmount: grandTotal, crAmount: 0 },
      { accountId: 'acc_purchase_return', drAmount: 0, crAmount: subtotal },
      ...this._gstDetailEntries(isInterState, { cgst, sgst, igst }, 'input').map(e => ({
        ...e, drAmount: e.crAmount, crAmount: e.drAmount, // reverse
      })),
    ];

    const debitNoteNo = data.debitNoteNo || this.nextDebitNoteNo();
    const voucher = this.addVoucher({
      date: data.date, type: 'Debit Note',
      narration: `Purchase Return — ${data.supplierName || ''} — DN# ${debitNoteNo}`,
      refInvoiceNo: debitNoteNo,
    }, detailsData, inventoryData);

    const returnEntry = {
      id: generateId(), voucherId: voucher.id,
      supplierId: data.supplierId,
      debitNoteNo,
      originalInvoiceNo: data.originalInvoiceNo || '',
      date: data.date || formatDate(), items: data.items,
      subtotal, cgst, sgst, igst, grandTotal,
      reason: data.reason || '',
    };
    this.data.purchaseReturns.push(returnEntry);
    this._markDirty('purchaseReturns');
    this.saveData();
    return returnEntry;
  }

  deletePurchaseReturn(id) {
    const ret = this.data.purchaseReturns.find(r => r.id === id);
    if (ret) {
      this.deleteVoucher(ret.voucherId);
      this.data.purchaseReturns = this.data.purchaseReturns.filter(r => r.id !== id);
      this._markDirty('purchaseReturns');
      this.saveData();
    }
  }

  // ── Sales Return (Credit Note) ─────────────────────────
  addSalesReturn(data) {
    const isInterState = data.customerStateCode &&
      data.customerStateCode !== this.data.companyInfo.stateCode;

    const { subtotal, cgst, sgst, igst, grandTotal } = this._calcGST(data.items, isInterState);

    const inventoryData = data.items.map(item => ({
      itemId: item.productId, itemType: 'product',
      qty: item.qty, rate: item.rate, amount: item.amount,
    }));

    const custAcc = this._getOrCreatePartyAccount(data.customerId, 'customer');
    const detailsData = [
      { accountId: custAcc.id, partyId: data.customerId, drAmount: 0, crAmount: grandTotal },
      { accountId: 'acc_sales_return', drAmount: subtotal, crAmount: 0 },
      ...this._gstDetailEntries(isInterState, { cgst, sgst, igst }, 'output').map(e => ({
        ...e, drAmount: e.crAmount, crAmount: e.drAmount, // reverse
      })),
    ];

    const creditNoteNo = data.creditNoteNo || this.nextCreditNoteNo();
    const voucher = this.addVoucher({
      date: data.date, type: 'Credit Note',
      narration: `Sales Return — ${data.customerName || ''} — CN# ${creditNoteNo}`,
      refInvoiceNo: creditNoteNo,
    }, detailsData, inventoryData);

    const returnEntry = {
      id: generateId(), voucherId: voucher.id,
      customerId: data.customerId,
      creditNoteNo,
      originalInvoiceNo: data.originalInvoiceNo || '',
      date: data.date || formatDate(), items: data.items,
      subtotal, cgst, sgst, igst, grandTotal,
      reason: data.reason || '',
    };
    this.data.salesReturns.push(returnEntry);
    this._markDirty('salesReturns');
    this.saveData();
    return returnEntry;
  }

  deleteSalesReturn(id) {
    const ret = this.data.salesReturns.find(r => r.id === id);
    if (ret) {
      this.deleteVoucher(ret.voucherId);
      this.data.salesReturns = this.data.salesReturns.filter(r => r.id !== id);
      this._markDirty('salesReturns');
      this.saveData();
    }
  }

  // ── Expenses ───────────────────────────────────────────
  addExpense(data) {
    const detailsData = [
      { accountId: data.expenseAccountId, drAmount: data.amount, crAmount: 0 },
      { accountId: data.paidFrom, drAmount: 0, crAmount: data.amount },
    ];
    const expenseAcc = this.data.accounts.find(a => a.id === data.expenseAccountId);
    const voucher = this.addVoucher({
      date: data.date, type: 'Expense',
      narration: `${expenseAcc?.name || 'Expense'} — ${data.description || ''}`,
    }, detailsData);

    const expense = {
      id: generateId(), voucherId: voucher.id,
      date: data.date || formatDate(),
      category: expenseAcc?.name || 'Uncategorized',
      expenseAccountId: data.expenseAccountId,
      amount: data.amount,
      paidFrom: data.paidFrom,
      description: data.description || '',
      recurring: data.recurring || false,
    };
    this.data.expenses.push(expense);
    this._markDirty('expenses');
    this.saveData();
    return expense;
  }

  deleteExpense(id) {
    const exp = this.data.expenses.find(e => e.id === id);
    if (exp) {
      this.deleteVoucher(exp.voucherId);
      this.data.expenses = this.data.expenses.filter(e => e.id !== id);
      this._markDirty('expenses');
      this.saveData();
    }
  }

  getExpenseSummary() {
    const byCategory = {};
    let totalExpenses = 0;
    for (const exp of this.data.expenses) {
      byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
      totalExpenses += exp.amount;
    }
    return { byCategory, totalExpenses, expenses: [...this.data.expenses].reverse() };
  }

  // ── Loans ──────────────────────────────────────────────
  addLoan(data) {
    const loanAccountId = data.type === 'taken' ? 'acc_loan_taken' : 'acc_loan_given';
    const monthlyRate = (data.interestRate || 0) / 12 / 100;
    let emiAmount = 0;
    if (monthlyRate > 0 && data.tenureMonths > 0) {
      emiAmount = Math.round(
        (data.principalAmount * monthlyRate * Math.pow(1 + monthlyRate, data.tenureMonths)) /
        (Math.pow(1 + monthlyRate, data.tenureMonths) - 1)
      );
    } else if (data.tenureMonths > 0) {
      emiAmount = Math.round(data.principalAmount / data.tenureMonths);
    }

    const detailsData = data.type === 'taken'
      ? [
        { accountId: data.receiveInto || 'acc_cash', drAmount: data.principalAmount, crAmount: 0 },
        { accountId: loanAccountId, drAmount: 0, crAmount: data.principalAmount },
      ]
      : [
        { accountId: loanAccountId, drAmount: data.principalAmount, crAmount: 0 },
        { accountId: data.paidFrom || 'acc_cash', drAmount: 0, crAmount: data.principalAmount },
      ];

    const voucher = this.addVoucher({
      date: data.startDate, type: 'Journal',
      narration: `Loan ${data.type} — ${data.partyName} — ₹${data.principalAmount}`,
    }, detailsData);

    const loan = {
      id: generateId(),
      type: data.type,
      partyName: data.partyName || '',
      principalAmount: data.principalAmount,
      interestRate: data.interestRate || 0,
      startDate: data.startDate || formatDate(),
      tenureMonths: data.tenureMonths || 12,
      emiAmount,
      totalPaid: 0,
      status: 'active',
      emis: [],
      accountId: data.receiveInto || data.paidFrom || 'acc_cash',
      description: data.description || '',
      voucherId: voucher.id,
    };
    this.data.loans.push(loan);
    this._markDirty('loans');
    this.saveData();
    return loan;
  }

  addLoanEMI(loanId, data) {
    const loan = this.data.loans.find(l => l.id === loanId);
    if (!loan) return null;

    const principal = Number(data.principalComponent) || 0;
    const interest = Number(data.interestComponent) || 0;
    const totalEmi = principal + interest;

    const detailsData = loan.type === 'taken'
      ? [
        ...(principal > 0 ? [{ accountId: 'acc_loan_taken', drAmount: principal, crAmount: 0 }] : []),
        ...(interest > 0 ? [{ accountId: 'acc_interest_paid', drAmount: interest, crAmount: 0 }] : []),
        { accountId: data.paidFrom || 'acc_cash', drAmount: 0, crAmount: totalEmi },
      ]
      : [
        { accountId: data.receivedIn || 'acc_cash', drAmount: totalEmi, crAmount: 0 },
        ...(principal > 0 ? [{ accountId: 'acc_loan_given', drAmount: 0, crAmount: principal }] : []),
        ...(interest > 0 ? [{ accountId: 'acc_interest_received', drAmount: 0, crAmount: interest }] : []),
      ];

    const voucher = this.addVoucher({
      date: data.date, type: 'Journal',
      narration: `EMI ${loan.type === 'taken' ? 'payment' : 'receipt'} — ${loan.partyName} — ₹${totalEmi}`,
    }, detailsData);

    const emiEntry = {
      id: generateId(),
      date: data.date || formatDate(),
      voucherId: voucher.id,
      principalComponent: principal,
      interestComponent: interest,
      totalAmount: totalEmi,
      paidFrom: data.paidFrom || data.receivedIn || 'acc_cash',
    };
    loan.emis.push(emiEntry);
    loan.totalPaid += totalEmi;

    // FIX 12: Close loan based on EMI count, not interest formula
    const emisPaid = loan.emis.length;
    if (emisPaid >= loan.tenureMonths) {
      loan.status = 'closed';
    }

    this._markDirty('loans');
    this.saveData();
    return emiEntry;
  }

  deleteLoan(id) {
    const loan = this.data.loans.find(l => l.id === id);
    if (loan) {
      loan.emis.forEach(emi => this.deleteVoucher(emi.voucherId));
      this.deleteVoucher(loan.voucherId);
      this.data.loans = this.data.loans.filter(l => l.id !== id);
      this._markDirty('loans');
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

  // ── Delivery Challan ──────────────────────────────────
  addDeliveryChallan(data) {
    const voucherId = generateId();
    const challanNo = this.nextDeliveryChallanNo();

    this.data.vouchers.push({
      id: voucherId, date: data.date, type: 'Delivery Challan',
      voucherNo: challanNo, narration: data.narration
    });

    const ch = {
      id: generateId(), voucherId, customerId: data.customerId,
      challanNo, date: data.date, items: data.items, narration: data.narration
    };
    this.data.deliveryChallans.push(ch);

    // Hit physical inventory only, bypass accounting ledgers
    for (const it of data.items) {
      if (it.qty > 0) {
        this.data.inventoryTransactions.push({
          id: generateId(), voucherId, itemId: it.productId,
          itemType: 'product', qty: -it.qty, rate: 0, amount: 0
        });
      }
    }

    this._markDirty('vouchers', 'deliveryChallans', 'inventoryTransactions');
    this.saveData();
    return ch;
  }

  deleteDeliveryChallan(id) {
    const ch = this.data.deliveryChallans.find(c => c.id === id);
    if (!ch) return;
    this._remoteDelete('delivery_challans', id);
    this.deleteVoucher(ch.voucherId);
  }

  // ── Seed ───────────────────────────────────────────────
  seedSampleData() {
    // Extend this as needed — left intentionally empty for fresh installs
  }
}

export const db = new Database();