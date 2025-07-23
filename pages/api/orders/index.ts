import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { createOrderSchema, orderFilterSchema } from '@/lib/validations';
import { withAuth, createErrorResponse, validateRequestBody, AuthenticatedRequest } from '@/lib/middleware';

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Liste des commandes
 *     tags: [Orders]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, confirmed, in_production, ready, delivered, completed, cancelled]
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Liste des commandes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderWithCustomer'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *   post:
 *     summary: Créer une nouvelle commande
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrder'
 *     responses:
 *       201:
 *         description: Commande créée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderWithItems'
 */

async function getOrders(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const filters = orderFilterSchema.parse({
      page: parseInt(req.query.page as string || '1'),
      limit: parseInt(req.query.limit as string || '10'),
      status: req.query.status as string,
      customer_id: req.query.customer_id as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    });

    let query = supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        total,
        order_date,
        created_at,
        customers (
          id, name, email, phone
        )
      `, { count: 'exact' })
      .eq('company_id', req.user.company_id);

    // Appliquer les filtres
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    if (filters.date_from) {
      query = query.gte('order_date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('order_date', filters.date_to);
    }

    // Pagination
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;
    query = query.range(from, to);

    const { data: orders, error, count } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / filters.limit);

    return res.status(200).json({
      data: orders,
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

async function createOrder(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const orderData = validateRequestBody(createOrderSchema, req.body);
    const { items, ...orderInfo } = orderData;

    // Générer un numéro de commande unique
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    // Commencer une transaction
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        company_id: req.user.company_id,
        status: 'draft',
        order_number: orderNumber,
        ...orderInfo
      })
      .select(`
        id,
        order_number,
        status,
        total,
        order_date,
        created_at
      `)
      .single();

    if (orderError) throw orderError;

    // Ajouter les articles
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      ...item,
      line_total: (item.unit_price * item.quantity) - (item.discount || 0)
    }));

    const { data: createdItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)
      .select(`
        id,
        order_id,
        product_id,
        quantity,
        unit_price,
        discount,
        line_total,
        products (
          id, name, unit
        )
      `);

    if (itemsError) {
      // Supprimer la commande si l'ajout des articles échoue
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      throw itemsError;
    }

    // Récupérer la commande complète avec les totaux mis à jour
    const { data: completeOrder, error: completeError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        orders.order_number,  -- Désambiguïser order_number
        status,
        total,
        order_date,
        created_at,
        customers (
          id, name, email, phone
        ),
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          discount,
          line_total,
          products (
            id, name, unit
          )
        )
      `)
      .eq('id', order.id)
      .single();

    if (completeError) throw completeError;

    return res.status(201).json(completeOrder);
  } catch (error: any) {
    const errorResponse = createErrorResponse(error);
    return res.status(errorResponse.status).json(errorResponse.json);
  }
}

// Définir le handler principal
const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET':
      await getOrders(req, res);
      break;
    case 'POST':
      await createOrder(req, res);
      break;
    default:
      res.status(405).json({ error: 'Méthode non autorisée' });
  }
};

// Exporter avec withAuth
export default withAuth(handler);
