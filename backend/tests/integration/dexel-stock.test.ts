import { dexelStockMock, DexelInventoryCheckRequest, DexelPosTransactionPayload } from '../mocks/dexelStockMock';

describe('Dexel Stock Integration & POS Offload Tests', () => {
  beforeEach(() => {
    dexelStockMock.clearHistory();
  });

  describe('1. Product Catalog Sync & Pricing Matching', () => {
    test('should fetch and sync product catalog from Dexel Stock', async () => {
      const catalog = await dexelStockMock.fetchCatalog('tenant_alpha_id');

      expect(catalog.length).toBeGreaterThan(0);
      expect(catalog[0]).toHaveProperty('dexel_id');
      expect(catalog[0]).toHaveProperty('sku');
      expect(catalog[0]).toHaveProperty('price');
      expect(catalog[0]).toHaveProperty('stock_qty');
    });

    test('should fail gracefully when Dexel Stock API service is unavailable (Negative Test)', async () => {
      dexelStockMock.shouldSimulateFailure = true;

      await expect(dexelStockMock.fetchCatalog('tenant_alpha_id')).rejects.toThrow(
        'Dexel Stock API Service Unavailable (503)'
      );
    });
  });

  describe('2. Real-Time Inventory Validation Before Checkout', () => {
    test('should pass inventory check when all items are in stock', async () => {
      const req: DexelInventoryCheckRequest = {
        tenant_id: 'tenant_alpha_id',
        branch_id: 'branch_a_01',
        items: [
          { dexel_id: 'MENU-A001', quantity: 2 },
          { dexel_id: 'MENU-M001', quantity: 1 },
        ],
      };

      const result = await dexelStockMock.checkInventory(req);
      expect(result.valid).toBe(true);
      expect(result.unavailable_items.length).toBe(0);
    });

    test('should REJECT order before checkout when item is out-of-stock (Negative Test)', async () => {
      const req: DexelInventoryCheckRequest = {
        tenant_id: 'tenant_alpha_id',
        branch_id: 'branch_a_01',
        items: [
          { dexel_id: 'MENU-OUT-01', quantity: 1 }, // Stock qty = 0
        ],
      };

      const result = await dexelStockMock.checkInventory(req);
      expect(result.valid).toBe(false);
      expect(result.unavailable_items.length).toBe(1);
      expect(result.unavailable_items[0].dexel_id).toBe('MENU-OUT-01');
      expect(result.unavailable_items[0].requested).toBe(1);
      expect(result.unavailable_items[0].available).toBe(0);
    });

    test('should REJECT order when requested quantity exceeds available Dexel Stock (Negative Test)', async () => {
      const req: DexelInventoryCheckRequest = {
        tenant_id: 'tenant_alpha_id',
        branch_id: 'branch_a_01',
        items: [
          { dexel_id: 'MENU-M001', quantity: 999 }, // Available: 15
        ],
      };

      const result = await dexelStockMock.checkInventory(req);
      expect(result.valid).toBe(false);
      expect(result.unavailable_items[0].available).toBe(15);
    });
  });

  describe('3. POS Sales Offloading & Tax Processing', () => {
    test('should offload completed bill to Dexel Stock POS for invoice generation & tax calculation', async () => {
      const payload: DexelPosTransactionPayload = {
        tenant_id: 'tenant_alpha_id',
        branch_id: 'branch_a_01',
        order_id: 'ord_12345',
        bill_id: 'bill_67890',
        total_amount: 100.00,
        payment_method: 'DEXEL_PAY',
        items: [
          { dexel_id: 'MENU-A001', name: 'Truffle Garlic Bread', quantity: 2, unit_price: 12.50 },
          { dexel_id: 'MENU-M001', name: 'Wagyu Beef Burger', quantity: 3, unit_price: 24.00 },
        ],
      };

      const response = await dexelStockMock.offloadPosTransaction(payload);

      expect(response.success).toBe(true);
      expect(response.dexel_transaction_id).toMatch(/^DEX-TXN-/);
      expect(response.invoice_number).toMatch(/^INV-2026-/);
      expect(response.tax_amount).toBe(15.00); // 15% VAT on 100.00

      // Verify transaction was logged in mock history
      const history = dexelStockMock.getTransactionHistory();
      expect(history.length).toBe(1);
      expect(history[0].bill_id).toBe('bill_67890');
    });

    test('should handle POS gateway timeout or failure during offload (Negative Test)', async () => {
      dexelStockMock.shouldSimulateFailure = true;

      const payload: DexelPosTransactionPayload = {
        tenant_id: 'tenant_alpha_id',
        branch_id: 'branch_a_01',
        order_id: 'ord_fail',
        bill_id: 'bill_fail',
        total_amount: 50.00,
        payment_method: 'CASH',
        items: [],
      };

      await expect(dexelStockMock.offloadPosTransaction(payload)).rejects.toThrow(
        'Dexel POS Offload Failed: Gateway Error'
      );
    });
  });
});
