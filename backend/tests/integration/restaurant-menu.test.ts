import request from 'supertest';
import app from '../../src/index';
import { prisma } from '../../src/lib/prisma';
import { authToken, bearer } from '../helpers/tokens';
import { BRANCH_A_ID, RESTAURANT_ID } from '../helpers/ids';

const MASTER_CAT_ID = '581f4c33-c924-4691-ae60-a570ddbf30f2';
const LOCAL_CAT_ID = '28c44f59-9024-4ce4-a20c-044331fabec4';

describe('Restaurant menu create', () => {
  test('master item copies the branch category, not a null category_id', async () => {
    (prisma.masterCategory.findUnique as jest.Mock).mockResolvedValue({
      id: MASTER_CAT_ID,
      name: 'coffee',
    });
    (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.category.findFirst as jest.Mock).mockResolvedValue({
      id: LOCAL_CAT_ID,
      master_category_id: MASTER_CAT_ID,
      branch_id: BRANCH_A_ID,
    });
    (prisma.masterMenuItem.create as jest.Mock).mockResolvedValue({
      id: 'master-item-1',
      display_name: 'Jebena Buna',
      master_category_id: MASTER_CAT_ID,
      category: { id: MASTER_CAT_ID, name: 'coffee' },
    });
    (prisma.branch.findMany as jest.Mock).mockResolvedValue([
      { id: BRANCH_A_ID, restaurant_id: RESTAURANT_ID },
    ]);

    const token = await authToken(['HOTEL_OWNER']);
    const res = await request(app)
      .post('/api/restaurant/menu')
      .set(bearer(token))
      .send({
        display_name: 'Jebena Buna',
        restaurant_id: RESTAURANT_ID,
        is_master: true,
        master_category_id: MASTER_CAT_ID,
        price: 50,
      });

    expect(res.status).toBe(201);
    expect(prisma.menuItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          branch_id: BRANCH_A_ID,
          category_id: LOCAL_CAT_ID,
          display_name: 'Jebena Buna',
        }),
      })
    );
  });
});
