'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Import dynamique pour éviter les erreurs SSR
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocs() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    fetch('/api/swagger')
      .then(response => response.json())
      .then(data => setSpec(data))
      .catch(error => console.error('Erreur lors du chargement de la spec Swagger:', error));
  }, []);

  if (!spec) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la documentation API...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-blue-600 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">OrderFlow API Documentation</h1>
          <p className="mt-2 text-blue-100">
            Documentation complète de l&apos;API OrderFlow - SaaS de gestion des commandes
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <SwaggerUI 
          spec={spec}
          docExpansion="list"
          defaultModelsExpandDepth={1}
          defaultModelExpandDepth={1}
          persistAuthorization={true}
        />
      </div>
    </div>
  );
}
