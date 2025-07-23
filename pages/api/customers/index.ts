import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { createCustomerSchema, paginationSchema } from '@/lib/validations';
import { withAuth, createErrorResponse, validateRequestBody, AuthenticatedRequest } from '@/lib/middleware';

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Liste des clients
 *     tags: [Customers]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche par nom ou email
 *     responses:
 *       200:
 *         description: Liste des clients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Customer'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *   post:
 *     summary: Créer un nouveau client
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomer'
 *     responses:
 *       201:
 *         description: Client créé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 */

async function getCustomers(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { page, limit } = paginationSchema.parse({
      page: parseInt(req.query.page as string || '1'),
      limit: parseInt(req.query.limit as string || '10')
    });

    const { search } = req.query;

    let query = supabaseAdmin
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('company_id', req.user.company_id);

    // Recherche par nom ou email
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: customers, error, count } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / limit);

    return res.status(200).json({
      data: customers,
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

async function createCustomer(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const customerData = validateRequestBody(createCustomerSchema, req.body);

    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .insert({
        company_id: req.user.company_id,
        ...customerData
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(customer);
  } catch (error: any) {
    const errorResponse = createErrorResponse(error);
    return res.status(errorResponse.status).json(errorResponse.json);
  }
}

export default withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET':
      return await getCustomers(req, res);
    case 'POST':
      return await createCustomer(req, res);
    default:
      return res.status(405).json({ error: 'Méthode non autorisée' });
  }
});