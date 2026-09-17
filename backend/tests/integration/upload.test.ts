import request from 'supertest';
import app from '../../src/index';
import { authToken, bearer } from '../helpers/tokens';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn((_opts, cb) => ({
        end: () => {
          cb(null, {
            secure_url: 'https://res.cloudinary.com/demo/image/upload/dfoodie/uploads/verify.png',
            public_id: 'dfoodie/uploads/verify',
            width: 1,
            height: 1,
            format: 'png',
          });
        },
      })),
    },
  },
}));

describe('POST /api/upload/image', () => {
  const original = {
    name: process.env.CLOUDINARY_CLOUD_NAME,
    key: process.env.CLOUDINARY_API_KEY,
    secret: process.env.CLOUDINARY_API_SECRET,
  };

  afterEach(() => {
    process.env.CLOUDINARY_CLOUD_NAME = original.name;
    process.env.CLOUDINARY_API_KEY = original.key;
    process.env.CLOUDINARY_API_SECRET = original.secret;
  });

  test('requires authentication', async () => {
    const res = await request(app).post('/api/upload/image');
    expect(res.status).toBe(401);
  });

  test('returns 503 when Cloudinary is not configured', async () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    const token = await authToken(['OWNER']);
    const res = await request(app)
      .post('/api/upload/image')
      .set(bearer(token))
      .attach('image', Buffer.from('fake-png'), { filename: 'logo.png', contentType: 'image/png' });
    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/not configured/i);
  });

  test('returns 400 when no file is provided', async () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'demo';
    process.env.CLOUDINARY_API_KEY = 'key';
    process.env.CLOUDINARY_API_SECRET = 'secret';
    const token = await authToken(['OWNER']);
    const res = await request(app).post('/api/upload/image').set(bearer(token));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no image file/i);
  });

  test('returns a Cloudinary URL on success', async () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'demo';
    process.env.CLOUDINARY_API_KEY = 'key';
    process.env.CLOUDINARY_API_SECRET = 'secret';
    const token = await authToken(['OWNER']);
    const res = await request(app)
      .post('/api/upload/image')
      .set(bearer(token))
      .attach('image', Buffer.from('fake-png'), { filename: 'logo.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toBe(
      'https://res.cloudinary.com/demo/image/upload/dfoodie/uploads/verify.png'
    );
  });

  test('returns 413 when the file is larger than 5MB', async () => {
    const token = await authToken(['OWNER']);
    const res = await request(app)
      .post('/api/upload/image')
      .set(bearer(token))
      .attach('image', Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: 'huge.png',
        contentType: 'image/png',
      });
    expect(res.status).toBe(413);
    expect(res.body.error).toMatch(/5MB/i);
  });
});
