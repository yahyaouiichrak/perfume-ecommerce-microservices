// apps/auth-service/src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

// Typage explicite du router
const router: Router = Router();
const authController = new AuthController();

/**
 * Routes publiques (sans authentification)
 */

// POST /api/auth/register - Inscription
router.post('/register', (req, res) => authController.register(req, res));

// POST /api/auth/login - Connexion
router.post('/login', (req, res) => authController.login(req, res));

/**
 * Routes protégées (authentification requise)
 */

// GET /api/auth/profile - Profil utilisateur
router.get('/profile', authenticateToken, (req, res) => 
  authController.getProfile(req, res)
);

// GET /api/auth/verify - Vérifier token
router.get('/verify', authenticateToken, (req, res) => 
  authController.verifyToken(req, res)
);

export default router;