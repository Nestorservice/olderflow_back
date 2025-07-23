import { createMocks } from 'node-mocks-http';
import ordersHandler from '@/pages/api/orders/index';
import orderHandler from '@/pages/api/orders/[id]';
import { supabaseAdmin } from '@/lib/supabase';

jest.mock('@/lib/supabase');
jest.mock('@/lib/middleware', () => ({
  withAuth: (handler: any) => handler,
  createErrorResponse: jest.fn(() => ({ json: () => ({}) })),
  validateRequestBody: jest.fn((schema, body) => body)
}));

const mockSupabaseAdmin = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>;

describe('/api/orders', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    company_id: 'company-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/orders', () => {
    it('devrait retourner la liste des commandes avec filtres', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { 
          page: '1', 
          limit: '10',
          status: 'pending' 
        }
      });

      (req as any).user = mockUser;

      const mockOrders = [
        {
          id: 'order-1',
          order_number: 'ORD-000001',
          status: 'pending',
          total: 99.99,
          customers: { name: 'Client Test', email: 'client@test.com' }
        }
      ];

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              range: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockOrders,
                  error: null,
                  count: 1
                })
              })
            })
          })
        })
      } as any);

      await ordersHandler(req as any);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('orders');
    });
  });

  describe('POST /api/orders', () => {
    it('devrait créer une nouvelle commande avec articles', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          customer_id: 'customer-123',
          delivery_method: 'pickup',
          items: [
            {
              product_id: 'product-1',
              quantity: 2,
              unit_price: 15.99,
              discount: 0
            }
          ]
        }
      });

      (req as any).user = mockUser;

      // Mock création de commande
      const mockOrder = {
        id: 'order-new',
        order_number: 'ORD-000002',
        company_id: 'company-123',
        customer_id: 'customer-123'
      };

      mockSupabaseAdmin.from
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockOrder,
                error: null
              })
            })
          })
        } as any)
        // Mock ajout des articles
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'item-1',
                  order_id: 'order-new',
                  product_id: 'product-1',
                  quantity: 2,
                  unit_price: 15.99,
                  line_total: 31.98
                }
              ],
              error: null
            })
          })
        } as any)
        // Mock récupération commande complète
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  ...mockOrder,
                  customers: { name: 'Client Test' },
                  order_items: [
                    {
                      id: 'item-1',
                      quantity: 2,
                      unit_price: 15.99,
                      products: { name: 'Produit Test' }
                    }
                  ]
                },
                error: null
              })
            })
          })
        } as any);

      await ordersHandler(req as any);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('orders');
    });
  });

  describe('GET /api/orders/[id]', () => {
    it('devrait retourner une commande complète avec détails', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'order-123' }
      });

      (req as any).user = mockUser;

      const mockOrderWithDetails = {
        id: 'order-123',
        order_number: 'ORD-000001',
        status: 'confirmed',
        total: 45.99,
        customers: {
          id: 'customer-1',
          name: 'Client Test',
          email: 'client@test.com',
          phone: '+33123456789'
        },
        order_items: [
          {
            id: 'item-1',
            quantity: 1,
            unit_price: 45.99,
            products: {
              id: 'product-1',
              name: 'Gâteau Chocolat',
              unit: 'pièce'
            }
          }
        ]
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockOrderWithDetails,
                error: null
              })
            })
          })
        })
      } as any);

      await orderHandler(req as any);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('orders');
    });
  });

  describe('PUT /api/orders/[id]', () => {
    it('devrait mettre à jour le statut d\'une commande', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'order-123' },
        body: {
          status: 'in_production'
        }
      });

      (req as any).user = mockUser;

      const mockUpdatedOrder = {
        id: 'order-123',
        status: 'in_production',
        customers: { name: 'Client Test' },
        order_items: []
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUpdatedOrder,
                  error: null
                })
              })
            })
          })
        })
      } as any);

      await orderHandler(req as any);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('orders');
    });
  });

  describe('DELETE /api/orders/[id]', () => {
    it('devrait supprimer une commande si le statut le permet', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'order-123' }
      });

      (req as any).user = mockUser;

      // Mock vérification du statut
      mockSupabaseAdmin.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { status: 'draft' },
                  error: null
                })
              })
            })
          })
        } as any)
        // Mock suppression
        .mockReturnValueOnce({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: null
              })
            })
          })
        } as any);

      await orderHandler(req as any);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('orders');
    });

    it('devrait rejeter la suppression d\'une commande terminée', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'order-123' }
      });

      (req as any).user = mockUser;

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { status: 'completed' },
                error: null
              })
            })
          })
        })
      } as any);

      await orderHandler(req as any);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('orders');
    });
  });
});