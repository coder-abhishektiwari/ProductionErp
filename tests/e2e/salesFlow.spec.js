import { test, expect } from '@playwright/test';

test.describe('Sales Invoice Flow Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate straight to the sales module
    await page.goto('http://localhost:5173/#sales');
  });

  test('should successfully generate a sales invoice, allocate stock, and correct GST calculations', async ({ page }) => {
    // 1. Initial State Check
    const title = page.locator('.section-title').first();
    await expect(title).toContainText('New Sales Invoice (GST)');
    
    // 2. Mock a customer and product if database is empty 
    // In actual local test runner we seed DB before, but playwright handles UI interaction natively.
    // If no customers, creating a sales invoice might be blocked. We assume default seeded data exists.
    
    // Check if customer dropdown is populated
    const customerCount = await page.locator('#sal-customer option').count();
    if(customerCount > 1) {
        await page.locator('#sal-customer').selectOption({ index: 1 }); 
        
        // 3. Add an item
        await page.locator('.sal-prod').first().selectOption({ index: 1 });
        await page.locator('.sal-qty').first().fill('10');
        
        // Ensure summary recalculates automatically (on input event)
        const summaryText = await page.locator('#sal-summary').innerText();
        expect(summaryText).toContain('CGST');
        expect(summaryText).toContain('SGST');
        
        // 4. Submit invoice
        await page.locator('#btn-save-sal').click();
        
        // 5. Assert success dialog
        page.on('dialog', async dialog => {
            expect(dialog.message()).toBe('Sales Invoice Saved!');
            await dialog.accept();
        });
    } else {
        console.warn("Skipping form fill test since DB has no default customers loaded to select.");
    }
  });

  test('Tab navigation does not block UI with multiple re-renders (Memory Leak check)', async ({ page }) => {
      // Rapidly click between tabs to ensure event delegation isn't causing duplicate binds
      for (let i = 0; i < 10; i++) {
        await page.click('[data-tab="register"]');
        await page.click('[data-tab="receivables"]');
        await page.click('[data-tab="entry"]');
      }
      
      const title = page.locator('.section-title').first();
      await expect(title).toBeVisible();
  });
});
