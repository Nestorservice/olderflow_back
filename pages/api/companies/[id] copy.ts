import { NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { updateCompanySchema } from '@/lib/validations';
import { withAuth, AuthenticatedRequest, createErrorResponse, validateRequestBody } from '@/lib/middleware';

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Récupérer les détails d'une entreprise
 *     description: Récupère les informations d'une entreprise spécifique par son ID, pour l'utilisateur authentifié.
 *     tags: [Companies]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'entreprise
 *     responses:
 *       200:
 *         description: Détails de l'entreprise
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 address:
 *                   type: string
 *       400:
 *         description: ID invalide
 *       401:
 *         description: Non autorisé (token manquant ou invalide)
 *       403:
 *         description: Entreprise non trouvée
 *       404:
 *         description: Ressource non trouvée
 *   put:
 *     summary: Mettre à jour une entreprise
 *     description: Met à jour les informations d'une entreprise spécifique par son ID, pour l'utilisateur authentifié.
 *     tags: [Companies]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'entreprise
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entreprise mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 address:
 *                   type: string
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Entreprise non trouvée
 *       404:
 *         description: Ressource non trouvée
 */
async function getCompany(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'ID invalide' });
    }
    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();
    if (error) throw error;
    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }
    res.status(200).json(company);
  } catch (error: any) {
    const { status, json } = createErrorResponse(error);
    res.status(status).json(json);
  }
}

async function updateCompany(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'ID invalide' });
    }
    const updateData = validateRequestBody(updateCompanySchema, req.body);
    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();
    if (error) throw error;
    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }
    res.status(200).json(company);
  } catch (error: any) {
    const { status, json } = createErrorResponse(error);
    res.status(status).json(json);
  }
}

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

export default withAuth(handler);