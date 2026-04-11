// ============================================================
// SUPABASE SYNC ENGINE — Per-Table Sync (Full Relational)
// ============================================================
// FIX APPLIED:
//   1. UPSERT instead of DELETE+INSERT → prevents data wipe on network cut
//   2. Dirty-key tracking → only changed tables are uploaded (not all 28)
//   3. Offline delete queue → retried automatically on reconnect
//   4. Password hashed via SHA-256 (SubtleCrypto) before DB storage
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
  lastUploaded: null,
  lastDownloaded: null,
  isSyncing: false,
  lastError: null,
  isOnline: navigator.onLine,
  autoSyncEnabled: true,
  autoSyncInterval: 60000,
  pendingChanges: false,
  dirtyKeys: new Set(),
  progress: '',
  _autoSyncTimer: null,
  _listeners: [],
};

// ── FIX 3: Offline Delete Queue (persisted in localStorage) ─
const OFFLINE_QUEUE_KEY = '_deleteQueue';

function _loadDeleteQueue() {
  try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]'); }
  catch { return []; }
}

function _saveDeleteQueue(q) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q));
}

function _enqueueDelete(table, id) {
  const q = _loadDeleteQueue();
  // Avoid duplicates
  if (!q.some(item => item.table === table && item.id === id)) {
    q.push({ table, id, company_id: localStorage.getItem('company_id') });
  }
  _saveDeleteQueue(q);
}

async function _flushDeleteQueue(supabase) {
  const q = _loadDeleteQueue();
  if (q.length === 0) return;
  const remaining = [];
  for (const item of q) {
    try {
      const { error } = await supabase.from(item.table)
        .delete().eq('id', item.id).eq('company_id', item.company_id);
      if (error) remaining.push(item); // keep for retry
    } catch {
      remaining.push(item);
    }
  }
  _saveDeleteQueue(remaining);
  if (remaining.length < q.length) {
    console.log(`🗑️ Flushed ${q.length - remaining.length} queued deletes.`);
  }
}

// ── Prefs ──────────────────────────────────────────────────
function _loadPrefs() {
  try {
    const prefs = JSON.parse(localStorage.getItem('_syncPrefs') || '{}');
    if (typeof prefs.autoSyncEnabled === 'boolean') syncState.autoSyncEnabled = prefs.autoSyncEnabled;
    if (prefs.autoSyncInterval) syncState.autoSyncInterval = Number(prefs.autoSyncInterval);
    if (prefs.lastUploaded) syncState.lastUploaded = new Date(prefs.lastUploaded);
    if (prefs.lastDownloaded) syncState.lastDownloaded = new Date(prefs.lastDownloaded);
    // Legacy support
    if (prefs.lastSynced && !prefs.lastDownloaded) syncState.lastDownloaded = new Date(prefs.lastSynced);
  } catch { /* ignore */ }
}

function _savePrefs() {
  localStorage.setItem('_syncPrefs', JSON.stringify({
    autoSyncEnabled: syncState.autoSyncEnabled,
    autoSyncInterval: syncState.autoSyncInterval,
    lastUploaded: syncState.lastUploaded?.toISOString() || null,
    lastDownloaded: syncState.lastDownloaded?.toISOString() || null,
  }));
}

