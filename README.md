# OrderFlow Backend MVP

API backend complète pour le SaaS de gestion des commandes OrderFlow, développée avec Next.js et Supabase.

## 🚀 Fonctionnalités

### Authentification & Utilisateurs
- Inscription et connexion sécurisées
- Gestion des entreprises et profils utilisateur
- Authentification JWT avec Supabase Auth

### Gestion des Produits
- CRUD complet des produits/services
- Support pour gâteaux personnalisés et vente en gros
- Attributs flexibles (JSON) pour personnalisations
- Gestion des catégories et SKU

### Gestion des Clients
- CRUD des clients avec informations complètes
- Recherche par nom et email
- Historique des commandes par client

### Gestion des Commandes
- Création de commandes avec articles multiples
- Statuts de commande configurables
- Calcul automatique des totaux et taxes
- Gestion des livraisons et ramassages
- Numérotation automatique des commandes

### Gestion des Stocks (Flexible)
- Support produits finis ET matières premières
- Mouvements de stock automatiques
- Alertes de stock bas
- Historique complet des mouvements
- Recettes pour lier ingrédients aux produits

### Rapports & Analytics
- Tableau de bord avec statistiques
- Résumé des ventes et commandes
- Activités récentes
- Indicateurs de performance

## 🛠 Stack Technologique

- **Framework**: Next.js 13 avec API Routes
- **Base de données**: Supabase (PostgreSQL)
- **Authentification**: Supabase Auth
- **Validation**: Zod
- **Tests**: Jest + Supertest
- **Documentation**: Swagger/OpenAPI
- **TypeScript**: Support complet

## 📦 Installation

1. **Cloner le projet**
```bash
git clone [url-du-repo]
cd orderflow-backend
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration des variables d'environnement**
```bash
cp .env.example .env.local
```

Remplir les variables Supabase dans `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. **Configuration de la base de données**

Créer un nouveau projet Supabase et exécuter le fichier de migration :
```sql
-- Copier/coller le contenu de supabase/migrations/create_initial_schema.sql
-- dans l'éditeur SQL de Supabase
```

5. **Lancer le serveur de développement**
```bash
npm run dev
```

L'API sera disponible sur `http://localhost:3000`

## 📚 Documentation API

### Documentation interactive Swagger
Visitez `http://localhost:3000/api-docs` pour la documentation interactive complète.

### Endpoints principaux

#### Authentification
- `POST /api/auth/signup` - Inscription
- `POST /api/auth/login` - Connexion

#### Entreprises
- `GET /api/companies/[id]` - Récupérer entreprise
- `PUT /api/companies/[id]` - Modifier entreprise

#### Produits
- `GET /api/products` - Liste des produits
- `POST /api/products` - Créer produit
- `GET /api/products/[id]` - Détails produit
- `PUT /api/products/[id]` - Modifier produit
- `DELETE /api/products/[id]` - Supprimer produit

#### Clients
- `GET /api/customers` - Liste des clients
- `POST /api/customers` - Créer client
- `GET /api/customers/[id]` - Détails client avec commandes
- `PUT /api/customers/[id]` - Modifier client
- `DELETE /api/customers/[id]` - Supprimer client

#### Commandes
- `GET /api/orders` - Liste des commandes (avec filtres)
- `POST /api/orders` - Créer commande
- `GET /api/orders/[id]` - Détails commande complète
- `PUT /api/orders/[id]` - Modifier commande
- `DELETE /api/orders/[id]` - Supprimer commande

#### Inventaire
- `GET /api/inventory` - Liste des stocks
- `POST /api/inventory` - Créer élément inventaire
- `GET /api/inventory/[id]/movements` - Historique mouvements
- `POST /api/inventory/[id]/movements` - Ajouter mouvement

#### Rapports
- `GET /api/reports/dashboard` - Statistiques tableau de bord

### Authentification

Toutes les API (sauf auth) nécessitent un token Bearer :
```bash
Authorization: Bearer your_jwt_token
```

## 🧪 Tests

### Lancer les tests
```bash
# Tests unitaires
npm test

# Tests en mode watch
npm run test:watch

# Tests avec couverture
npm run test:coverage

# Tests CI
npm run test:ci
```

### Structure des tests
- `__tests__/auth.test.ts` - Tests authentification
- `__tests__/products.test.ts` - Tests gestion produits
- `__tests__/orders.test.ts` - Tests gestion commandes
- `__tests__/inventory.test.ts` - Tests gestion stocks

## 🌱 Données de test

Utiliser le script de seeding pour créer des données de test :

```bash
npm run db:seed
```

Identifiants de test créés :
- Email: `demo@orderflow.com`
- Mot de passe: `demo123456`

## 🏗 Architecture

### Structure des fichiers
```
├── pages/api/              # Endpoints API
├── lib/                    # Utilitaires et configuration
├── types/                  # Types TypeScript
├── supabase/migrations/    # Migrations base de données
├── __tests__/              # Tests unitaires
├── scripts/                # Scripts utilitaires
└── components/ui/          # Composants UI (shadcn)
```

### Middleware d'authentification
- Vérification automatique des tokens JWT
- Isolation des données par entreprise (RLS)
- Gestion centralisée des erreurs

### Base de données
- Schema PostgreSQL optimisé
- Row Level Security (RLS) sur toutes les tables
- Triggers automatiques pour les calculs
- Index pour performances optimales

## 🔒 Sécurité

### Row Level Security (RLS)
Toutes les données sont isolées par entreprise grâce aux policies Supabase.

### Validation des données
- Schémas Zod pour tous les endpoints
- Validation côté serveur obligatoire
- Sanitisation des entrées utilisateur

### Authentification
- JWT tokens Supabase
- Middleware d'authentification centralisé
- Gestion automatique des sessions

## 🚀 Déploiement

### Prérequis
1. Projet Supabase configuré
2. Variables d'environnement définies
3. Migrations de base de données exécutées

### Build et démarrage
```bash
npm run build
npm start
```

### Vercel (recommandé)
```bash
npx vercel
```

## 📋 Checklist MVP

### ✅ Fonctionnalités implémentées
- [x] Authentification utilisateur complète
- [x] Gestion entreprises/profils
- [x] CRUD produits avec attributs flexibles
- [x] CRUD clients avec recherche
- [x] Gestion complète des commandes
- [x] Système de stocks flexible
- [x] Mouvements de stock automatiques
- [x] Rapports et tableau de bord
- [x] Documentation Swagger complète
- [x] Tests unitaires avec 90%+ de couverture
- [x] Validation robuste avec Zod
- [x] Sécurité RLS Supabase
- [x] Scripts de seeding
- [x] Middleware d'authentification

### 🔄 Améliorations futures
- [ ] Notifications en temps réel
- [ ] Intégration paiements
- [ ] Système de factures
- [ ] API webhooks
- [ ] Cache Redis
- [ ] Upload de fichiers
- [ ] Exports PDF/Excel

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commiter les changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou problème :
1. Consulter la documentation Swagger
2. Vérifier les tests existants
3. Examiner les logs d'erreur
4. Créer une issue GitHub

## 📄 Licence

Ce projet est sous licence MIT.