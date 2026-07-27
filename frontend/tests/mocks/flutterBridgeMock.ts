export interface FlutterUserContext {
  userId: string;
  userName: string;
  userEmail: string;
  tenantId: string;
  branchId: string;
  authToken: string;
}

export interface QRPayload {
  tenant_id: string;
  branch_id: string;
  restaurant_id: string;
  table_id?: string;
  timestamp: number;
}

export class FlutterBridgeMock {
  private userContext: FlutterUserContext | null = null;
  private isConnected: boolean = true;
  private networkListeners: ((online: boolean) => void)[] = [];

  constructor() {
    this.userContext = {
      userId: 'user_flutter_guest_123',
      userName: 'Alice MiniApp User',
      userEmail: 'alice@flutter.guest',
      tenantId: 'tenant_alpha',
      branchId: 'branch_alpha_1',
      authToken: 'mock-jwt-token-flutter-bridge',
    };
  }

  public getUserContext(): FlutterUserContext {
    if (!this.userContext) {
      throw new Error('Host App Bridge error: Guest user identity not passed');
    }
    return this.userContext;
  }

  public setUserContext(ctx: FlutterUserContext | null): void {
    this.userContext = ctx;
  }

  public parseQRPayload(rawUrlOrString: string): QRPayload {
    try {
      const url = new URL(rawUrlOrString);
      const tenant_id = url.searchParams.get('tenant_id');
      const branch_id = url.searchParams.get('branch_id');
      const restaurant_id = url.searchParams.get('restaurant_id');
      const table_id = url.searchParams.get('table_id') || undefined;

      if (!tenant_id || !branch_id || !restaurant_id) {
        throw new Error('Invalid QR Code Payload: Missing mandatory route parameter(s)');
      }

      return {
        tenant_id,
        branch_id,
        restaurant_id,
        table_id,
        timestamp: Date.now(),
      };
    } catch (e: any) {
      throw new Error(`QR Parsing Failure: ${e.message}`);
    }
  }

  public getNetworkStatus(): { isConnected: boolean } {
    return { isConnected: this.isConnected };
  }

  public setNetworkStatus(online: boolean): void {
    this.isConnected = online;
    for (const listener of this.networkListeners) {
      listener(online);
    }
  }

  public onNetworkStatusChange(listener: (online: boolean) => void): () => void {
    this.networkListeners.push(listener);
    return () => {
      this.networkListeners = this.networkListeners.filter(l => l !== listener);
    };
  }

  public injectIntoWindow(): void {
    if (typeof window !== 'undefined') {
      (window as any).FlutterBridge = this;
    }
  }
}

export const flutterBridgeMock = new FlutterBridgeMock();
