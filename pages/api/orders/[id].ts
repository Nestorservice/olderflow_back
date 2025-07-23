
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { updateOrderSchema } from '@/lib/validations';
import { withAuth, createErrorResponse, validateRequestBody, AuthenticatedRequest } from '@/lib/middleware';

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Récupérer une commande avec ses détails
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Détails de la commande
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderWithItems'
 *   put:
 *     summary: Mettre à jour une commande
 *     tags: [Orders]
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
 *             $ref: '#/components/schemas/UpdateOrder'
 *     responses:
 *       200:
 *         description: Commande mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderWithItems'
 *   delete:
 *     summary: Supprimer une commande
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Commande supprimée
 */

async function getOrder(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        orders.order_number,  -- Désambiguïser order_number
        status,
        total,
        order_date,
        created_at,
        customers (
          id, name, email, phone, address, city, postal_code, country
        ),
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          discount,
          line_total,
          products (
            id, name, description, unit, attributes
          )
        )
      `)
      .eq('id', id as string)
      .eq('company_id', req.user.company_id)
      .single();

    if (error) throw error;
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    return res.status(200).json(order);
  } catch (error: any) {
    const errorResponse = createErrorResponse(error);
    return res.status(errorResponse.status).json(errorResponse.json);
  }
}

async function updateOrder(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const updateData = validateRequestBody(updateOrderSchema, req.body);

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', id as string)
      .eq('company_id', req.user.company_id)
      .select(`
        id,
        orders.order_number,  -- Désambiguïser order_number
        status,
        total,
        order_date,
        created_at,
        customers (
          id, name, email, phone, address
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
      .single();

    if (error) throw error;
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    return res.status(200).json(order);
  } catch (error: any) {
    const errorResponse = createErrorResponse(error);
    return res.status(errorResponse.status).json(errorResponse.json);
  }
}

async function deleteOrder(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    // Vérifier que la commande peut être supprimée
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', id as string)
      .eq('company_id', req.user.company_id)
      .single();

    if (orderError) throw orderError;
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (['completed', 'delivered'].includes(order.status)) {
      return res.status(400).json({
        error: 'Impossible de supprimer une commande terminée ou livrée'
      });
    }

    // Supprimer la commande (les articles seront supprimés automatiquement par CASCADE)
    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', id as string)
      .eq('company_id', req.user.company_id);

    if (error) throw error;

    return res.status(204).end();
  } catch (error: any) {
    const errorResponse = createErrorResponse(error);
    return res.status(errorResponse.status).json(errorResponse.json);
  }
}

// Définir le handler principal
const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET':
      await getOrder(req, res);
      break;
    case 'PUT':
      await updateOrder(req, res);
      break;
    case 'DELETE':
      await deleteOrder(req, res);
      break;
    default:
      res.status(405).json({ error: 'Méthode non autorisée' });
  }
};

// Exporter avec withAuth
export default withAuth(handler);
