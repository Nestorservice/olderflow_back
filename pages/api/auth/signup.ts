import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { createCompanySchema } from '@/lib/validations';
import { createErrorResponse, validateRequestBody } from '@/lib/middleware';

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur avec création d'entreprise
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
 *               - company_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               company_name:
 *                 type: string
 *                 example: Ma Pâtisserie
 *               company_email:
 *                 type: string
 *                 format: email
 *                 example: contact@mapatisserie.fr
 *               company_phone:
 *                 type: string
 *                 example: "+33 1 23 45 67 89"
 *               company_address:
 *                 type: string
 *                 example: "123 rue de la Paix, 75001 Paris"
 *               business_type:
 *                 type: string
 *                 enum: [custom_orders, wholesale]
 *                 default: custom_orders
 *               inventory_management:
 *                 type: boolean
 *                 default: false
 *               inventory_type:
 *                 type: string
 *                 enum: [finished_products, raw_materials]
 *                 default: finished_products
 *     responses:
 *       201:
 *         description: Inscription réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
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
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Email déjà utilisé
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { email, password, company_name, ...companyData } = req.body;

    if (!email || !password || !company_name) {
      return res.status(400).json({
        error: 'Email, mot de passe et nom d\'entreprise sont requis'
      });
    }

    // Créer l'utilisateur
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(409).json({ error: 'Cet email est déjà utilisé' });
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Échec de la création de l\'utilisateur');
    }

    // Valider et créer l'entreprise
    const companyInfo = validateRequestBody(createCompanySchema, {
      name: company_name,
      email: companyData.company_email,
      phone: companyData.company_phone,
      address: companyData.company_address,
      business_type: companyData.business_type,
      inventory_management: companyData.inventory_management,
      inventory_type: companyData.inventory_type,
    });

    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        user_id: authData.user.id,
        ...companyInfo
      })
      .select()
      .single();

    if (companyError) {
      // Supprimer l'utilisateur si la création de l'entreprise échoue
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw companyError;
    }

    return res.status(201).json({
      user: {
        id: authData.user.id,
        email: authData.user.email
      },
      company: {
        id: company.id,
        name: company.name,
        business_type: company.business_type
      }
    });

  } catch (error: any) {
    const errorResponse = createErrorResponse(error, 400);
    return res.status(errorResponse.status).json(errorResponse.json);
  }
}