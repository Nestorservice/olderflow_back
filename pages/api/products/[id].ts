import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { updateProductSchema } from '@/lib/validations';
import { withAuth, createErrorResponse, validateRequestBody, AuthenticatedRequest } from '@/lib/middleware';

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Récupérer un produit
 *     tags: [Products]
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
 *         description: Détails du produit
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *   put:
 *     summary: Mettre à jour un produit
 *     tags: [Products]
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
 *             $ref: '#/components/schemas/UpdateProduct'
 *     responses:
 *       200:
 *         description: Produit mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *   delete:
 *     summary: Supprimer un produit
 *     tags: [Products]
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
 *         description: Produit supprimé
 */

async function getProduct(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id as string)
      .eq('company_id', req.user.company_id)
      .single();

    if (error) throw error;
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    return res.status(200).json(product);
  } catch (error: any) {
    const errorResponse = createErrorResponse(error);
    return res.status(errorResponse.status).json(errorResponse.json);
  }
}

async function updateProduct(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const updateData = validateRequestBody(updateProductSchema, req.body);

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', id as string)
      .eq('company_id', req.user.company_id)
      .select()
      .single();

    if (error) throw error;
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    return res.status(200).json(product);
  } catch (error: any) {
    const errorResponse = createErrorResponse(error);
    return res.status(errorResponse.status).json(errorResponse.json);
  }
}

async function deleteProduct(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    const { error } = await supabaseAdmin
      .from('products')
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
      await getProduct(req, res);
      break;
    case 'PUT':
      await updateProduct(req, res);
      break;
    case 'DELETE':
      await deleteProduct(req, res);
      break;
    default:
      res.status(405).json({ error: 'Méthode non autorisée' });
  }
};

// Exporter avec withAuth
export default withAuth(handler);