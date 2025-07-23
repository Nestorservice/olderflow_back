import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { createErrorResponse } from '@/lib/middleware';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 refresh_token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                 company:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *       401:
 *         description: Identifiants invalides
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe sont requis' });
    }

    // Authentifier avec Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      console.error('Erreur de connexion:', authError);
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    if (!authData.session) {
      return res.status(401).json({ error: 'Session non créée' });
    }

    // Récupérer les informations de l'entreprise
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name, business_type, inventory_management')
      .eq('user_id', authData.user.id)
      .single();

    if (companyError || !company) {
      console.error('Erreur entreprise:', companyError);
      return res.status(403).json({ error: 'Entreprise non trouvée' });
    }

    return res.status(200).json({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      user: {
        id: authData.user.id,
        email: authData.user.email
      },
      company: {
        id: company.id,
        name: company.name,
        business_type: company.business_type,
        inventory_management: company.inventory_management
      }
    });

  } catch (error: any) {
    const errorResponse = createErrorResponse(error, 500);
    return res.status(errorResponse.status).json(errorResponse.json);
  }
}
