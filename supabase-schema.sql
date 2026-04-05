-- ============================================================
-- SUPABASE SCHEMA — RubberERP (Full Relational)
-- ============================================================
-- Mirrors IndexedDB structure EXACTLY — each db.data key = 1 table
-- Multi-tenant via company_id, Multi-owner via company_owners
-- 
-- ⚠️  Run this in Supabase SQL Editor (fresh install).
--     If upgrading, DROP old tables first.
-- ============================================================

-- ── CLEANUP ────────────────────────────────────────────────
DROP TABLE IF EXISTS public.company_owners CASCADE;
DROP TABLE IF EXISTS public.erp_company_info CASCADE;
DROP TABLE IF EXISTS public.erp_sequences CASCADE;
DROP TABLE IF EXISTS public.erp_chemicals CASCADE;
DROP TABLE IF EXISTS public.erp_products CASCADE;
DROP TABLE IF EXISTS public.erp_sheet_types CASCADE;
DROP TABLE IF EXISTS public.erp_customers CASCADE;
DROP TABLE IF EXISTS public.erp_suppliers CASCADE;
DROP TABLE IF EXISTS public.erp_accounts CASCADE;
DROP TABLE IF EXISTS public.erp_account_groups CASCADE;
DROP TABLE IF EXISTS public.erp_vouchers CASCADE;
DROP TABLE IF EXISTS public.erp_voucher_details CASCADE;
DROP TABLE IF EXISTS public.erp_inventory_transactions CASCADE;
DROP TABLE IF EXISTS public.erp_production_batches CASCADE;
DROP TABLE IF EXISTS public.erp_customer_orders CASCADE;
DROP TABLE IF EXISTS public.erp_cheques CASCADE;
DROP TABLE IF EXISTS public.erp_purchase_invoices CASCADE;
DROP TABLE IF EXISTS public.erp_sales_invoices CASCADE;
DROP TABLE IF EXISTS public.erp_scrap_sale_invoices CASCADE;
DROP TABLE IF EXISTS public.erp_sheet_sale_invoices CASCADE;
DROP TABLE IF EXISTS public.erp_purchase_returns CASCADE;
DROP TABLE IF EXISTS public.erp_sales_returns CASCADE;
DROP TABLE IF EXISTS public.erp_delivery_challans CASCADE;
DROP TABLE IF EXISTS public.erp_expenses CASCADE;
DROP TABLE IF EXISTS public.erp_loans CASCADE;
DROP TABLE IF EXISTS public.erp_company_users CASCADE;
DROP TABLE IF EXISTS public.company_data CASCADE;
DROP TABLE IF EXISTS public.system_companies CASCADE;
DROP TABLE IF EXISTS public.system_users CASCADE;

-- ═══════════════════════════════════════════════════════════
-- SYSTEM TABLES
-- ═══════════════════════════════════════════════════════════

-- Master login (software-level credentials)
CREATE TABLE public.system_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company registry
CREATE TABLE public.system_companies (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multi-owner junction (many users can own one company)
CREATE TABLE public.company_owners (
  company_id VARCHAR(50) REFERENCES public.system_companies(id) ON DELETE CASCADE,
  username VARCHAR(100) REFERENCES public.system_users(username) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'OWNER',
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (company_id, username)
);

-- ═══════════════════════════════════════════════════════════
-- ERP DATA TABLES (Mirror of IndexedDB db.data)
-- Each key in db.data = one table here
-- ═══════════════════════════════════════════════════════════

-- ── Single-object tables (1 row per company) ───────────────

CREATE TABLE public.erp_company_info (
  company_id VARCHAR(50) PRIMARY KEY REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.erp_sequences (
  company_id VARCHAR(50) PRIMARY KEY REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Array tables (many rows per company) ───────────────────
-- Each record stored as JSONB, with id extracted for PK

CREATE TABLE public.erp_chemicals (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_products (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_sheet_types (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_customers (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_suppliers (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_accounts (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_account_groups (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_vouchers (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_voucher_details (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_inventory_transactions (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_production_batches (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_customer_orders (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_cheques (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_purchase_invoices (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_sales_invoices (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_scrap_sale_invoices (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_sheet_sale_invoices (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_purchase_returns (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_sales_returns (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_delivery_challans (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_expenses (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_loans (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

CREATE TABLE public.erp_company_users (
  id VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) NOT NULL REFERENCES public.system_companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, company_id)
);

-- ═══════════════════════════════════════════════════════════
-- INDEXES (for fast company_id lookups)
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_chemicals_cid ON public.erp_chemicals(company_id);
CREATE INDEX IF NOT EXISTS idx_products_cid ON public.erp_products(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_cid ON public.erp_customers(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_cid ON public.erp_suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_cid ON public.erp_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_cid ON public.erp_vouchers(company_id);
CREATE INDEX IF NOT EXISTS idx_voucher_details_cid ON public.erp_voucher_details(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_cid ON public.erp_inventory_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_production_cid ON public.erp_production_batches(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_cid ON public.erp_customer_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_inv_cid ON public.erp_purchase_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_inv_cid ON public.erp_sales_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_cid ON public.erp_expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_loans_cid ON public.erp_loans(company_id);
CREATE INDEX IF NOT EXISTS idx_comp_users_cid ON public.erp_company_users(company_id);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'system_users', 'system_companies', 'company_owners',
    'erp_company_info', 'erp_sequences',
    'erp_chemicals', 'erp_products', 'erp_sheet_types',
    'erp_customers', 'erp_suppliers', 'erp_accounts', 'erp_account_groups',
    'erp_vouchers', 'erp_voucher_details', 'erp_inventory_transactions',
    'erp_production_batches', 'erp_customer_orders', 'erp_cheques',
    'erp_purchase_invoices', 'erp_sales_invoices',
    'erp_scrap_sale_invoices', 'erp_sheet_sale_invoices',
    'erp_purchase_returns', 'erp_sales_returns', 'erp_delivery_challans',
    'erp_expenses', 'erp_loans', 'erp_company_users'
  ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "anon_full_%s" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "anon_full_%s" ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl, tbl);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.system_users (username, password, display_name)
VALUES ('admin', 'admin123', 'Administrator');

INSERT INTO public.system_companies (id, name)
VALUES ('DEMO_COMP', 'Demo Company');

INSERT INTO public.company_owners (company_id, username, role)
VALUES ('DEMO_COMP', 'admin', 'OWNER');

-- ═══════════════════════════════════════════════════════════
-- VERIFY
-- ═══════════════════════════════════════════════════════════

SELECT 'system_users' AS tbl, COUNT(*) AS rows FROM public.system_users
UNION ALL SELECT 'system_companies', COUNT(*) FROM public.system_companies
UNION ALL SELECT 'company_owners', COUNT(*) FROM public.company_owners;

-- ============================================================
-- 🎉 DONE! 28 tables created.
-- Default login: admin / admin123
-- ============================================================
