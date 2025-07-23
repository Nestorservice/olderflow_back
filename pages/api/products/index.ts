import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { createProductSchema, productFilterSchema } from '@/lib/validations';
import { withAuth, createErrorResponse, validateRequestBody, AuthenticatedRequest } from '@/lib/middleware';

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Liste des produits
 *     tags: [Products]
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
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: track_inventory
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Liste des produits
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *   post:
 *     summary: Créer un nouveau produit
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProduct'
 *     responses:
 *       201:
 *         description: Produit créé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */

async function getProducts(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const filters = productFilterSchema.parse({
      page: parseInt(req.query.page as string || '1'),
      limit: parseInt(req.query.limit as string || '10'),
      category: req.query.category as string,
      is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
      track_inventory: req.query.track_inventory ? req.query.track_inventory === 'true' : undefined,
    });

    let query = supabaseAdmin
      .from('products')
      .select('*', { count: 'exact' })
      .eq('company_id', req.user.company_id);

    // Appliquer les filtres
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters.track_inventory !== undefined) {
      query = query.eq('track_inventory', filters.track_inventory);
    }

    // Pagination
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;
    query = query.range(from, to);

    const { data: products, error, count } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / filters.limit);

    return res.status(200).json({
      data: products,
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

async function createProduct(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const productData = validateRequestBody(createProductSchema, req.body);

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        company_id: req.user.company_id,
        ...productData
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(product);
  } catch (error: any) {
    const errorResponse = createErrorResponse(error);
    return res.status(errorResponse.status).json(errorResponse.json);
  }
}

export default withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET':
      return await getProducts(req, res);
    case 'POST':
      return await createProduct(req, res);
    default:
      return res.status(405).json({ error: 'Méthode non autorisée' });
  }
});