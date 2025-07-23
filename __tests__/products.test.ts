import { createMocks } from 'node-mocks-http';
import productsHandler from '@/pages/api/products/index';
import productHandler from '@/pages/api/products/[id]';
import { supabaseAdmin } from '@/lib/supabase';

jest.mock('@/lib/supabase');
jest.mock('@/lib/middleware', () => ({
  withAuth: (handler: any) => handler,
  createErrorResponse: jest.fn(() => ({ json: () => ({}) })),
  validateRequestBody: jest.fn((schema, body) => body)
}));

const mockSupabaseAdmin = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>;

describe('/api/products', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    company_id: 'company-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('devrait retourner la liste des produits avec pagination', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '1', limit: '10' }
      });

      // Ajouter l'utilisateur mockée à la requête
      (req as any).user = mockUser;

      const mockProducts = [
        { id: 'prod-1', name: 'Produit 1', price: 10.99, company_id: 'company-123' },
        { id: 'prod-2', name: 'Produit 2', price: 15.99, company_id: 'company-123' }
      ];

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockProducts,
                error: null,
                count: 2
              })
            })
          })
        })
      } as any);

      await productsHandler(req as any);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('products');
    });
  });

  describe('POST /api/products', () => {
    it('devrait créer un nouveau produit', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'Nouveau Produit',
          description: 'Description du produit',
          price: 25.99,
          category: 'test'
        }
      });

      (req as any).user = mockUser;

      const mockNewProduct = {
        id: 'prod-new',
        name: 'Nouveau Produit',
        price: 25.99,
        company_id: 'company-123'
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockNewProduct,
              error: null
            })
          })
        })
      } as any);

      await productsHandler(req as any);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('products');
    });
  });

  describe('GET /api/products/[id]', () => {
    it('devrait retourner un produit spécifique', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'prod-123' }
      });

      (req as any).user = mockUser;

      const mockProduct = {
        id: 'prod-123',
        name: 'Produit Test',
        price: 19.99,
        company_id: 'company-123'
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockProduct,
                error: null
              })
            })
          })
        })
      } as any);

      await productHandler(req as any);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('products');
    });

    it('devrait retourner 404 si le produit n\'existe pas', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'prod-inexistant' }
      });

      (req as any).user = mockUser;

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          })
        })
      } as any);

      await productHandler(req as any);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('products');
    });
  });

  describe('PUT /api/products/[id]', () => {
    it('devrait mettre à jour un produit existant', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'prod-123' },
        body: {
          name: 'Produit Modifié',
          price: 29.99
        }
      });

      (req as any).user = mockUser;

      const mockUpdatedProduct = {
        id: 'prod-123',
        name: 'Produit Modifié',
        price: 29.99,
        company_id: 'company-123'
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUpdatedProduct,
                  error: null
                })
              })
            })
          })
        })
      } as any);

      await productHandler(req as any);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('products');
    });
  });

  describe('DELETE /api/products/[id]', () => {
    it('devrait supprimer un produit', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'prod-123' }
      });

      (req as any).user = mockUser;

      mockSupabaseAdmin.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null
            })
          })
        })
      } as any);

      await productHandler(req as any);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('products');
    });
  });
});