let _lastNotify = 0;
function _notify(force = false) {
  const now = Date.now();
  // Throttle during high-frequency updates (like progress bars)
  // but allow immediate for start/stop/error
  if (!force && (now - _lastNotify < 100)) return; 
  _lastNotify = now;
  
  syncState._listeners.forEach(fn => {
    try { fn({ ...syncState, dirtyKeys: [...syncState.dirtyKeys] }); } catch { /* ignore */ }
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
  window.addEventListener('online', () => {
    syncState.isOnline = true;
    _notify();
    // Auto-flush delete queue when back online
    if (isSupabaseConfigured()) {
      _flushDeleteQueue(getSupabase()).catch(console.warn);
    }
  });
  window.addEventListener('offline', () => { syncState.isOnline = false; _notify(); });
}

// ── Ensure company exists ─────────────────────────────────
async function _ensureCompanyExists(supabase, companyId) {
  try {
    const name = localStorage.getItem('company_name') || companyId;
    const username = localStorage.getItem('master_username') || 'admin';
    await supabase.from('system_companies')
      .upsert({ id: companyId, name }, { onConflict: 'id' });
    await supabase.from('company_owners')
      .upsert({ company_id: companyId, username, role: 'OWNER' },
        { onConflict: 'company_id,username' });
  } catch (e) {
    console.warn('_ensureCompanyExists:', e.message);
  }
}

// ── FIX 4: SHA-256 password hash ─────────────────────────
async function _hashPassword(plaintext) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback: store as-is if SubtleCrypto unavailable (shouldn't happen in modern browsers)
    return plaintext;
  }
}

// ═══════════════════════════════════════════════════════════
// FIX 1+2: UPLOAD using UPSERT (safe) + dirty keys only
// ═══════════════════════════════════════════════════════════
async function uploadToCloud(db, keysToSync = null) {
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

    // FIX 3: Flush any queued deletes first
    await _flushDeleteQueue(supabase);

    // FIX 2: Only sync dirty keys (or all if forced)
    const keysToProcess = keysToSync
      ? keysToSync
      : (syncState.dirtyKeys.size > 0 ? [...syncState.dirtyKeys] : Object.keys(TABLE_MAP));

    let uploaded = 0;
    const total = keysToProcess.length;

    for (const key of keysToProcess) {
      const mapping = TABLE_MAP[key];
      if (!mapping) continue;
      const { table, type } = mapping;
      const localData = db.data[key];
      if (localData === undefined) continue;

      syncState.progress = `Uploading ${key}... (${++uploaded}/${total})`;
      _notify();

      if (type === 'object') {
        // FIX 1: UPSERT for single-object tables (safe, no data loss)
        const { error } = await supabase.from(table)
          .upsert({ company_id: companyId, data: localData }, { onConflict: 'company_id' });
        if (error) throw new Error(`${key}: ${_friendlyError(error)}`);
      }
      else if (type === 'array') {
        if (!Array.isArray(localData)) continue;

        // FIX 1: UPSERT rows instead of DELETE+INSERT
        // This is safe even if network cuts mid-way — partial data is never lost
        const BATCH = 500;
        for (let i = 0; i < localData.length; i += BATCH) {
          const batch = localData.slice(i, i + BATCH).map(record => ({
            id: record.id || `auto_${i}_${Math.random().toString(36).substr(2, 6)}`,
            company_id: companyId,
            data: record,
          }));
          const { error: upsErr } = await supabase.from(table)
            .upsert(batch, { onConflict: 'id,company_id' });
          if (upsErr) throw new Error(`${key} upsert: ${_friendlyError(upsErr)}`);
        }

        // BATCH UPSERT COMPLETED
        // Deleted items are handled safely via the offline delete queue (_flushDeleteQueue)
      }
    }

    // Clear only the keys we just synced
    keysToProcess.forEach(k => syncState.dirtyKeys.delete(k));
    syncState.lastUploaded = new Date();
    syncState.pendingChanges = syncState.dirtyKeys.size > 0;
    syncState.lastError = null;
    syncState.progress = '';
    _savePrefs();
    _notify();
    console.log(`☁️ Upload complete! ${uploaded} tables synced.`);
    return { success: true, count: uploaded };
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
async function downloadFromCloud(db, silent = false) {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };
  if (syncState.isSyncing) return { success: false, error: 'Sync in progress' };
  if (!syncState.isOnline) return { success: false, error: 'Offline' };

  const supabase = getSupabase();
  const companyId = localStorage.getItem('company_id');
  if (!companyId) return { success: false, error: 'No company selected' };

  syncState.isSyncing = true;
  syncState.lastError = null;
  if (!silent) syncState.progress = 'Starting download...';
  _notify();

  console.log(`☁️ Download started (silent: ${silent})`);
  try {
    const remoteState = {};
    const keys = Object.keys(TABLE_MAP);
    let downloaded = 0;
    let hasData = false;

    for (const key of keys) {
      const { table, type } = TABLE_MAP[key];
      if (!silent) {
        syncState.progress = `Downloading ${key}... (${++downloaded}/${keys.length})`;
        _notify();
      } else {
        downloaded++;
      }

      if (type === 'object') {
        const { data, error } = await supabase.from(table)
          .select('data').eq('company_id', companyId).maybeSingle();
        if (error) throw new Error(`${key}: ${_friendlyError(error)}`);
        if (data?.data) {
          remoteState[key] = data.data;
          hasData = true;
        }
      } else if (type === 'array') {
        const { data, error } = await supabase.from(table)
          .select('data').eq('company_id', companyId);
        if (error) throw new Error(`${key}: ${_friendlyError(error)}`);
        if (data && data.length > 0) {
          remoteState[key] = data.map(row => row.data);
          hasData = true;
        }
      }
    }

    if (!hasData && !silent) {
      syncState.lastDownloaded = new Date();
      syncState.progress = '';
      _savePrefs();
      _notify();
      return { success: true, message: 'No cloud data found. Upload first!' };
    }

    // Mark sync completed BEFORE alerting the UI
    syncState.lastDownloaded = new Date();
    syncState.dirtyKeys.clear();
    syncState.pendingChanges = false;
    syncState.lastError = null;
    syncState.progress = '';
    _savePrefs();
    _notify();

    console.log(`☁️ Download complete! ${downloaded} tables synced.`);
    db.mergeRemoteState(remoteState, silent);
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
    const cid = localStorage.getItem('company_id');
    if (!isSupabaseConfigured() || !cid) return;

    // 1. Always attempt pending uploads
    if (syncState.pendingChanges) {
      console.log('⏱️ Auto-sync: uploading dirty keys:', [...syncState.dirtyKeys]);
      await uploadToCloud(db);
    } 
    
    // 2. Independently check for downloads if it's been more than 2 mins
    // (Pehle ye uploads ke piche fans jata tha, ab dono independent hain)
    const now = Date.now();
    const lastDL = syncState.lastDownloaded ? syncState.lastDownloaded.getTime() : 0;
    if (now - lastDL > 120000) { 
      console.log('⏱️ Auto-sync: pulse background download');
      await downloadFromCloud(db, true); // SILENT
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

// FIX 2: markPendingChanges now accepts dirty keys
function markPendingChanges(keys = []) {
  syncState.pendingChanges = true;
  keys.forEach(k => syncState.dirtyKeys.add(k));
  _notify();
}

// FIX 3: Public enqueue for offline deletes (called from db.js _remoteDelete)
function enqueueRemoteDelete(table, id) {
  if (syncState.isOnline && isSupabaseConfigured()) {
    // Try immediate delete
    const companyId = localStorage.getItem('company_id');
    if (companyId) {
      getSupabase().from(table).delete().eq('id', id).eq('company_id', companyId)
        .then(({ error }) => {
          if (error) _enqueueDelete(table, id); // queue on failure
        })
        .catch(() => _enqueueDelete(table, id));
    }
  } else {
    _enqueueDelete(table, id);
  }
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
    dirtyCount: syncState.dirtyKeys.size,
  };
}

function init(db) {
  _loadPrefs();
  if (syncState.autoSyncEnabled) startAutoSync(db);
  syncState.isOnline = navigator.onLine;

  // Auto-Download on fresh browser
  if (!syncState.lastDownloaded && isSupabaseConfigured() && localStorage.getItem('company_id')) {
    console.log("⏱️ Auto-download triggered (fresh device login)");
    downloadFromCloud(db).catch(e => console.warn("Auto-download failed:", e));
  }

  _notify();
}

// ═══════════════════════════════════════════════════════════
// AUTH: MASTER LOGIN (with hashed password)
// ═══════════════════════════════════════════════════════════

async function masterLogin(username, password) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const supabase = getSupabase();
  const hashed = await _hashPassword(password);

  // Try hashed first (new accounts), fallback to plain (legacy/initial seed)
  let { data, error } = await supabase.from('system_users')
    .select('id, username, display_name')
    .eq('username', username).eq('password', hashed).maybeSingle();

  if (!data && !error) {
    // Fallback: try plain password for legacy/seed accounts
    const res = await supabase.from('system_users')
      .select('id, username, display_name')
      .eq('username', username).eq('password', password).maybeSingle();
    data = res.data;
    error = res.error;

    // If found via plain password, upgrade to hashed automatically
    if (data) {
      await supabase.from('system_users')
        .update({ password: hashed }).eq('username', username);
      console.log('🔒 Password upgraded to hashed for:', username);
    }
  }

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

  const hashed = await _hashPassword(password);
  const { error } = await supabase.from('system_users')
    .insert({ username, password: hashed, display_name: displayName || username });
  if (error) throw new Error(_friendlyError(error));
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
// COMPANY MANAGEMENT (Multi-Owner)
// ═══════════════════════════════════════════════════════════

async function fetchCompanies(ownerUsername) {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();
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

  const { error: compErr } = await supabase.from('system_companies')
    .insert({ id: cid, name: companyName });
  if (compErr) throw new Error(_friendlyError(compErr));

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
  markPendingChanges, enqueueRemoteDelete,
  subscribe, getStatus,
  masterLogin, masterRegister,
  fetchCompanies, createCompany, fetchAllCompanies,
  addCompanyOwner, removeCompanyOwner, fetchCompanyOwners,
  TABLE_MAP,
};

export default SyncEngine;
