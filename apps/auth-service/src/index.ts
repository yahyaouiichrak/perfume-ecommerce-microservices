// apps/auth-service/src/index.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import authRoutes from './routes/auth.routes';

// Charger variables d'environnement
dotenv.config();

// Créer app Express
const app: Application = express();
const PORT = process.env.PORT || 3001;

/**
 * MIDDLEWARES GLOBAUX
 */

// CORS - permettre requêtes cross-origin
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parser - parse JSON
app.use(express.json());

// Body parser - parse URL-encoded
app.use(express.urlencoded({ extended: true }));

// Logger simple - CORRECTION: préfixer variables non utilisées avec _
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * ROUTES
 */

// Health check - CORRECTION: enlever req si pas utilisé
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Auth Service is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Routes authentification
app.use('/api/auth', authRoutes);

// Route 404
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handler global - CORRECTION: préfixer avec _
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Global error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/**
 * DÉMARRAGE SERVEUR
 */
const startServer = async () => {
  try {
    // Connexion base de données
    await connectDatabase();

    // Démarrer serveur
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ================================');
      console.log(`🚀 Auth Service running on port ${PORT}`);
      console.log(`🚀 Environment: ${process.env.NODE_ENV}`);
      console.log(`🚀 Health check: http://localhost:${PORT}/health`);
      console.log(`🚀 API Base: http://localhost:${PORT}/api/auth`);
      console.log('🚀 ================================');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Lancer serveur
startServer();

// Export pour tests
export default app;