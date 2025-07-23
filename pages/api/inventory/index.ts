import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { createInventorySchema, inventoryFilterSchema } from '@/lib/validations';
import { withAuth, createErrorResponse, validateRequestBody, AuthenticatedRequest } from '@/lib/middleware';

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Liste des stocks
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [finished_product, raw_material]
 *       - in: query
 *         name: low_stock
 *         schema:
 *           type: boolean
 *         description: Filtrer les articles en stock bas
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Liste des stocks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Inventory'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *   post:
 *     summary: Ajouter un nouvel élément d'inventaire
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInventory'
 *     responses:
 *       201:
 *         description: Élément d'inventaire créé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 */

async function getInventory(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const filters = inventoryFilterSchema.parse({
      page: parseInt(req.query.page as string || '1'),
      limit: parseInt(req.query.limit as string || '10'),
      type: req.query.type as string,
      low_stock: req.query.low_stock ? req.query.low_stock === 'true' : undefined,
      is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
    });

    let query = supabaseAdmin
      .from('inventory')
      .select(`
        *,
        products (
          id, name
        )
      `, { count: 'exact' })
      .eq('company_id', req.user.company_id);

    // Appliquer les filtres
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters.low_stock) {
      query = query.lt('current_stock', 'min_stock_level');
    }

    // Pagination
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;
    query = query.range(from, to);

    const { data: inventory, error, count } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / filters.limit);

    return res.status(200).json({
      data: inventory,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages,
        hasNext: filters.page < totalPages,
        hasPrev: filters.page > 1
      }
    });
  } catch (error: any) {
    const errorResponse = createErrorResponse(error);
    return res.status(errorResponse.status).json(errorResponse.json);
  }
}

async function createInventory(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const inventoryData = validateRequestBody(createInventorySchema, req.body);

    const { data: inventory, error } = await supabaseAdmin
      .from('inventory')
      .insert({
        company_id: req.user.company_id,
        ...inventoryData
      })
      .select(`
        *,
        products (
          id, name
        )
      `)
      .single();

    if (error) throw error;

    return res.status(201).json(inventory);
  } catch (error: any) {
    const errorResponse = createErrorResponse(error);
    return res.status(errorResponse.status).json(errorResponse.json);
  }
}

export default withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET':
      return await getInventory(req, res);
    case 'POST':
      return await createInventory(req, res);
    default:
      return res.status(405).json({ error: 'Méthode non autorisée' });
  }
});