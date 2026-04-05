import { Database, generateId } from '../../src/store/db.js';

// Setup Mock Environment
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ state: {} }),
    ok: true
  })
);

global.indexedDB = {
  open: jest.fn(() => ({
    onupgradeneeded: null,
    onsuccess: jest.fn(function() { this.result = {}; }),
    onerror: null,
  }))
};
global.IDB = { get: jest.fn(), set: jest.fn(() => Promise.resolve()) };

describe('Database and Inventory Manager', () => {
    let db;
    
    beforeEach(() => {
        db = new Database();
        db.data = {
            companyInfo: { stateCode: '27' },
            inventoryTransactions: [
                { id: 'tx-1', itemId: 'prod_A', itemType: 'product', qty: 50 },
                { id: 'tx-2', itemId: 'chem_B', itemType: 'chemical', qty: 100 }
            ],
            chemicals: [{ id: 'chem_B', name: 'Rubber Compound' }],
            products: [{ id: 'prod_A', name: 'Rubber Mat' }],
            sequences: { voucher: 1, salesInvoice: 1 }
        };
        db._dirtyKeys = new Set();
    });

    test('should pass validation when stock is completely sufficient', () => {
        const consumptions = [{ itemId: 'prod_A', itemType: 'product', qty: 10 }];
        expect(() => { 
            db._validateStock(consumptions); 
        }).not.toThrow();
    });

    test('should THROW ERROR when stock is completely insufficient causing negative inventory', () => {
        const consumptions = [{ itemId: 'prod_A', itemType: 'product', qty: 100 }];
        expect(() => { 
            db._validateStock(consumptions); 
        }).toThrow(/Insufficient stock for "Rubber Mat"/);
    });

    test('should correctly split intra-state GST (CGST/SGST)', () => {
        const items = [{ qty: 10, rate: 100, gstRate: 18 }];
        const isInterState = false;
        
        const { subtotal, cgst, sgst, igst, grandTotal } = db._calcGST(items, isInterState);
        
        expect(subtotal).toBe(1000);
        expect(cgst).toBe(90);  // 9%
        expect(sgst).toBe(90);  // 9%
        expect(igst).toBe(0);
        expect(grandTotal).toBe(1180);
    });

    test('should correctly apply exact float rounding for IGST (Inter-state)', () => {
        const items = [{ qty: 1, rate: 153.333333, gstRate: 18 }];
        const isInterState = true;
        
        let { subtotal, cgst, sgst, igst, grandTotal } = db._calcGST(items, isInterState);
        
        // Assert native behavior before UI rounding applies
        expect(subtotal).toBeCloseTo(153.333, 2);
        expect(igst).toBeCloseTo(27.60, 2);
        expect(cgst).toBe(0);
        expect(sgst).toBe(0);
    });
});
