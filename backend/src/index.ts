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

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3001'],
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

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend API running on http://localhost:${PORT}`);
});

export default app;
