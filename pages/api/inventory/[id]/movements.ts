import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { createStockMovementSchema, paginationSchema } from '@/lib/validations';
import { withAuth, createErrorResponse, validateRequestBody, AuthenticatedRequest } from '@/lib/middleware';

/**
 * @swagger
 * /api/inventory/{id}/movements:
 *   get:
 *     summary: Historique des mouvements de stock
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *     responses:
 *       200:
 *         description: Historique des mouvements
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StockMovement'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *   post:
 *     summary: Ajouter un mouvement de stock
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - quantity
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [in, out, adjustment]
 *               quantity:
 *                 type: number
 *                 minimum: 0
 *               unit_cost:
 *                 type: number
 *                 minimum: 0
 *               reference:
 *                 type: string
 *               reason:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Mouvement de stock ajouté
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StockMovement'
 */

async function getStockMovements(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const { page, limit } = paginationSchema.parse({
      page: parseInt(req.query.page as string || '1'),
      limit: parseInt(req.query.limit as string || '10')
    });

    // Vérifier que l'élément d'inventaire appartient à l'entreprise
    const { data: inventoryItem, error: inventoryError } = await supabaseAdmin
      .from('inventory')
      .select('id')
      .eq('id', id as string)
      .eq('company_id', req.user.company_id)
      .single();

    if (inventoryError || !inventoryItem) {
      return res.status(404).json({ error: 'Élément d\'inventaire non trouvé' });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: movements, error, count } = await supabaseAdmin
      .from('stock_movements')
      .select(`
        *,
        orders (
          id, order_number
        )
      `, { count: 'exact' })
      .eq('inventory_id', id as string)
      .eq('company_id', req.user.company_id)
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / limit);

    return res.status(200).json({
      data: movements,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error: any) {
    const errorResponse = createErrorResponse(error);
    return res.status(errorResponse.status).json(errorResponse.json);
  }
}

async function addStockMovement(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const movementData = validateRequestBody(createStockMovementSchema, {
      ...req.body,
      inventory_id: id as string
    });

    // Vérifier que l'élément d'inventaire appartient à l'entreprise
    const { data: inventoryItem, error: inventoryError } = await supabaseAdmin
      .from('inventory')
      .select('id, current_stock')
      .eq('id', id as string)
      .eq('company_id', req.user.company_id)
      .single();

    if (inventoryError || !inventoryItem) {
      return res.status(404).json({ error: 'Élément d\'inventaire non trouvé' });
    }

    // Vérifier que le mouvement sortant ne dépasse pas le stock disponible
    if (movementData.type === 'out' && movementData.quantity > inventoryItem.current_stock) {
      return res.status(400).json({
        error: 'Quantité insuffisante en stock'
      });
    }

    // Créer le mouvement de stock
    const { data: movement, error: movementError } = await supabaseAdmin
      .from('stock_movements')
      .insert({
        company_id: req.user.company_id,
        ...movementData
      })
      .select(`
        *,
        orders (
          id, order_number
        )
      `)
      .single();

    if (movementError) throw movementError;

    // Mettre à jour le stock
    let newStock = inventoryItem.current_stock;
    switch (movementData.type) {
      case 'in':
        newStock += movementData.quantity;
        break;
      case 'out':
        newStock -= movementData.quantity;
        break;
      case 'adjustment':
        newStock = movementData.quantity;
        break;
    }

    const { error: updateError } = await supabaseAdmin
      .from('inventory')
      .update({ current_stock: newStock })
      .eq('id', id as string);

    if (updateError) throw updateError;

    return res.status(201).json(movement);
  } catch (error: any) {
    const errorResponse = createErrorResponse(error);
    return res.status(errorResponse.status).json(errorResponse.json);
  }
}

// Définir le handler principal
const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET':
      await getStockMovements(req, res);
      break;
    case 'POST':
      await addStockMovement(req, res);
      break;
    default:
      res.status(405).json({ error: 'Méthode non autorisée' });
  }
};

// Exporter avec withAuth
export default withAuth(handler);