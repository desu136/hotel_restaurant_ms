export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export class OrderStateMachine {
  private static VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY', 'CANCELLED'],
    READY: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [], // Terminal state
    CANCELLED: [], // Terminal state
  };

  public static isValidTransition(currentStatus: OrderStatus, nextStatus: OrderStatus): boolean {
    const allowed = this.VALID_TRANSITIONS[currentStatus];
    return allowed ? allowed.includes(nextStatus) : false;
  }

  public static transition(currentStatus: OrderStatus, nextStatus: OrderStatus): OrderStatus {
    if (!this.isValidTransition(currentStatus, nextStatus)) {
      throw new Error(`Illegal order state transition from ${currentStatus} to ${nextStatus}`);
    }
    return nextStatus;
  }

  public static getKitchenTicketStatus(orderStatus: OrderStatus): 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED' {
    switch (orderStatus) {
      case 'PENDING':
        return 'PENDING';
      case 'CONFIRMED':
      case 'PREPARING':
        return 'PREPARING';
      case 'READY':
        return 'READY';
      case 'COMPLETED':
        return 'COMPLETED';
      case 'CANCELLED':
        return 'CANCELLED';
      default:
        return 'PENDING';
    }
  }
}

describe('Order State Machine - Unit Tests', () => {
  describe('Valid State Transitions', () => {
    test('should allow transition from PENDING to CONFIRMED', () => {
      expect(OrderStateMachine.isValidTransition('PENDING', 'CONFIRMED')).toBe(true);
      expect(OrderStateMachine.transition('PENDING', 'CONFIRMED')).toBe('CONFIRMED');
    });

    test('should allow transition from CONFIRMED to PREPARING', () => {
      expect(OrderStateMachine.isValidTransition('CONFIRMED', 'PREPARING')).toBe(true);
      expect(OrderStateMachine.transition('CONFIRMED', 'PREPARING')).toBe('PREPARING');
    });

    test('should allow transition from PREPARING to READY', () => {
      expect(OrderStateMachine.isValidTransition('PREPARING', 'READY')).toBe(true);
      expect(OrderStateMachine.transition('PREPARING', 'READY')).toBe('READY');
    });

    test('should allow transition from READY to COMPLETED', () => {
      expect(OrderStateMachine.isValidTransition('READY', 'COMPLETED')).toBe(true);
      expect(OrderStateMachine.transition('READY', 'COMPLETED')).toBe('COMPLETED');
    });

    test('should allow cancellation from active non-terminal states', () => {
      expect(OrderStateMachine.isValidTransition('PENDING', 'CANCELLED')).toBe(true);
      expect(OrderStateMachine.isValidTransition('CONFIRMED', 'CANCELLED')).toBe(true);
      expect(OrderStateMachine.isValidTransition('PREPARING', 'CANCELLED')).toBe(true);
      expect(OrderStateMachine.isValidTransition('READY', 'CANCELLED')).toBe(true);
    });
  });

  describe('Invalid / Illegal State Transition Rejections (Negative Cases)', () => {
    test('should reject direct transition from PENDING to COMPLETED (skipping kitchen process)', () => {
      expect(OrderStateMachine.isValidTransition('PENDING', 'COMPLETED')).toBe(false);
      expect(() => OrderStateMachine.transition('PENDING', 'COMPLETED')).toThrow(
        'Illegal order state transition from PENDING to COMPLETED'
      );
    });

    test('should reject direct transition from PENDING to READY', () => {
      expect(OrderStateMachine.isValidTransition('PENDING', 'READY')).toBe(false);
      expect(() => OrderStateMachine.transition('PENDING', 'READY')).toThrow();
    });

    test('should reject backward transition from READY to PREPARING', () => {
      expect(OrderStateMachine.isValidTransition('READY', 'PREPARING')).toBe(false);
      expect(() => OrderStateMachine.transition('READY', 'PREPARING')).toThrow();
    });

    test('should reject state modifications on COMPLETED orders (Terminal state)', () => {
      expect(OrderStateMachine.isValidTransition('COMPLETED', 'PREPARING')).toBe(false);
      expect(OrderStateMachine.isValidTransition('COMPLETED', 'CANCELLED')).toBe(false);
      expect(() => OrderStateMachine.transition('COMPLETED', 'CANCELLED')).toThrow(
        'Illegal order state transition from COMPLETED to CANCELLED'
      );
    });

    test('should reject state modifications on CANCELLED orders (Terminal state)', () => {
      expect(OrderStateMachine.isValidTransition('CANCELLED', 'PENDING')).toBe(false);
      expect(OrderStateMachine.isValidTransition('CANCELLED', 'COMPLETED')).toBe(false);
      expect(() => OrderStateMachine.transition('CANCELLED', 'PENDING')).toThrow();
    });
  });

  describe('Kitchen Ticket Status Mapping', () => {
    test('should correctly synchronize kitchen ticket status with order lifecycle', () => {
      expect(OrderStateMachine.getKitchenTicketStatus('PENDING')).toBe('PENDING');
      expect(OrderStateMachine.getKitchenTicketStatus('CONFIRMED')).toBe('PREPARING');
      expect(OrderStateMachine.getKitchenTicketStatus('PREPARING')).toBe('PREPARING');
      expect(OrderStateMachine.getKitchenTicketStatus('READY')).toBe('READY');
      expect(OrderStateMachine.getKitchenTicketStatus('COMPLETED')).toBe('COMPLETED');
      expect(OrderStateMachine.getKitchenTicketStatus('CANCELLED')).toBe('CANCELLED');
    });
  });
});
