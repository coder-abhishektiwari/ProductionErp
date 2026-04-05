// ============================================================
// SUPABASE SYNC ENGINE — Per-Table Sync (Full Relational)
// ============================================================
// ARCHITECTURE:
//   Each db.data key has its OWN supabase table:
//     db.data.vouchers     → erp_vouchers
//     db.data.accounts     → erp_accounts
//     db.data.companyInfo  → erp_company_info
//     etc.
//
//   Array data: stored as (id, company_id, data JSONB)
//   Object data: stored as (company_id, data JSONB)
//
//   Multi-owner: company_owners junction table
// ============================================================

import { getSupabase, isSupabaseConfigured } from './supabase-config.js';

// ── db.data key → Supabase table name mapping ─────────────
const TABLE_MAP = {
  // Single-object tables (1 row per company, no id field)
  companyInfo: { table: 'erp_company_info', type: 'object' },
  sequences:   { table: 'erp_sequences',    type: 'object' },

  // Array tables (many rows per company, each row has id)
  chemicals:             { table: 'erp_chemicals',              type: 'array' },
  products:              { table: 'erp_products',               type: 'array' },
  sheetTypes:            { table: 'erp_sheet_types',            type: 'array' },
  customers:             { table: 'erp_customers',              type: 'array' },
  suppliers:             { table: 'erp_suppliers',              type: 'array' },
  accounts:              { table: 'erp_accounts',               type: 'array' },
  accountGroups:         { table: 'erp_account_groups',         type: 'array' },
  vouchers:              { table: 'erp_vouchers',               type: 'array' },
  voucherDetails:        { table: 'erp_voucher_details',        type: 'array' },
  inventoryTransactions: { table: 'erp_inventory_transactions', type: 'array' },
  productionBatches:     { table: 'erp_production_batches',     type: 'array' },
  customerOrders:        { table: 'erp_customer_orders',        type: 'array' },
  cheques:               { table: 'erp_cheques',                type: 'array' },
  purchaseInvoices:      { table: 'erp_purchase_invoices',      type: 'array' },
  salesInvoices:         { table: 'erp_sales_invoices',         type: 'array' },
  scrapSaleInvoices:     { table: 'erp_scrap_sale_invoices',    type: 'array' },
  sheetSaleInvoices:     { table: 'erp_sheet_sale_invoices',    type: 'array' },
  purchaseReturns:       { table: 'erp_purchase_returns',       type: 'array' },
  salesReturns:          { table: 'erp_sales_returns',          type: 'array' },
  deliveryChallans:      { table: 'erp_delivery_challans',      type: 'array' },
  expenses:              { table: 'erp_expenses',               type: 'array' },
  loans:                 { table: 'erp_loans',                  type: 'array' },
  companyUsers:          { table: 'erp_company_users',          type: 'array' },
};

// ── Sync State ─────────────────────────────────────────────
const syncState = {
  lastSynced: null,
  isSyncing: false,
  lastError: null,
  isOnline: navigator.onLine,
  autoSyncEnabled: true,
  autoSyncInterval: 60000,
  pendingChanges: false,
  progress: '', // 'Uploading vouchers...'
  _autoSyncTimer: null,
  _listeners: [],
};

function _loadPrefs() {
  try {
    const prefs = JSON.parse(localStorage.getItem('_syncPrefs') || '{}');
    if (typeof prefs.autoSyncEnabled === 'boolean') syncState.autoSyncEnabled = prefs.autoSyncEnabled;
    if (prefs.autoSyncInterval) syncState.autoSyncInterval = Number(prefs.autoSyncInterval);
    if (prefs.lastSynced) syncState.lastSynced = new Date(prefs.lastSynced);
  } catch (e) { /* ignore */ }
}

function _savePrefs() {
  localStorage.setItem('_syncPrefs', JSON.stringify({
    autoSyncEnabled: syncState.autoSyncEnabled,
    autoSyncInterval: syncState.autoSyncInterval,
    lastSynced: syncState.lastSynced?.toISOString() || null,
  }));
}

function _notify() {
  syncState._listeners.forEach(fn => {
    try { fn({ ...syncState }); } catch (e) { /* ignore */ }
  });
}

