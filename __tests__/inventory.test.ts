import { createMocks } from 'node-mocks-http';
import inventoryHandler from '@/pages/api/inventory/index';
import movementsHandler from '@/pages/api/inventory/[id]/movements';
import { supabaseAdmin } from '@/lib/supabase';

jest.mock('@/lib/supabase');
jest.mock('@/lib/middleware', () => ({
  withAuth: (handler: any) => handler,
  createErrorResponse: jest.fn(() => ({ json: () => ({}) })),
  validateRequestBody: jest.fn((schema, body) => body)
}));

const mockSupabaseAdmin = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>;

describe('/api/inventory', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    company_id: 'company-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/inventory', () => {
    it('devrait retourner la liste des stocks avec filtrage', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { 
          page: '1', 
          limit: '10',
          type: 'finished_product',
          low_stock: 'true'
        }
      });

      (req as any).user = mockUser;

      const mockInventory = [
        {
          id: 'inv-1',
          name: 'Farine de blé',
          type: 'raw_material',
          current_stock: 5,
          min_stock_level: 10,
          products: null
        },
        {
          id: 'inv-2',
          name: 'Gâteau Chocolat',
          type: 'finished_product',
          current_stock: 2,
          min_stock_level: 5,
          products: { id: 'prod-1', name: 'Gâteau Chocolat' }
        }
      ];

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              lt: jest.fn().mockReturnValue({
                range: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: mockInventory,
                    error: null,
                    count: 2
                  })
                })
              })
            })
          })
        })
      } as any);

      await inventoryHandler(req as any);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('inventory');
    });
  });

  describe('POST /api/inventory', () => {
    it('devrait créer un nouvel élément d\'inventaire', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'Sucre en poudre',
          type: 'raw_material',
          unit: 'kg',
          current_stock: 25,
          min_stock_level: 5,
          cost_per_unit: 2.50
        }
      });

      (req as any).user = mockUser;

      const mockNewInventory = {
        id: 'inv-new',
        name: 'Sucre en poudre',
        type: 'raw_material',
        current_stock: 25,
        company_id: 'company-123',
        products: null
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockNewInventory,
              error: null
            })
          })
        })
      } as any);

      await inventoryHandler(req as any);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('inventory');
    });
  });

  describe('GET /api/inventory/[id]/movements', () => {
    it('devrait retourner l\'historique des mouvements de stock', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'inv-123', page: '1', limit: '10' }
      });

      (req as any).user = mockUser;

      const mockMovements = [
        {
          id: 'mov-1',
          type: 'in',
          quantity: 50,
          reason: 'Réapprovisionnement',
          created_at: '2024-01-15T10:00:00Z',
          orders: null
        },
        {
          id: 'mov-2',
          type: 'out',
          quantity: 10,
          reason: 'Order confirmed: ORD-000001',
          created_at: '2024-01-16T14:30:00Z',
          orders: { id: 'order-1', order_number: 'ORD-000001' }
        }
      ];

      // Mock vérification élément inventaire
      mockSupabaseAdmin.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'inv-123' },
                  error: null
                })
              })
            })
          })
        } as any)
        // Mock récupération mouvements
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                range: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: mockMovements,
                    error: null,
                    count: 2
                  })
                })
              })
            })
          })
        } as any);

      await movementsHandler(req as any);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('inventory');
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('stock_movements');
    });
  });

  describe('POST /api/inventory/[id]/movements', () => {
    it('devrait ajouter un mouvement d\'entrée de stock', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'inv-123' },
        body: {
          type: 'in',
          quantity: 20,
          unit_cost: 3.00,
          reference: 'BON-2024-001',
          reason: 'Livraison fournisseur'
        }
      });

      (req as any).user = mockUser;

      // Mock vérification élément inventaire
      mockSupabaseAdmin.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'inv-123', current_stock: 15 },
                  error: null
                })
              })
            })
          })
        } as any)
        // Mock création mouvement
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'mov-new',
                  type: 'in',
                  quantity: 20,
                  inventory_id: 'inv-123',
                  orders: null
                },
                error: null
              })
            })
          })
        } as any)
        // Mock mise à jour stock
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null
            })
          })
        } as any);

      await movementsHandler(req as any);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('inventory');
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('stock_movements');
    });

    it('devrait rejeter un mouvement de sortie si stock insuffisant', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'inv-123' },
        body: {
          type: 'out',
          quantity: 25 // Plus que le stock disponible
        }
      });

      (req as any).user = mockUser;

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'inv-123', current_stock: 10 }, // Stock insuffisant
                error: null
              })
            })
          })
        })
      } as any);

      await movementsHandler(req as any);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('inventory');
      // Ne devrait pas créer de mouvement
      expect(mockSupabaseAdmin.from).not.toHaveBeenCalledWith('stock_movements');
    });
  });
});