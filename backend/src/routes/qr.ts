import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import QRCode from 'qrcode';
import crypto from 'crypto';
import os from 'os';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const MANAGER_ROLES = ['RESTAURANT_MANAGER', 'HOTEL_OWNER', 'HOTEL_MANAGER'];

function getLocalIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// POST /api/qr/generate
router.post(
  '/generate',
  requireRole(...MANAGER_ROLES),
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const { table_id } = req.body;

      if (!table_id) {
        return res.status(400).json({ error: 'table_id is required' });
      }

      // Check if table exists
      const table = await prisma.restaurantTable.findUnique({
        where: { id: table_id },
        include: { restaurant: true },
      });

      if (!table) {
        return res.status(404).json({ error: 'Table not found' });
      }

      // Check if QR code already exists for this table
      const existingQr = await prisma.qRCode.findFirst({
        where: { table_id },
      });

      if (existingQr) {
        return res.status(400).json({ error: 'A QR code already exists for this table. Delete it first.' });
      }

      const token = crypto.randomUUID();
      let baseUrl = process.env.FRONTEND_URL || `http://${getLocalIp()}:3000`;
      if (baseUrl.includes('0.0.0.0') || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
        baseUrl = baseUrl
          .replace('0.0.0.0', getLocalIp())
          .replace('localhost', getLocalIp())
          .replace('127.0.0.1', getLocalIp());
      }
      const qrString = `${baseUrl}/menu/${table.restaurant_id}?tableId=${table_id}&qrToken=${token}`;

      // Generate Data URL for QR Code
      const qrCodeDataUrl = await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      const qrCode = await prisma.qRCode.create({
        data: {
          table_id,
          token,
          status: 'ACTIVE',
        },
      });

      return res.status(201).json({
        success: true,
        data: {
          ...qrCode,
          qrCodeUrl: qrCodeDataUrl,
          codeString: qrString,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/qr/list/:restaurantId
router.get(
  '/list/:restaurantId',
  requireRole(...MANAGER_ROLES),
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const restaurantId = req.params.restaurantId as string;

      const qrCodes = await prisma.qRCode.findMany({
        where: {
          table: {
            restaurant_id: restaurantId,
          },
        },
        include: {
          table: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      const qrCodesWithUrls = await Promise.all(
        qrCodes.map(async (qr) => {
          let baseUrl = process.env.FRONTEND_URL || `http://${getLocalIp()}:3000`;
          if (baseUrl.includes('0.0.0.0') || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
            baseUrl = baseUrl
              .replace('0.0.0.0', getLocalIp())
              .replace('localhost', getLocalIp())
              .replace('127.0.0.1', getLocalIp());
          }
          const qrString = `${baseUrl}/menu/${restaurantId}?tableId=${qr.table_id}&qrToken=${qr.token}`;
          const qrCodeUrl = await QRCode.toDataURL(qrString, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });
          return {
            ...qr,
            qrCodeUrl,
            codeString: qrString,
          };
        })
      );

      return res.json({
        success: true,
        data: qrCodesWithUrls,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/qr/:id
router.delete(
  '/:id',
  requireRole(...MANAGER_ROLES),
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const id = req.params.id as string;

      const qrCode = await prisma.qRCode.findUnique({
        where: { id },
      });

      if (!qrCode) {
        return res.status(404).json({ error: 'QR Code not found' });
      }

      await prisma.qRCode.delete({
        where: { id },
      });

      return res.json({
        success: true,
        message: 'QR code deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
