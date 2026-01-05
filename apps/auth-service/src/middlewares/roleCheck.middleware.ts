import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

/**
 * Middleware pour vérifier les rôles
 * @param roles Rôles autorisés
 */
export const requireRole = (...roles: ('admin' | 'user')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Vérifier si user existe (authentification)
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Vérifier si user a le bon rôle
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
      return;
    }

    next(); // Rôle OK, continuer
  };
};
