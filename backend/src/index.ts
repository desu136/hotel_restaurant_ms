import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import tenantRoutes from './routes/tenant';
import tenantsRoutes from './routes/tenants';
import branchRoutes from './routes/branches';
import employeeRoutes from './routes/employees';
import roleRoutes from './routes/roles';
import subscriptionRoutes from './routes/subscriptions';
import modulesRoutes from './routes/modules';
import settingsRoutes from './routes/settings';
import auditLogsRoutes from './routes/audit-logs';
import setupRoutes from './routes/setup';
import restaurantRoutes from './routes/restaurant';
import orderRoutes from './routes/orders';
import billingRoutes from './routes/billing';
import uploadRoutes from './routes/upload';
import qrRoutes from './routes/qr';
import reportsRoutes from './routes/reports';
import promotionsRoutes from './routes/promotions';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Dynamically reflect origin to prevent local network/webview CORS block
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/tenants', tenantsRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/promotions', promotionsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend API running on http://0.0.0.0:${PORT}`);
});

export default app;
