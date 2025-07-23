import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { updateCompanySchema } from '@/lib/validations';
import { withAuth, createErrorResponse, validateRequestBody, AuthenticatedRequest } from '@/lib/middleware';

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Récupérer les informations d'une entreprise
 *     tags: [Companies]
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
 *         description: Informations de l'entreprise
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *   put:
 *     summary: Mettre à jour une entreprise
 *     tags: [Companies]
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
 *             $ref: '#/components/schemas/UpdateCompany'
 *     responses:
 *       200:
 *         description: Entreprise mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 */

async function getCompany(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', id as string)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    return res.status(200).json(company);
  } catch (error: any) {
    const errorResponse = createErrorResponse(error);
    return res.status(errorResponse.status).json(errorResponse.json);
  }
}

async function updateCompany(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const updateData = validateRequestBody(updateCompanySchema, req.body);

    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .update(updateData)
      .eq('id', id as string)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    return res.status(200).json(company);
  } catch (error: any) {
    const errorResponse = createErrorResponse(error);
    return res.status(errorResponse.status).json(errorResponse.json);
  }
}

// Définir le handler principal
const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET':
      await getCompany(req, res);
      break;
    case 'PUT':
      await updateCompany(req, res);
      break;
    default:
      res.status(405).json({ error: 'Méthode non autorisée' });
  }
};

// Exporter avec withAuth
export default withAuth(handler);
