import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
    email: string;
    company_id: string;
  };
}

export function withAuth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      console.log('withAuth: Vérification de l\'authentification');
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('withAuth: Token manquant');
        return res.status(401).json({ error: 'Token d\'authentification manquant' });
      }

      const token = authHeader.split(' ')[1];
      console.log('withAuth: Token reçu:', token);

      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      console.log('withAuth: Résultat de getUser:', { user, authError });

      if (authError || !user) {
        console.log('withAuth: Token invalide');
        return res.status(401).json({ error: 'Token d\'authentification invalide' });
      }

      const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();
      console.log('withAuth: Résultat de la requête company:', { company, companyError });

      if (companyError || !company) {
        console.log('withAuth: Entreprise non trouvée');
        return res.status(403).json({ error: 'Entreprise non trouvée' });
      }

      (req as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email!,
        company_id: company.id,
      };

      console.log('withAuth: Utilisateur authentifié, exécution du handler');
      return await handler(req as AuthenticatedRequest, res);
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  };
}

export function createErrorResponse(error: any, statusCode: number = 500) {
  console.error('API Error:', error);
  if (error.code === 'PGRST116') {
    return {
      status: 404,
      json: { error: 'Ressource non trouvée' },
    };
  }
  if (error.code?.startsWith('23')) {
    return {
      status: 400,
      json: { error: 'Violation de contrainte de base de données', details: error.message },
    };
  }
  return {
    status: statusCode,
    json: { error: error.message || 'Erreur interne du serveur' },
  };
}

export function validateRequestBody(schema: any, body: any) {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new Error(
      `Données invalides: ${result.error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
    );
  }
  return result.data;
}