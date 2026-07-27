import { flutterBridgeMock } from '../mocks/flutterBridgeMock';

describe('Mini-App SDK & Host App Bridge Tests', () => {
  beforeEach(() => {
    flutterBridgeMock.setUserContext({
      userId: 'usr_flutter_guest_123',
      userName: 'Alice MiniApp User',
      userEmail: 'alice@flutter.guest',
      tenantId: 'tenant_alpha',
      branchId: 'branch_alpha_1',
      authToken: 'mock-jwt-token-flutter-bridge',
    });
    flutterBridgeMock.setNetworkStatus(true);
  });

  describe('1. Auth & Tenant Context Exchange', () => {
    test('should retrieve user identity and tenant context from host Flutter app', () => {
      const ctx = flutterBridgeMock.getUserContext();

      expect(ctx.userId).toBe('usr_flutter_guest_123');
      expect(ctx.tenantId).toBe('tenant_alpha');
      expect(ctx.branchId).toBe('branch_alpha_1');
      expect(ctx.authToken).toBe('mock-jwt-token-flutter-bridge');
    });

    test('should throw an error when guest auth context is missing (Negative Test)', () => {
      flutterBridgeMock.setUserContext(null);

      expect(() => flutterBridgeMock.getUserContext()).toThrow(
        'Host App Bridge error: Guest user identity not passed'
      );
    });
  });

  describe('2. QR Scanner Payload Extraction & Route Injection', () => {
    test('should parse valid QR payload parameters into mini-app routing system', () => {
      const qrUrl = 'https://hospitalityhub.app/menu?tenant_id=tenant_alpha&branch_id=branch_a_01&restaurant_id=rest_01&table_id=tbl_10';

      const payload = flutterBridgeMock.parseQRPayload(qrUrl);

      expect(payload.tenant_id).toBe('tenant_alpha');
      expect(payload.branch_id).toBe('branch_a_01');
      expect(payload.restaurant_id).toBe('rest_01');
      expect(payload.table_id).toBe('tbl_10');
      expect(payload.timestamp).toBeGreaterThan(0);
    });

    test('should support QR payload without table_id for takeaway/delivery pre-orders', () => {
      const qrUrl = 'https://hospitalityhub.app/menu?tenant_id=tenant_alpha&branch_id=branch_a_01&restaurant_id=rest_01';

      const payload = flutterBridgeMock.parseQRPayload(qrUrl);

      expect(payload.tenant_id).toBe('tenant_alpha');
      expect(payload.table_id).toBeUndefined();
    });

    test('should throw an error when mandatory parameter is missing from QR payload (Negative Test)', () => {
      const malformedUrl = 'https://hospitalityhub.app/menu?tenant_id=tenant_alpha'; // Missing branch_id and restaurant_id

      expect(() => flutterBridgeMock.parseQRPayload(malformedUrl)).toThrow(
        'Missing mandatory route parameter(s)'
      );
    });

    test('should throw error when QR code string is invalid URL (Negative Test)', () => {
      const invalidQr = 'not-a-valid-url-string';

      expect(() => flutterBridgeMock.parseQRPayload(invalidQr)).toThrow(
        'QR Parsing Failure'
      );
    });
  });

  describe('3. Network Status Simulator & Offline Edge Cases', () => {
    test('should detect online status and notify subscribers on network changes', () => {
      let currentStatus = flutterBridgeMock.getNetworkStatus().isConnected;
      expect(currentStatus).toBe(true);

      const statusChanges: boolean[] = [];
      const unsubscribe = flutterBridgeMock.onNetworkStatusChange((online) => {
        statusChanges.push(online);
      });

      // Simulate network disconnect
      flutterBridgeMock.setNetworkStatus(false);
      expect(flutterBridgeMock.getNetworkStatus().isConnected).toBe(false);

      // Simulate network reconnect
      flutterBridgeMock.setNetworkStatus(true);
      expect(flutterBridgeMock.getNetworkStatus().isConnected).toBe(true);

      expect(statusChanges).toEqual([false, true]);

      unsubscribe();
    });
  });
});
