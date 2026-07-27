import EventEmitter from 'events';

export interface KDSEvent {
  eventId: string;
  eventType: 'ORDER_PLACED' | 'STATUS_CHANGED' | 'TICKET_UPDATED';
  tenantId: string;
  branchId: string;
  orderId: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  timestamp: string;
}

export class KDSEventBroadcaster extends EventEmitter {
  public publishOrderEvent(event: KDSEvent): void {
    const channel = `kds:${event.tenantId}:${event.branchId}`;
    this.emit(channel, event);
    this.emit('global_kds_stream', event);
  }
}

describe('Kitchen Operations (KDS) & Real-Time Queue Event Tests', () => {
  let broadcaster: KDSEventBroadcaster;

  beforeEach(() => {
    broadcaster = new KDSEventBroadcaster();
  });

  afterEach(() => {
    broadcaster.removeAllListeners();
  });

  test('should broadcast real-time ORDER_PLACED event to branch kitchen queue', (done) => {
    const tenantId = 'tenant_alpha_id';
    const branchId = 'branch_a_01';
    const channel = `kds:${tenantId}:${branchId}`;

    broadcaster.on(channel, (event: KDSEvent) => {
      try {
        expect(event.eventType).toBe('ORDER_PLACED');
        expect(event.tenantId).toBe(tenantId);
        expect(event.branchId).toBe(branchId);
        expect(event.orderId).toBe('ord_kds_101');
        expect(event.status).toBe('PENDING');
        done();
      } catch (err) {
        done(err);
      }
    });

    broadcaster.publishOrderEvent({
      eventId: 'evt_1',
      eventType: 'ORDER_PLACED',
      tenantId,
      branchId,
      orderId: 'ord_kds_101',
      status: 'PENDING',
      timestamp: new Date().toISOString(),
    });
  });

  test('should broadcast STATUS_CHANGED event when order moves from PREPARING to READY', (done) => {
    const tenantId = 'tenant_alpha_id';
    const branchId = 'branch_a_01';
    const channel = `kds:${tenantId}:${branchId}`;

    broadcaster.on(channel, (event: KDSEvent) => {
      try {
        expect(event.eventType).toBe('STATUS_CHANGED');
        expect(event.status).toBe('READY');
        done();
      } catch (err) {
        done(err);
      }
    });

    broadcaster.publishOrderEvent({
      eventId: 'evt_2',
      eventType: 'STATUS_CHANGED',
      tenantId,
      branchId,
      orderId: 'ord_kds_101',
      status: 'READY',
      timestamp: new Date().toISOString(),
    });
  });

  test('should enforce multi-tenant isolation in KDS event streams (Negative Test)', (done) => {
    const tenantA = 'tenant_alpha_id';
    const tenantB = 'tenant_beta_id';
    const branchA = 'branch_a_01';

    let tenantBReceivedEvent = false;

    // Tenant B subscribes to tenant B channel
    broadcaster.on(`kds:${tenantB}:${branchA}`, () => {
      tenantBReceivedEvent = true;
    });

    // Publish event for Tenant A
    broadcaster.publishOrderEvent({
      eventId: 'evt_3',
      eventType: 'ORDER_PLACED',
      tenantId: tenantA,
      branchId: branchA,
      orderId: 'ord_secret_a',
      status: 'PENDING',
      timestamp: new Date().toISOString(),
    });

    setTimeout(() => {
      expect(tenantBReceivedEvent).toBe(false);
      done();
    }, 50);
  });
});
