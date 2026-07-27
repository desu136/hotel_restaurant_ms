process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-hospitalityhub-123456789';
process.env.PORT = '4001';

// Mock ESM jose package for Jest compatibility
jest.mock('jose', () => {
  return {
    SignJWT: class {
      private payload: any;
      constructor(payload: any) {
        this.payload = payload;
      }
      setProtectedHeader() {
        return this;
      }
      setIssuedAt() {
        return this;
      }
      setExpirationTime() {
        return this;
      }
      async sign() {
        return `mocked_jwt_${Buffer.from(JSON.stringify(this.payload)).toString('base64url')}`;
      }
    },
    jwtVerify: async (token: string) => {
      if (!token || !token.startsWith('mocked_jwt_')) {
        throw new Error('Invalid token signature or format');
      }
      try {
        const raw = token.replace('mocked_jwt_', '');
        const json = Buffer.from(raw, 'base64url').toString('utf8');
        return { payload: JSON.parse(json) };
      } catch (err) {
        throw new Error('Failed to parse token payload');
      }
    },
  };
});

// Mock Prisma Client for deterministic unit and integration tests
jest.mock('../src/lib/prisma', () => {
  const TENANT_A_ID = '00000000-0000-0000-0000-00000000000a';
  const BRANCH_A_ID = '00000000-0000-0000-0000-0000000000a1';
  const RESTAURANT_ID = '00000000-0000-0000-0000-000000000001';
  const MENU_ITEM_ID = '00000000-0000-0000-0000-000000000010';

  return {
    prisma: {
      order: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          if (where?.id === '00000000-0000-0000-0000-000000000099') {
            return Promise.resolve(null);
          }
          if (where?.tenant_id === TENANT_A_ID) {
            return Promise.resolve({
              id: where?.id || '00000000-0000-0000-0000-000000000111',
              tenant_id: TENANT_A_ID,
              branch_id: BRANCH_A_ID,
              order_number: '01',
              status: 'PENDING',
              order_type: 'DINE_IN',
              total_amount: 18.5,
            });
          }
          return Promise.resolve(null);
        }),
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where?.id === '00000000-0000-0000-0000-000000000099') {
            return Promise.resolve(null);
          }
          return Promise.resolve({
            id: where?.id,
            tenant_id: TENANT_A_ID,
            branch_id: BRANCH_A_ID,
            order_number: '01',
            status: 'PENDING',
            order_type: 'DINE_IN',
            total_amount: 18.5,
          });
        }),
        create: jest.fn().mockImplementation(({ data }: any) =>
          Promise.resolve({ id: '00000000-0000-0000-0000-000000000888', ...data })
        ),
        update: jest.fn().mockImplementation(({ data }: any) =>
          Promise.resolve({ id: '00000000-0000-0000-0000-000000000888', ...data })
        ),
      },
      branch: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where?.id === '00000000-0000-0000-0000-0000000000b1') {
            return Promise.resolve({
              id: where.id,
              tenant_id: '00000000-0000-0000-0000-00000000000b',
              name: 'Tenant B Branch',
            });
          }
          return Promise.resolve({
            id: where?.id || BRANCH_A_ID,
            tenant_id: TENANT_A_ID,
            name: 'Tenant A Branch',
          });
        }),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({ id: BRANCH_A_ID }),
      },
      restaurant: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          return Promise.resolve({
            id: where?.id || RESTAURANT_ID,
            tenant_id: TENANT_A_ID,
            branches: [{ id: BRANCH_A_ID }],
          });
        }),
      },
      menuItem: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where?.id === MENU_ITEM_ID) {
            return Promise.resolve({
              id: MENU_ITEM_ID,
              display_name: 'Truffle Pasta',
              price: 18.5,
              prep_time: 15,
            });
          }
          return Promise.resolve(null); // Items not found
        }),
      },
      customer: {
        findFirst: jest.fn().mockResolvedValue({ id: '00000000-0000-0000-0000-000000000301' }),
        create: jest.fn().mockResolvedValue({ id: '00000000-0000-0000-0000-000000000301' }),
        update: jest.fn().mockResolvedValue({ id: '00000000-0000-0000-0000-000000000301' }),
      },
      customerIdentity: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      orderItem: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      restaurantTable: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      kitchenTicket: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      bill: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: '00000000-0000-0000-0000-000000000401', amount: 50, payment_status: 'PENDING' }),
        update: jest.fn().mockResolvedValue({ id: '00000000-0000-0000-0000-000000000401', payment_status: 'PAID' }),
      },
    },
  };
});
