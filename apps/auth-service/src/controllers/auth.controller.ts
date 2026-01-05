import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { generateToken } from '../utils/jwt.util';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Controller pour l'authentification
 */
export class AuthController {
  /**
   * Inscription d'un nouvel utilisateur
   * POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      // Validation des champs requis
      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          message: 'All fields are required (email, password, firstName, lastName)'
        });
        return;
      }

      // Validation longueur password
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
        return;
      }

      // Vérifier si email existe déjà
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
        return;
      }

      // Hash du mot de passe (10 rounds = bon équilibre sécurité/performance)
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer utilisateur
      const user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'user' // user par défaut
      });

      // Générer token JWT
      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      });

      // Réponse (sans password)
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            createdAt: user.createdAt
          },
          token
        }
      });
    } catch (error: any) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Connexion utilisateur
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      // Trouver utilisateur
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      // Vérifier si compte actif
      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
        return;
      }

      // Comparer password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      // Générer token
      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      });

      // Réponse
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          },
          token
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtenir profil utilisateur connecté
   * GET /api/auth/profile
   */
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      // req.user ajouté par authenticateToken middleware
      const user = await User.findById(req.user?.userId).select('-password');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Vérifier validité du token
   * GET /api/auth/verify
   */
  async verifyToken(req: AuthRequest, res: Response): Promise<void> {
    // Si on arrive ici, le token est valide (passé par authenticateToken)
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user
      }
    });
  }
}
