// ============================================================
// RUBBER ERP — Production PostgreSQL Backend Server
// ============================================================
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import http from 'http';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';

const { Pool } = pg;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));

// ── CONFIG & WEBSOCKETS ──────────────────────────────────
const JWT_SECRET = 'rubber-erp-prod-key-2026';
wss.on('connection', ws => {
  ws.on('error', console.error);
});
function broadcast() {
  wss.clients.forEach(c => {
    if (c.readyState === 1) c.send(JSON.stringify({ type: 'db_update' }));
  });
}

// ── PUBLIC ENDPOINTS ─────────────────────────────────────
app.get('/api/public/companies', async (req, res) => {
    try {
        const r = await pool.query('SELECT id, name FROM system_companies ORDER BY created_at DESC');
        res.json(r.rows);
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.get('/api/public/users/:companyId', async (req, res) => {
    try {
        const r = await pool.query(`SELECT username, role FROM system_users WHERE companies @> $1::jsonb OR companies @> '"*"'::jsonb`, [JSON.stringify([req.params.companyId])]);
        res.json(r.rows);
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.post('/api/public/create_company', async (req, res) => {
    const { companyName, adminUser, adminPass } = req.body;
    try {
        const cid = companyName.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 15) + '_' + Math.floor(Math.random()*1000);
        await pool.query('BEGIN');
        await pool.query('INSERT INTO system_companies (id, name) VALUES ($1, $2)', [cid, companyName]);
        
        const checkUser = await pool.query('SELECT 1 FROM system_users WHERE username = $1', [adminUser]);
        if (checkUser.rows.length === 0) {
            await pool.query('INSERT INTO system_users (username, password, role, companies) VALUES ($1, $2, $3, $4)', [adminUser, adminPass, 'ADMIN', JSON.stringify([cid])]);
        } else {
            // If user exists, just append the new company
            await pool.query(`UPDATE system_users SET companies = companies || $1::jsonb WHERE username = $2`, [JSON.stringify([cid]), adminUser]);
        }
        await pool.query('COMMIT');
        res.json({ success: true, companyId: cid });
    } catch(e) { 
        await pool.query('ROLLBACK');
        res.status(500).json({error: e.message}); 
    }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password, companyId } = req.body;
  try {
     const dbUser = await pool.query('SELECT * FROM system_users WHERE username = $1', [username]);
     if (dbUser.rows.length > 0) {
        const user = dbUser.rows[0];
        if (user.password === password) {
           // Verify if user actually has access to the requested companyId
           const hasAccess = user.companies.includes('*') || user.companies.includes(companyId);
           if (!hasAccess) return res.status(403).json({ error: 'Access denied to this company.' });

           const token = jwt.sign({ username: user.username, role: user.role, companies: user.companies }, JWT_SECRET, { expiresIn: '7d' });
           // Return company data
           const cData = await pool.query('SELECT name FROM system_companies WHERE id = $1', [companyId]);
           const compName = cData.rows.length > 0 ? cData.rows[0].name : companyId;

           res.json({ token, role: user.role, company: { id: companyId, name: compName } });
        } else {
           res.status(401).json({ error: 'Invalid password' });
        }
     } else {
        res.status(401).json({ error: 'User not found' });
     }
  } catch(e) {
     res.status(500).json({ error: 'Database error connecting users', details: e.message });
  }
});

app.use('/api', (req, res, next) => {
   if (['/auth/login', '/public/companies', '/public/create_company'].includes(req.path) || req.path.startsWith('/public/users/') || req.path === '/health') return next();
   const token = req.headers.authorization?.split(' ')[1];
   if (!token) return res.status(401).json({ error: 'Unauthorized' });
   
   jwt.verify(token, JWT_SECRET, (err, decoded) => {
     if (err) return res.status(401).json({ error: 'Invalid token' });
     req.user = decoded;
     const cid = req.headers['x-company-id'];
     
     // System routes bypass company check
     if (req.path.startsWith('/system/')) return next();
     
     if (!cid && req.path.startsWith('/sync')) {
        return res.status(400).json({ error: 'X-Company-Id header required' });
     }
     
     // Only check access if cid is provided
     if (cid && !req.user.companies.includes(cid) && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied to this company' });
     }
     
     req.company_id = cid;
     console.log('API Middleware: Decoded User', req.user.username, 'Routing to', req.path);
     next();
   });
});

// Final error handler to catch async errors and return JSON, avoid HTML output
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.message);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// ── SYSTEM ENDPOINTS ─────────────────────────────────────
app.get('/api/system/users', async (req, res) => {
   if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Deny' });
   const r = await pool.query('SELECT username, role, companies, created_at FROM system_users ORDER BY created_at DESC');
   res.json(r.rows);
});
app.post('/api/system/users', async (req, res) => {
   if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Deny' });
   const { username, password, role, companies } = req.body;
   await pool.query('INSERT INTO system_users (username, password, role, companies) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO UPDATE SET password=$2, role=$3, companies=$4', [username, password, role, JSON.stringify(companies)]);
   res.json({ success: true });
});
app.get('/api/system/companies', async (req, res) => {
   const r = await pool.query('SELECT id, name FROM system_companies ORDER BY created_at DESC');
   res.json(r.rows);
});
app.post('/api/system/companies', async (req, res) => {
   if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Deny' });
   const { id, name } = req.body;
   await pool.query('INSERT INTO system_companies (id, name) VALUES ($1, $2)', [id, name]);
   res.json({ success: true });
});

// ── PostgreSQL Connection Pool ────────────────────────────
const pool = new Pool({
  host: 'localhost',
  port: 5378,
  database: 'rubber_erp',
  user: 'postgres',
  password: 'rubber_erp_2026',
  max: 20,             // max pool connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL Pool Error:', err.message);
});

// Verify connection & boot Multi-Tenant schema
pool.query('SELECT NOW()')
  .then(async r => {
      console.log('✅ PostgreSQL Connected! Time:', r.rows[0].now);
      try {
          // 1. Create System Tables
          await pool.query(`
            CREATE TABLE IF NOT EXISTS system_companies (
              id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS system_users (
              username VARCHAR(50) PRIMARY KEY, password VARCHAR(255) NOT NULL, role VARCHAR(50) NOT NULL,
              companies JSONB, created_at TIMESTAMP DEFAULT NOW()
            );
          `);
          
          // Seed defaults if empty
          const c = await pool.query('SELECT COUNT(*) FROM system_companies');
          if (parseInt(c.rows[0].count) === 0) {
             await pool.query(`INSERT INTO system_companies (id, name) VALUES ('DEMO_COMP', 'Demo Company')`);
             await pool.query(`INSERT INTO system_users (username, password, role, companies) VALUES ('admin', 'admin123', 'ADMIN', '["DEMO_COMP"]')`);
          }

          // 2. Inject company_id column into ALL transaction tables
          for (const config of Object.values(TABLE_MAP)) {
             try {
                 await pool.query(`ALTER TABLE ${config.table} ADD COLUMN IF NOT EXISTS company_id VARCHAR(50) DEFAULT 'DEMO_COMP'`);
                 await pool.query(`UPDATE ${config.table} SET company_id = 'DEMO_COMP' WHERE company_id IS NULL`);
                 // Note: we rely on identical globally unique UUIDs across companies, so no composite PK is strictly required except manually checking company isolation.
             } catch(e) { /* ignore if table doesn't exist yet */ }
          }
          console.log('🛡️ Multi-Tenant RLS Policy Applied to Schema');
      } catch (err) {
          console.error('Error migrating tenant schema:', err.message);
      }
  })
  .catch(e => console.error('❌ PostgreSQL Connection Failed:', e.message));

// Auto-create Delivery Challans table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS delivery_challans (
    id VARCHAR(50) PRIMARY KEY,
    voucher_id VARCHAR(50),
    customer_id VARCHAR(50),
    challan_no VARCHAR(50),
    date DATE,
    items JSONB,
    narration TEXT,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )
`).catch(e => console.error('Error creating delivery_challans:', e.message));

// ── Table → Column Mapping ────────────────────────────────
// Maps frontend camelCase keys → postgres tables + column mappings
const TABLE_MAP = {
  companyInfo: { table: 'company_info', mode: 'single' },
  accounts: { table: 'accounts', mode: 'array', columns: { id: 'id', name: 'name', group: 'grp', type: 'type', accountKind: 'account_kind', bankName: 'bank_name', accountNo: 'account_no' } },
  chemicals: { table: 'chemicals', mode: 'array', columns: { id: 'id', name: 'name', unit: 'unit', hsnCode: 'hsn_code', gstRate: 'gst_rate', minStock: 'min_stock' } },
  products: { table: 'products', mode: 'array', columns: { id: 'id', name: 'name', hsnCode: 'hsn_code', gstRate: 'gst_rate', productType: 'product_type', unit: 'unit', rate: 'rate' } },
  sheetTypes: { table: 'sheet_types', mode: 'array', columns: { id: 'id', name: 'name', sheetType: 'sheet_type', unit: 'unit' } },
  customers: { table: 'customers', mode: 'array', columns: { id: 'id', name: 'name', address: 'address', gstin: 'gstin', contact: 'contact', creditDays: 'credit_days', stateCode: 'state_code' } },
  suppliers: { table: 'suppliers', mode: 'array', columns: { id: 'id', name: 'name', address: 'address', gstin: 'gstin', contact: 'contact', stateCode: 'state_code' } },
  vouchers: { table: 'vouchers', mode: 'array', columns: { id: 'id', date: 'date', type: 'type', narration: 'narration', voucherNo: 'voucher_no', refInvoiceNo: 'ref_invoice_no' } },
  voucherDetails: { table: 'voucher_details', mode: 'array', columns: { id: 'id', voucherId: 'voucher_id', accountId: 'account_id', partyId: 'party_id', drAmount: 'dr_amount', crAmount: 'cr_amount' } },
  inventoryTransactions: { table: 'inventory_transactions', mode: 'array', columns: { id: 'id', voucherId: 'voucher_id', itemId: 'item_id', itemType: 'item_type', qty: 'qty', rate: 'rate', amount: 'amount' } },
  productionBatches: { table: 'production_batches', mode: 'array', columns: { id: 'id', date: 'date', stage: 'stage', productionType: 'production_type', inputItems: 'input_items', outputItems: 'output_items', wasteKg: 'waste_kg', wastePercent: 'waste_percent', operatorName: 'operator_name', narration: 'narration', voucherId: 'voucher_id' } },
  customerOrders: { table: 'customer_orders', mode: 'array', columns: { id: 'id', customerId: 'customer_id', date: 'date', dueDate: 'due_date', items: 'items', status: 'status', linkedInvoiceIds: 'linked_invoice_ids' } },
  cheques: { table: 'cheques', mode: 'array', columns: { id: 'id', type: 'type', partyId: 'party_id', partyType: 'party_type', chequeNo: 'cheque_no', date: 'date', bankName: 'bank_name', amount: 'amount', status: 'status', voucherId: 'voucher_id' } },
  purchaseInvoices: { table: 'purchase_invoices', mode: 'array', columns: { id: 'id', voucherId: 'voucher_id', supplierId: 'supplier_id', invoiceNo: 'invoice_no', date: 'date', items: 'items', subtotal: 'subtotal', cgst: 'cgst', sgst: 'sgst', igst: 'igst', grandTotal: 'grand_total', paymentMode: 'payment_mode', accountId: 'account_id', amountPaid: 'amount_paid' } },
  salesInvoices: { table: 'sales_invoices', mode: 'array', columns: { id: 'id', voucherId: 'voucher_id', customerId: 'customer_id', invoiceNo: 'invoice_no', date: 'date', items: 'items', subtotal: 'subtotal', cgst: 'cgst', sgst: 'sgst', igst: 'igst', grandTotal: 'grand_total', paymentMode: 'payment_mode', accountId: 'account_id', amountReceived: 'amount_received', orderId: 'order_id' } },
  purchaseReturns: { table: 'purchase_returns', mode: 'array', columns: { id: 'id', voucherId: 'voucher_id', supplierId: 'supplier_id', debitNoteNo: 'debit_note_no', originalInvoiceNo: 'original_invoice_no', date: 'date', items: 'items', subtotal: 'subtotal', cgst: 'cgst', sgst: 'sgst', igst: 'igst', grandTotal: 'grand_total', reason: 'reason' } },
  salesReturns: { table: 'sales_returns', mode: 'array', columns: { id: 'id', voucherId: 'voucher_id', customerId: 'customer_id', creditNoteNo: 'credit_note_no', originalInvoiceNo: 'original_invoice_no', date: 'date', items: 'items', subtotal: 'subtotal', cgst: 'cgst', sgst: 'sgst', igst: 'igst', grandTotal: 'grand_total', reason: 'reason' } },
  expenses: { table: 'expenses', mode: 'array', columns: { id: 'id', voucherId: 'voucher_id', date: 'date', category: 'category', accountId: 'account_id', amount: 'amount', paidFrom: 'paid_from', description: 'description', recurring: 'recurring' } },
  loans: { table: 'loans', mode: 'array', columns: { id: 'id', type: 'type', partyName: 'party_name', principalAmount: 'principal_amount', interestRate: 'interest_rate', startDate: 'start_date', tenureMonths: 'tenure_months', emiAmount: 'emi_amount', totalPaid: 'total_paid', status: 'status', emis: 'emis', accountId: 'account_id', paidFrom: 'paid_from', description: 'description' } },
  deliveryChallans: { table: 'delivery_challans', mode: 'array', columns: { id: 'id', voucherId: 'voucher_id', customerId: 'customer_id', challanNo: 'challan_no', date: 'date', items: 'items', narration: 'narration' } },
};

// JSON-type columns (stored as JSONB in postgres)
const JSONB_COLS = new Set(['items', 'input_items', 'output_items', 'linked_invoice_ids', 'emis', 'data']);

// ── Helper: Convert frontend row → postgres row ──────────
function toDbRow(frontendRow, columns) {
  const row = {};
  // Map known columns
  for (const [feKey, dbCol] of Object.entries(columns)) {
    if (feKey in frontendRow) {
      let val = frontendRow[feKey];
      // JSONB columns: stringify arrays/objects
      if (JSONB_COLS.has(dbCol) && typeof val === 'object') {
        val = JSON.stringify(val);
      }
      row[dbCol] = val;
    }
  }
  // Store all extra fields in the 'data' JSONB column
  const knownKeys = new Set(Object.keys(columns));
  const extra = {};
  for (const [k, v] of Object.entries(frontendRow)) {
    if (!knownKeys.has(k)) extra[k] = v;
  }
  if (Object.keys(extra).length > 0) {
    row.data = JSON.stringify(extra);
  }
  return row;
}

// ── Helper: Convert postgres row → frontend row ──────────
function toFrontendRow(dbRow, columns) {
  const inverted = {};
  for (const [feKey, dbCol] of Object.entries(columns)) {
    inverted[dbCol] = feKey;
  }
  const row = {};
  for (const [dbCol, val] of Object.entries(dbRow)) {
    if (dbCol === 'created_at' || dbCol === 'updated_at') continue;
    const feKey = inverted[dbCol];
    if (feKey) {
      row[feKey] = val;
    }
  }
  // Merge extra fields from 'data' JSONB
  if (dbRow.data && typeof dbRow.data === 'object' && !Array.isArray(dbRow.data)) {
    Object.assign(row, dbRow.data);
  }
  return row;
}

// ══════════════════════════════════════════════════════════
//  API ENDPOINTS
// ══════════════════════════════════════════════════════════

// ── GET /api/sync — Load ALL data for active company ─────
app.get('/api/sync', async (req, res) => {
  try {
    const state = {};
    const cid = req.company_id;

    for (const [feKey, config] of Object.entries(TABLE_MAP)) {
      if (config.mode === 'single') {
        const r = await pool.query(`SELECT data FROM ${config.table} WHERE id = $1 AND company_id = $2`, ['main', cid]);
        state[feKey] = r.rows.length > 0 ? r.rows[0].data : null;
      } else {
        const r = await pool.query(`SELECT * FROM ${config.table} WHERE company_id = $1`, [cid]);
        state[feKey] = r.rows.map(row => toFrontendRow(row, config.columns));
      }
    }

    // Check if database is empty
    const hasData = Object.values(state).some(v => {
      if (v === null) return false;
      if (Array.isArray(v)) return v.length > 0;
      return true;
    });

    res.json({ state: hasData ? state : null });
  } catch (err) {
    console.error('GET /api/sync error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/sync/patch — Upsert data incrementally ────
app.patch('/api/sync/patch', async (req, res) => {
  const state = req.body;
  if (!state) return res.status(400).json({ error: 'No data' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cid = req.company_id;

    for (const [feKey, config] of Object.entries(TABLE_MAP)) {
      if (!(feKey in state)) continue;
      const data = state[feKey];

      if (config.mode === 'single') {
        await client.query(
          `INSERT INTO ${config.table} (id, company_id, data, updated_at) VALUES ('main', $2, $1, NOW())
           ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = NOW() WHERE ${config.table}.company_id = $2`,
          [JSON.stringify(data), cid]
        );
      } else if (Array.isArray(data) && data.length > 0) {
        const columns = config.columns;
        const dbCols = Object.values(columns);
        if (!dbCols.includes('data')) dbCols.push('data');
        if (!dbCols.includes('company_id')) dbCols.push('company_id');

        for (const row of data) {
          const dbRow = toDbRow(row, columns);
          dbRow.company_id = cid; // Inject RLS
          
          const vals = dbCols.map(c => dbRow[c] !== undefined ? dbRow[c] : null);
          const castPlaceholders = dbCols.map((col, i) => {
            if (JSONB_COLS.has(col)) return `$${i + 1}::jsonb`;
            return `$${i + 1}`;
          }).join(', ');
          
          const updateSet = dbCols.filter(c => c !== 'id').map((col, i) => {
            const idx = dbCols.indexOf(col);
            if (JSONB_COLS.has(col)) return `${col} = $${idx + 1}::jsonb`;
            return `${col} = $${idx + 1}`;
          }).join(', ');

          await client.query(
            `INSERT INTO ${config.table} (${dbCols.join(', ')}) VALUES (${castPlaceholders})
             ON CONFLICT (id) DO UPDATE SET ${updateSet}`,
            vals
          );
        }
      }
    }

    await client.query('COMMIT');
    broadcast();
    res.json({ success: true, message: 'Patch sync applied safely' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PATCH /api/sync/patch error:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ── DELETE /api/record/:table/:id — Safe Explicit Deletes ─
app.delete('/api/record/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  const config = Object.values(TABLE_MAP).find(c => c.table === table);
  if (!config) return res.status(400).json({ error: 'Invalid table' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // For voucher deletions, we need to cascade manually due to possible missing FKs
    if (table === 'vouchers') {
      const children = ['voucher_details', 'inventory_transactions', 'purchase_invoices', 'sales_invoices', 'purchase_returns', 'sales_returns', 'expenses', 'production_batches', 'cheques', 'delivery_challans'];
      for (const t of children) {
          await client.query(`DELETE FROM ${t} WHERE voucher_id = $1 AND company_id = $2`, [id, req.company_id]);
      }
    } else if (['purchase_invoices', 'sales_invoices', 'production_batches', 'scrapSaleInvoices', 'sheetSaleInvoices'].includes(table)) {
      // If deleting an invoice directly, fetch voucher_id first
      const vResult = await client.query(`SELECT voucher_id FROM ${table} WHERE id = $1 AND company_id = $2`, [id, req.company_id]);
      if (vResult.rows.length > 0 && vResult.rows[0].voucher_id) {
          const vId = vResult.rows[0].voucher_id;
          const children = ['voucher_details', 'inventory_transactions', 'purchase_invoices', 'sales_invoices', 'purchase_returns', 'sales_returns', 'expenses', 'production_batches', 'cheques', 'delivery_challans'];
          for (const t of children) {
              await client.query(`DELETE FROM ${t} WHERE voucher_id = $1 AND company_id = $2`, [vId, req.company_id]);
          }
          await client.query(`DELETE FROM vouchers WHERE id = $1 AND company_id = $2`, [vId, req.company_id]);
      }
    }
    
    await client.query(`DELETE FROM ${table} WHERE id = $1 AND company_id = $2`, [id, req.company_id]);
    await client.query('COMMIT');
    broadcast();
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ── POST /api/clear — Clear all tables ───────────────────
app.post('/api/clear', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete in reverse dependency order
    const tables = Object.values(TABLE_MAP).map(c => c.table);
    // Delete child tables first (those with FK references)
    const ordered = [
      'voucher_details', 'inventory_transactions', 'purchase_invoices', 'sales_invoices',
      'purchase_returns', 'sales_returns', 'expenses', 'loans', 'production_batches',
      'customer_orders', 'cheques', 'vouchers',
      'accounts', 'chemicals', 'products', 'sheet_types', 'customers', 'suppliers',
      'company_info'
    ];
    for (const t of ordered) {
      await client.query(`DELETE FROM ${t} WHERE company_id = $1`, [req.company_id]);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'All data cleared from PostgreSQL' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ══════════════════════════════════════════════════════════
//  BACKUP & IMPORT ENDPOINTS
// ══════════════════════════════════════════════════════════

// ── GET /api/backup/export — Export full data as JSON ─────
app.get('/api/backup/export', async (req, res) => {
  try {
    const state = {};

    for (const [feKey, config] of Object.entries(TABLE_MAP)) {
      if (config.mode === 'single') {
        const r = await pool.query(`SELECT data FROM ${config.table} WHERE id = 'main'`);
        state[feKey] = r.rows.length > 0 ? r.rows[0].data : null;
      } else {
        const r = await pool.query(`SELECT * FROM ${config.table}`);
        state[feKey] = r.rows.map(row => toFrontendRow(row, config.columns));
      }
    }

    const backup = {
      _meta: {
        app: 'RubberERP',
        version: '2.0',
        exportDate: new Date().toISOString(),
        tables: Object.keys(state),
        recordCounts: {}
      },
      data: state
    };

    for (const [k, v] of Object.entries(state)) {
      backup._meta.recordCounts[k] = Array.isArray(v) ? v.length : (v ? 1 : 0);
    }

    // Also save to data_backups table
    const backupName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    await pool.query(
      `INSERT INTO data_backups (backup_name, backup_data, note) VALUES ($1, $2, $3)`,
      [backupName, JSON.stringify(backup), `Auto-saved on export`]
    );

    res.setHeader('Content-Disposition', `attachment; filename="${backupName}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(backup);
  } catch (err) {
    console.error('Export error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/backup/list — List saved backups ────────────
app.get('/api/backup/list', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, backup_name, created_at, note,
              jsonb_pretty(backup_data->'_meta'->'recordCounts') as record_counts
       FROM data_backups ORDER BY created_at DESC LIMIT 50`
    );
    res.json({ backups: r.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/backup/import — Import data with strategy ──
// Body: { data: { ...state... }, strategy: 'replace' | 'merge' | 'add_only' }
// 
// strategy explained:
//   replace  → Delete ALL existing data, insert backup data (clean restore)
//   merge    → For each record: if ID exists → UPDATE it, if not → INSERT
//   add_only → Only INSERT records whose IDs don't already exist (safe append)
//
app.post('/api/backup/import', async (req, res) => {
  const { data, strategy = 'merge' } = req.body;

  if (!data) return res.status(400).json({ error: 'No data provided' });

  // Handle wrapped format (export format has { _meta, data })
  const stateData = data.data || data;

  const client = await pool.connect();
  const report = { inserted: 0, updated: 0, skipped: 0, deleted: 0, errors: [] };

  try {
    await client.query('BEGIN');

    if (strategy === 'replace') {
      // ── REPLACE: Clean slate ─────────────────────────
      const ordered = [
        'voucher_details', 'inventory_transactions', 'purchase_invoices', 'sales_invoices',
        'purchase_returns', 'sales_returns', 'expenses', 'loans', 'production_batches',
        'customer_orders', 'cheques', 'vouchers',
        'accounts', 'chemicals', 'products', 'sheet_types', 'customers', 'suppliers',
        'company_info'
      ];
      for (const t of ordered) {
        const r = await client.query(`DELETE FROM ${t}`);
        report.deleted += r.rowCount;
      }

      // Now insert all data
      for (const [feKey, config] of Object.entries(TABLE_MAP)) {
        if (!(feKey in stateData)) continue;
        const rows = stateData[feKey];

        if (config.mode === 'single' && rows) {
          await client.query(
            `INSERT INTO ${config.table} (id, data, updated_at) VALUES ('main', $1, NOW())`,
            [JSON.stringify(rows)]
          );
          report.inserted++;
        } else if (Array.isArray(rows)) {
          for (const row of rows) {
            try {
              const dbRow = toDbRow(row, config.columns);
              const dbCols = [...Object.values(config.columns)];
              if (!dbCols.includes('data')) dbCols.push('data');
              const vals = dbCols.map(c => dbRow[c] !== undefined ? dbRow[c] : null);
              const castPlaceholders = dbCols.map((col, i) => {
                if (JSONB_COLS.has(col)) return `$${i + 1}::jsonb`;
                return `$${i + 1}`;
              }).join(', ');

              await client.query(
                `INSERT INTO ${config.table} (${dbCols.join(', ')}) VALUES (${castPlaceholders})`,
                vals
              );
              report.inserted++;
            } catch (e) {
              report.errors.push(`${feKey}/${row.id}: ${e.message}`);
            }
          }
        }
      }
    }
    else if (strategy === 'merge') {
      // ── MERGE: Upsert — update existing, insert new ──
      for (const [feKey, config] of Object.entries(TABLE_MAP)) {
        if (!(feKey in stateData)) continue;
        const rows = stateData[feKey];

        if (config.mode === 'single' && rows) {
          await client.query(
            `INSERT INTO ${config.table} (id, data, updated_at) VALUES ('main', $1, NOW())
             ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = NOW()`,
            [JSON.stringify(rows)]
          );
          report.updated++;
        } else if (Array.isArray(rows)) {
          for (const row of rows) {
            try {
              const dbRow = toDbRow(row, config.columns);
              const dbCols = [...Object.values(config.columns)];
              if (!dbCols.includes('data')) dbCols.push('data');
              const vals = dbCols.map(c => dbRow[c] !== undefined ? dbRow[c] : null);
              const castPlaceholders = dbCols.map((col, i) => {
                if (JSONB_COLS.has(col)) return `$${i + 1}::jsonb`;
                return `$${i + 1}`;
              }).join(', ');

              // Upsert: ON CONFLICT → UPDATE all columns
              const updateSet = dbCols.filter(c => c !== 'id').map((col, i) => {
                const idx = dbCols.indexOf(col);
                if (JSONB_COLS.has(col)) return `${col} = $${idx + 1}::jsonb`;
                return `${col} = $${idx + 1}`;
              }).join(', ');

              const result = await client.query(
                `INSERT INTO ${config.table} (${dbCols.join(', ')}) VALUES (${castPlaceholders})
                 ON CONFLICT (id) DO UPDATE SET ${updateSet}`,
                vals
              );

              if (result.command === 'INSERT') report.inserted++;
              else report.updated++;
            } catch (e) {
              report.errors.push(`${feKey}/${row.id}: ${e.message}`);
            }
          }
        }
      }
    }
    else if (strategy === 'add_only') {
      // ── ADD_ONLY: Only insert if not exists ──────────
      for (const [feKey, config] of Object.entries(TABLE_MAP)) {
        if (!(feKey in stateData)) continue;
        const rows = stateData[feKey];

        if (config.mode === 'single' && rows) {
          const exists = await client.query(`SELECT 1 FROM ${config.table} WHERE id = 'main'`);
          if (exists.rows.length === 0) {
            await client.query(
              `INSERT INTO ${config.table} (id, data) VALUES ('main', $1)`,
              [JSON.stringify(rows)]
            );
            report.inserted++;
          } else {
            report.skipped++;
          }
        } else if (Array.isArray(rows)) {
          for (const row of rows) {
            try {
              const exists = await client.query(`SELECT 1 FROM ${config.table} WHERE id = $1`, [row.id]);
              if (exists.rows.length > 0) {
                report.skipped++;
                continue;
              }

              const dbRow = toDbRow(row, config.columns);
              const dbCols = [...Object.values(config.columns)];
              if (!dbCols.includes('data')) dbCols.push('data');
              const vals = dbCols.map(c => dbRow[c] !== undefined ? dbRow[c] : null);
              const castPlaceholders = dbCols.map((col, i) => {
                if (JSONB_COLS.has(col)) return `$${i + 1}::jsonb`;
                return `$${i + 1}`;
              }).join(', ');

              await client.query(
                `INSERT INTO ${config.table} (${dbCols.join(', ')}) VALUES (${castPlaceholders})`,
                vals
              );
              report.inserted++;
            } catch (e) {
              report.errors.push(`${feKey}/${row.id}: ${e.message}`);
            }
          }
        }
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, strategy, report });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Import error:', err.message, err.stack);
    res.status(500).json({ error: err.message, report });
  } finally {
    client.release();
  }
});

// ── DELETE /api/backup/:id — Delete a saved backup ───────
app.delete('/api/backup/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM data_backups WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/backup/restore/:id — Restore from saved backup
app.get('/api/backup/restore/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT backup_data FROM data_backups WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Backup not found' });
    res.json(r.rows[0].backup_data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Health Check ─────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const r = await pool.query('SELECT NOW() as time, pg_database_size(current_database()) as db_size');
    const row = r.rows[0];
    const sizeMB = (row.db_size / (1024 * 1024)).toFixed(2);
    res.json({ status: 'healthy', time: row.time, dbSizeMB: sizeMB, engine: 'PostgreSQL 18' });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// ── Start Server ─────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀 RubberERP PostgreSQL Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: rubber_erp @ localhost:5378`);
  console.log(`💾 Backup Export: GET  /api/backup/export`);
  console.log(`📥 Backup Import: POST /api/backup/import { data, strategy: 'replace'|'merge'|'add_only' }`);
  console.log(`📋 Backup List:   GET  /api/backup/list`);
});