function _friendlyError(e) {
  const msg = e?.message || e?.details || String(e);
  if (msg.includes('schema cache') || msg.includes('does not exist') || msg.includes('relation')) {
    return 'Tables not found. Run supabase-schema.sql in SQL Editor first.';
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Cannot connect to Supabase. Check internet.';
  }
  if (msg.includes('JWT') || msg.includes('apikey')) {
    return 'Invalid Supabase credentials.';
  }
  return msg;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { syncState.isOnline = true; _notify(); });
  window.addEventListener('offline', () => { syncState.isOnline = false; _notify(); });
}

// ── Ensure company exists ─────────────────────────────────
async function _ensureCompanyExists(supabase, companyId) {
  try {
    const name = localStorage.getItem('company_name') || companyId;
    const username = localStorage.getItem('master_username') || 'admin';
    // Upsert company
    await supabase.from('system_companies')
      .upsert({ id: companyId, name }, { onConflict: 'id' });
    // Upsert owner
    await supabase.from('company_owners')
      .upsert({ company_id: companyId, username, role: 'OWNER' },
        { onConflict: 'company_id,username' });
  } catch (e) {
    console.warn('_ensureCompanyExists:', e.message);
  }
}

// ═══════════════════════════════════════════════════════════
// UPLOAD: IndexedDB → Supabase (per-table)
// ═══════════════════════════════════════════════════════════
async function uploadToCloud(db) {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };
  if (syncState.isSyncing) return { success: false, error: 'Sync in progress' };
  if (!syncState.isOnline) return { success: false, error: 'Offline' };

  const supabase = getSupabase();
  const companyId = localStorage.getItem('company_id');
  if (!companyId) return { success: false, error: 'No company selected' };

  syncState.isSyncing = true;
  syncState.lastError = null;
  syncState.progress = 'Starting upload...';
  _notify();

  try {
    await _ensureCompanyExists(supabase, companyId);

    const keys = Object.keys(TABLE_MAP);
    let uploaded = 0;

    for (const key of keys) {
      const { table, type } = TABLE_MAP[key];
      const localData = db.data[key];
      if (localData === undefined) continue;

      syncState.progress = `Uploading ${key}... (${++uploaded}/${keys.length})`;
      _notify();

      if (type === 'object') {
        // Single-object: upsert one row
        const { error } = await supabase.from(table)
          .upsert({ company_id: companyId, data: localData }, { onConflict: 'company_id' });
        if (error) throw new Error(`${key}: ${_friendlyError(error)}`);
      }
      else if (type === 'array') {
        // Array: delete old + bulk insert
        if (!Array.isArray(localData)) continue;

        // Step 1: Delete all existing rows for this company
        const { error: delErr } = await supabase.from(table)
          .delete().eq('company_id', companyId);
        if (delErr) throw new Error(`${key} delete: ${_friendlyError(delErr)}`);

        // Step 2: Bulk insert in batches of 500
        if (localData.length > 0) {
          const BATCH = 500;
          for (let i = 0; i < localData.length; i += BATCH) {
            const batch = localData.slice(i, i + BATCH).map(record => ({
              id: record.id || `auto_${i}_${Math.random().toString(36).substr(2, 6)}`,
              company_id: companyId,
              data: record,
            }));
            const { error: insErr } = await supabase.from(table).insert(batch);
            if (insErr) throw new Error(`${key} insert: ${_friendlyError(insErr)}`);
          }
        }
      }
    }

    syncState.lastSynced = new Date();
    syncState.pendingChanges = false;
    syncState.lastError = null;
    syncState.progress = '';
    _savePrefs();
    _notify();
    console.log(`☁️ Upload complete! ${uploaded} tables synced.`);
    return { success: true, tables: uploaded };
  } catch (e) {
    console.error('☁️ Upload failed:', e.message);
    syncState.lastError = _friendlyError(e);
    syncState.progress = '';
    _notify();
    return { success: false, error: syncState.lastError };
  } finally {
    syncState.isSyncing = false;
    _notify();
  }
}

