import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { updateCustomerSchema } from '@/lib/validations';
import { withAuth, createErrorResponse, validateRequestBody, AuthenticatedRequest } from '@/lib/middleware';

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Récupérer un client avec ses commandes
 *     tags: [Customers]
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
 *         description: Détails du client
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               allOf:
 *                 - $ref: '#/components/schemas/Customer'
 *                 - type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *       400:
 *         description: ID invalide
 *       401:
 *         description: Non autorisé (token manquant ou invalide)
 *       403:
 *         description: Entreprise non trouvée
 *       404:
 *         description: Client non trouvé
 *   put:
 *     summary: Mettre à jour un client
 *     tags: [Customers]
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
 *             $ref: '#/components/schemas/UpdateCustomer'
 *     responses:
 *       200:
 *         description: Client mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Entreprise non trouvée
 *       404:
 *         description: Client non trouvé
 *   delete:
 *     summary: Supprimer un client
 *     tags: [Customers]
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
 *         description: Client supprimé
 *       400:
 *         description: Impossible de supprimer (commandes associées)
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Entreprise non trouvée
 *       404:
 *         description: Client non trouvé
 */

// Middleware de débogage pour inspecter les en-têtes
const debugHeaders = (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
  console.log('Headers reçus:', req.headers);
  next();
};

async function getCustomer(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .select(`
        *,
        orders (
          id, order_number, status, order_date, total, created_at
        )
      `)
      .eq('id', id)
      .eq('company_id', req.user.company_id)
      .single();

    if (error) throw error;
    if (!customer) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    return res.status(200).json(customer);
  } catch (error: any) {
    const errorResponse = createErrorResponse(error);
    return res.status(errorResponse.status).json(errorResponse.json);
  }
}

async function updateCustomer(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const updateData = validateRequestBody(updateCustomerSchema, req.body);

    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', req.user.company_id)
      .select()
      .single();

    if (error) throw error;
    if (!customer) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    return res.status(200).json(customer);
  } catch (error: any) {
    const errorResponse = createErrorResponse(error);
    return res.status(errorResponse.status).json(errorResponse.json);
  }
}

async function deleteCustomer(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('customer_id', id)
      .eq('company_id', req.user.company_id)
      .limit(1);

    if (ordersError) throw ordersError;

    if (orders && orders.length > 0) {
      return res.status(400).json({
        error: 'Impossible de supprimer ce client car il a des commandes associées',
      });
    }

    const { error } = await supabaseAdmin
      .from('customers')
      .delete()
      .eq('id', id)
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
  debugHeaders(req, res, async () => {
    switch (req.method) {
      case 'GET':
        await getCustomer(req, res);
        break;
      case 'PUT':
        await updateCustomer(req, res);
        break;
      case 'DELETE':
        await deleteCustomer(req, res);
        break;
      default:
        res.status(405).json({ error: 'Méthode non autorisée' });
    }
  });
};

// Exporter avec withAuth
export default withAuth(handler);