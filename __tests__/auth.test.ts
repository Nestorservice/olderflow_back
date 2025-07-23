import { createMocks } from 'node-mocks-http';
import signupHandler from '@/pages/api/auth/signup';
import loginHandler from '@/pages/api/auth/login';
import { supabaseAdmin } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase');

const mockSupabaseAdmin = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>;

describe('/api/auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/api/auth/signup', () => {
    it('devrait créer un nouvel utilisateur et entreprise avec succès', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'password123',
          company_name: 'Test Company',
          company_email: 'contact@testcompany.com',
          business_type: 'custom_orders'
        },
      });

      // Mock réussite de création utilisateur
      mockSupabaseAdmin.auth.admin.createUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com'
          }
        },
        error: null
      } as any);

      // Mock réussite de création entreprise
      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'company-123',
                name: 'Test Company',
                business_type: 'custom_orders'
              },
              error: null
            })
          })
        })
      } as any);

      await signupHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(JSON.parse(res._getData())).toEqual({
        user: {
          id: 'user-123',
          email: 'test@example.com'
        },
        company: {
          id: 'company-123',
          name: 'Test Company',
          business_type: 'custom_orders'
        }
      });
    });

    it('devrait retourner une erreur 400 si les données sont manquantes', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com'
          // password et company_name manquants
        },
      });

      await signupHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toHaveProperty('error');
    });

    it('devrait retourner une erreur 409 si l\'email existe déjà', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'existing@example.com',
          password: 'password123',
          company_name: 'Test Company'
        },
      });

      mockSupabaseAdmin.auth.admin.createUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'User already registered' } as any
      } as any);

      await signupHandler(req, res);

      expect(res._getStatusCode()).toBe(409);
      expect(JSON.parse(res._getData())).toHaveProperty('error', 'Cet email est déjà utilisé');
    });
  });

  describe('/api/auth/login', () => {
    it('devrait connecter un utilisateur avec succès', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'password123'
        },
      });

      // Mock réussite de connexion
      mockSupabaseAdmin.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com'
          },
          session: {
            access_token: 'access-token',
            refresh_token: 'refresh-token'
          }
        },
        error: null
      } as any);

      // Mock récupération entreprise
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'company-123',
                name: 'Test Company',
                business_type: 'custom_orders',
                inventory_management: false
              },
              error: null
            })
          })
        })
      } as any);

      await loginHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toHaveProperty('access_token', 'access-token');
      expect(JSON.parse(res._getData())).toHaveProperty('user');
      expect(JSON.parse(res._getData())).toHaveProperty('company');
    });

    it('devrait retourner une erreur 401 pour des identifiants invalides', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'wrong@example.com',
          password: 'wrongpassword'
        },
      });

      mockSupabaseAdmin.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' } as any
      } as any);

      await loginHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toHaveProperty('error', 'Identifiants invalides');
    });
  });
});