// ═══════════════════════════════════════════════════════════
// DOWNLOAD: Supabase → IndexedDB (per-table)
// ═══════════════════════════════════════════════════════════
async function downloadFromCloud(db) {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };
  if (syncState.isSyncing) return { success: false, error: 'Sync in progress' };
  if (!syncState.isOnline) return { success: false, error: 'Offline' };

  const supabase = getSupabase();
  const companyId = localStorage.getItem('company_id');
  if (!companyId) return { success: false, error: 'No company selected' };

  syncState.isSyncing = true;
  syncState.lastError = null;
  syncState.progress = 'Starting download...';
  _notify();

  try {
    const remoteState = {};
    const keys = Object.keys(TABLE_MAP);
    let downloaded = 0;
    let hasData = false;

    for (const key of keys) {
      const { table, type } = TABLE_MAP[key];

      syncState.progress = `Downloading ${key}... (${++downloaded}/${keys.length})`;
      _notify();

      if (type === 'object') {
        const { data, error } = await supabase.from(table)
          .select('data').eq('company_id', companyId).maybeSingle();
        if (error) throw new Error(`${key}: ${_friendlyError(error)}`);
        if (data?.data) {
          remoteState[key] = data.data;
          hasData = true;
        }
      }
      else if (type === 'array') {
        const { data, error } = await supabase.from(table)
          .select('data').eq('company_id', companyId);
        if (error) throw new Error(`${key}: ${_friendlyError(error)}`);
        if (data && data.length > 0) {
          remoteState[key] = data.map(row => row.data);
          hasData = true;
        }
      }
    }

    if (!hasData) {
      syncState.lastSynced = new Date();
      syncState.progress = '';
      _savePrefs();
      _notify();
      return { success: true, message: 'No cloud data found. Upload first!' };
    }

    // Merge into local db
    db.mergeRemoteState(remoteState);
    syncState.lastSynced = new Date();
    syncState.pendingChanges = false;
    syncState.lastError = null;
    syncState.progress = '';
    _savePrefs();
    _notify();
    console.log(`☁️ Download complete! ${downloaded} tables synced.`);
    return { success: true, tables: downloaded };
  } catch (e) {
    console.error('☁️ Download failed:', e.message);
    syncState.lastError = _friendlyError(e);
    syncState.progress = '';
    _notify();
    return { success: false, error: syncState.lastError };
  } finally {
    syncState.isSyncing = false;
    _notify();
  }
}

// ═══════════════════════════════════════════════════════════
// AUTO SYNC
// ═══════════════════════════════════════════════════════════

function startAutoSync(db) {
  stopAutoSync();
  if (!syncState.autoSyncEnabled) return;
  syncState._autoSyncTimer = setInterval(async () => {
    if (!syncState.isOnline || syncState.isSyncing) return;
    if (!isSupabaseConfigured() || !localStorage.getItem('company_id')) return;
    if (syncState.pendingChanges) {
      console.log('⏱️ Auto-sync: uploading...');
      await uploadToCloud(db);
    }
  }, syncState.autoSyncInterval);
  console.log(`⏱️ Auto-sync started (${syncState.autoSyncInterval / 1000}s)`);
}

function stopAutoSync() {
  if (syncState._autoSyncTimer) {
    clearInterval(syncState._autoSyncTimer);
    syncState._autoSyncTimer = null;
  }
}

function setAutoSync(enabled, db) {
  syncState.autoSyncEnabled = enabled;
  _savePrefs();
  if (enabled && db) startAutoSync(db);
  else stopAutoSync();
  _notify();
}

function setAutoSyncInterval(ms, db) {
  syncState.autoSyncInterval = ms;
  _savePrefs();
  if (syncState.autoSyncEnabled && db) { stopAutoSync(); startAutoSync(db); }
  _notify();
}

function markPendingChanges() {
  syncState.pendingChanges = true;
  _notify();
}

function subscribe(listener) {
  syncState._listeners.push(listener);
  return () => { syncState._listeners = syncState._listeners.filter(l => l !== listener); };
}

function getStatus() {
  return {
    lastSynced: syncState.lastSynced,
    isSyncing: syncState.isSyncing,
    lastError: syncState.lastError,
    isOnline: syncState.isOnline,
    autoSyncEnabled: syncState.autoSyncEnabled,
    autoSyncInterval: syncState.autoSyncInterval,
    pendingChanges: syncState.pendingChanges,
    progress: syncState.progress,
    configured: isSupabaseConfigured(),
  };
}

