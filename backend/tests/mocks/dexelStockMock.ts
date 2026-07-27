export interface DexelProduct {
  dexel_id: string;
  sku: string;
  name: string;
  price: number;
  stock_qty: number;
  category: string;
  is_active: boolean;
}

export interface DexelInventoryCheckRequest {
  tenant_id: string;
  branch_id: string;
  items: { dexel_id: string; quantity: number }[];
}

export interface DexelInventoryCheckResult {
  valid: boolean;
  unavailable_items: Array<{ dexel_id: string; requested: number; available: number }>;
}

export interface DexelPosTransactionPayload {
  tenant_id: string;
  branch_id: string;
  order_id: string;
  bill_id: string;
  total_amount: number;
  payment_method: 'CASH' | 'CARD' | 'DEXEL_PAY';
  items: Array<{ dexel_id?: string; name: string; quantity: number; unit_price: number }>;
}

export interface DexelPosTransactionResponse {
  success: boolean;
  dexel_transaction_id: string;
  invoice_number: string;
  tax_amount: number;
  timestamp: string;
}

export class DexelStockServiceMock {
  private catalog: Map<string, DexelProduct> = new Map();
  private transactionHistory: DexelPosTransactionPayload[] = [];
  public shouldSimulateFailure: boolean = false;

  constructor() {
    // Seed initial Dexel catalog
    this.seedCatalog([
      { dexel_id: 'MENU-A001', sku: 'SKU-APP-01', name: 'Truffle Garlic Bread', price: 12.50, stock_qty: 50, category: 'Starters', is_active: true },
      { dexel_id: 'MENU-M001', sku: 'SKU-MAIN-01', name: 'Wagyu Beef Burger', price: 24.00, stock_qty: 15, category: 'Mains', is_active: true },
      { dexel_id: 'MENU-OUT-01', sku: 'SKU-OUT-01', name: 'Out of Stock Special', price: 30.00, stock_qty: 0, category: 'Specials', is_active: true },
    ]);
  }

  public seedCatalog(products: DexelProduct[]): void {
    for (const p of products) {
      this.catalog.set(p.dexel_id, p);
    }
  }

  public async fetchCatalog(tenantId: string): Promise<DexelProduct[]> {
    if (this.shouldSimulateFailure) {
      throw new Error('Dexel Stock API Service Unavailable (503)');
    }
    return Array.from(this.catalog.values()).filter(p => p.is_active);
  }

  public async checkInventory(req: DexelInventoryCheckRequest): Promise<DexelInventoryCheckResult> {
    if (this.shouldSimulateFailure) {
      throw new Error('Dexel Stock Connection Timeout');
    }

    const unavailable_items: Array<{ dexel_id: string; requested: number; available: number }> = [];

    for (const item of req.items) {
      const product = this.catalog.get(item.dexel_id);
      if (!product || product.stock_qty < item.quantity) {
        unavailable_items.push({
          dexel_id: item.dexel_id,
          requested: item.quantity,
          available: product ? product.stock_qty : 0,
        });
      }
    }

    return {
      valid: unavailable_items.length === 0,
      unavailable_items,
    };
  }

  public async offloadPosTransaction(payload: DexelPosTransactionPayload): Promise<DexelPosTransactionResponse> {
    if (this.shouldSimulateFailure) {
      throw new Error('Dexel POS Offload Failed: Gateway Error');
    }

    this.transactionHistory.push(payload);

    // Deduct stock levels in mock
    for (const item of payload.items) {
      if (item.dexel_id && this.catalog.has(item.dexel_id)) {
        const prod = this.catalog.get(item.dexel_id)!;
        prod.stock_qty = Math.max(0, prod.stock_qty - item.quantity);
      }
    }

    const taxAmount = Number((payload.total_amount * 0.15).toFixed(2));
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);

    return {
      success: true,
      dexel_transaction_id: `DEX-TXN-${Date.now()}-${randomSuffix}`,
      invoice_number: `INV-2026-${randomSuffix}`,
      tax_amount: taxAmount,
      timestamp: new Date().toISOString(),
    };
  }

  public getTransactionHistory(): DexelPosTransactionPayload[] {
    return this.transactionHistory;
  }

  public clearHistory(): void {
    this.transactionHistory = [];
    this.shouldSimulateFailure = false;
  }
}

export const dexelStockMock = new DexelStockServiceMock();
