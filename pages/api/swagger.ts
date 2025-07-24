import { NextApiRequest, NextApiResponse } from 'next';
import openapiSpec from '@/public/openapi.json';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ajouter les en-têtes CORS manuellement
  res.setHeader('Access-Control-Allow-Origin', '*'); // Remplacez par l'URL de votre frontend si connue
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(openapiSpec);
}