function init(db) {
  _loadPrefs();
  if (syncState.autoSyncEnabled) startAutoSync(db);
  syncState.isOnline = navigator.onLine;
  _notify();
}

// ═══════════════════════════════════════════════════════════
// AUTH: MASTER LOGIN
// ═══════════════════════════════════════════════════════════

async function masterLogin(username, password) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const supabase = getSupabase();
  const { data, error } = await supabase.from('system_users')
    .select('id, username, display_name')
    .eq('username', username).eq('password', password).maybeSingle();
  if (error) throw new Error(_friendlyError(error));
  if (!data) throw new Error('Invalid username or password');
  return { id: data.id, username: data.username, displayName: data.display_name || data.username };
}

async function masterRegister(username, password, displayName) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const supabase = getSupabase();
  const { data: existing } = await supabase.from('system_users')
    .select('username').eq('username', username).maybeSingle();
  if (existing) throw new Error('Username already taken');
  const { error } = await supabase.from('system_users')
    .insert({ username, password, display_name: displayName || username });
  if (error) throw new Error(_friendlyError(error));
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
// COMPANY MANAGEMENT (Multi-Owner)
// ═══════════════════════════════════════════════════════════

async function fetchCompanies(ownerUsername) {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();
  // Fetch companies where this user is an owner
  const { data: ownerships, error: owErr } = await supabase.from('company_owners')
    .select('company_id').eq('username', ownerUsername);
  if (owErr) throw new Error(_friendlyError(owErr));
  if (!ownerships || ownerships.length === 0) return [];

  const companyIds = ownerships.map(o => o.company_id);
  const { data, error } = await supabase.from('system_companies')
    .select('id, name, created_at')
    .in('id', companyIds)
    .order('created_at', { ascending: false });
  if (error) throw new Error(_friendlyError(error));
  return data || [];
}

async function createCompany(companyName, ownerUsername) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const supabase = getSupabase();
  const cid = companyName.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 20)
    + '_' + Date.now().toString(36).toUpperCase();

  // Create company
  const { error: compErr } = await supabase.from('system_companies')
    .insert({ id: cid, name: companyName });
  if (compErr) throw new Error(_friendlyError(compErr));

  // Add owner
  const { error: ownErr } = await supabase.from('company_owners')
    .insert({ company_id: cid, username: ownerUsername, role: 'OWNER' });
  if (ownErr) throw new Error(_friendlyError(ownErr));

  return { success: true, companyId: cid };
}

async function addCompanyOwner(companyId, username, role = 'OWNER') {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const supabase = getSupabase();
  const { error } = await supabase.from('company_owners')
    .upsert({ company_id: companyId, username, role }, { onConflict: 'company_id,username' });
  if (error) throw new Error(_friendlyError(error));
  return { success: true };
}

async function removeCompanyOwner(companyId, username) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const supabase = getSupabase();
  const { error } = await supabase.from('company_owners')
    .delete().eq('company_id', companyId).eq('username', username);
  if (error) throw new Error(_friendlyError(error));
  return { success: true };
}

async function fetchCompanyOwners(companyId) {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();
  const { data, error } = await supabase.from('company_owners')
    .select('username, role, added_at').eq('company_id', companyId);
  if (error) throw new Error(_friendlyError(error));
  return data || [];
}

async function fetchAllCompanies() {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();
  const { data, error } = await supabase.from('system_companies')
    .select('id, name').order('created_at', { ascending: false });
  if (error) throw new Error(_friendlyError(error));
  return data || [];
}

// ═══════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════

export const SyncEngine = {
  init, uploadToCloud, downloadFromCloud,
  startAutoSync, stopAutoSync, setAutoSync, setAutoSyncInterval,
  markPendingChanges, subscribe, getStatus,
  masterLogin, masterRegister,
  fetchCompanies, createCompany, fetchAllCompanies,
  addCompanyOwner, removeCompanyOwner, fetchCompanyOwners,
  TABLE_MAP,
};

export default SyncEngine;
