import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt.util';

/**
 * Interface Request étendue avec user
 */
export interface AuthRequest extends Request {
  user?: JWTPayload;
}

/**
 * Middleware pour vérifier le token JWT
 * Ajoute req.user si token valide
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Récupérer token depuis header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    // Vérifier et décoder token
    const decoded = verifyToken(token);
    req.user = decoded;
    
    next(); // Continuer vers le controller
  } catch (error: any) {
    res.status(403).json({
      success: false,
      message: error.message || 'Invalid or expired token'
    });
  }
};
