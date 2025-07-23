/**
 * Script de données de test pour OrderFlow
 * 
 * Ce script permet d'insérer des données de test dans la base de données
 * pour faciliter le développement et les tests.
 * 
 * Usage: node scripts/seed.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDatabase() {
  try {
    console.log('🌱 Début du seeding de la base de données...');

    // 1. Créer un utilisateur de test
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'demo@orderflow.com',
      password: 'demo123456',
      email_confirm: true
    });

    if (authError && !authError.message.includes('already registered')) {
      throw authError;
    }

    let userId;
    if (authUser?.user) {
      userId = authUser.user.id;
      console.log('✅ Utilisateur créé:', authUser.user.email);
    } else {
      // Récupérer l'utilisateur existant
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const demoUser = existingUser.users.find(u => u.email === 'demo@orderflow.com');
      if (demoUser) {
        userId = demoUser.id;
        console.log('✅ Utilisateur existant trouvé:', demoUser.email);
      }
    }

    if (!userId) {
      throw new Error('Impossible de créer ou récupérer l\'utilisateur demo');
    }

    // 2. Créer une entreprise
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .upsert({
        user_id: userId,
        name: 'Pâtisserie Demo',
        email: 'contact@patisserie-demo.fr',
        phone: '+33 1 23 45 67 89',
        address: '123 rue de la Gourmandise, 75001 Paris',
        business_type: 'custom_orders',
        inventory_management: true,
        inventory_type: 'raw_materials',
        currency: 'EUR',
        timezone: 'Europe/Paris'
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (companyError) throw companyError;
    console.log('✅ Entreprise créée:', company.name);

    // 3. Créer des produits
    const products = [
      {
        name: 'Gâteau au Chocolat',
        description: 'Délicieux gâteau au chocolat noir avec ganache',
        price: 25.99,
        sku: 'GAT-CHOC-001',
        category: 'gateaux',
        attributes: {
          taille: 'Moyen (6-8 personnes)',
          saveur: 'Chocolat noir',
          decorations: 'Ganache et copeaux de chocolat'
        },
        track_inventory: true,
        stock_quantity: 5,
        min_stock_level: 2
      },
      {
        name: 'Tarte aux Fruits',
        description: 'Tarte saisonnière aux fruits frais',
        price: 18.50,
        sku: 'TAR-FRUI-001',
        category: 'tartes',
        attributes: {
          taille: 'Standard (6 personnes)',
          fruits: 'Selon saison',
          pate: 'Pâte sablée'
        },
        track_inventory: true,
        stock_quantity: 8,
        min_stock_level: 3
      },
      {
        name: 'Croissant',
        description: 'Croissant artisanal au beurre',
        price: 1.20,
        sku: 'VIEN-CROI-001',
        category: 'viennoiserie',
        unit: 'pièce',
        track_inventory: true,
        stock_quantity: 50,
        min_stock_level: 20
      }
    ];

    const { data: createdProducts, error: productsError } = await supabase
      .from('products')
      .upsert(products.map(p => ({ ...p, company_id: company.id })), { onConflict: 'company_id,sku' })
      .select();

    if (productsError) throw productsError;
    console.log('✅ Produits créés:', createdProducts.length);

    // 4. Créer des clients
    const customers = [
      {
        name: 'Marie Dupont',
        email: 'marie.dupont@email.com',
        phone: '+33 6 12 34 56 78',
        address: '45 avenue des Roses',
        city: 'Paris',
        postal_code: '75015',
        country: 'France',
        notes: 'Cliente fidèle, préfère les commandes personnalisées'
      },
      {
        name: 'Restaurant Le Petit Coin',
        email: 'commandes@lepetitcoin.fr',
        phone: '+33 1 42 86 95 74',
        address: '12 rue de la Paix',
        city: 'Paris',
        postal_code: '75002',
        country: 'France',
        notes: 'Commandes régulières pour desserts du restaurant'
      },
      {
        name: 'Sophie Martin',
        email: 'sophie.martin@gmail.com',
        phone: '+33 6 98 76 54 32',
        address: '78 boulevard Saint-Germain',
        city: 'Paris',
        postal_code: '75005',
        country: 'France'
      }
    ];

    const { data: createdCustomers, error: customersError } = await supabase
      .from('customers')
      .upsert(customers.map(c => ({ ...c, company_id: company.id })), { onConflict: 'company_id,email' })
      .select();

    if (customersError) throw customersError;
    console.log('✅ Clients créés:', createdCustomers.length);

    // 5. Créer des éléments d'inventaire (ingrédients)
    const inventory = [
      {
        name: 'Farine de blé T55',
        type: 'raw_material',
        unit: 'kg',
        current_stock: 25.5,
        min_stock_level: 5,
        max_stock_level: 50,
        cost_per_unit: 1.20,
        supplier: 'Minoterie Dupont',
        location: 'Réserve principale'
      },
      {
        name: 'Chocolat noir 70%',
        type: 'raw_material',
        unit: 'kg',
        current_stock: 3.2,
        min_stock_level: 1,
        max_stock_level: 10,
        cost_per_unit: 12.50,
        supplier: 'Chocolaterie Martin',
        location: 'Réfrigérateur'
      },
      {
        name: 'Beurre AOP',
        type: 'raw_material',
        unit: 'kg',
        current_stock: 8.7,
        min_stock_level: 2,
        max_stock_level: 15,
        cost_per_unit: 6.80,
        supplier: 'Laiterie Durand',
        location: 'Réfrigérateur'
      },
      {
        name: 'Œufs fermiers',
        type: 'raw_material',
        unit: 'douzaine',
        current_stock: 15,
        min_stock_level: 5,
        max_stock_level: 30,
        cost_per_unit: 4.50,
        supplier: 'Ferme des Prés Verts',
        location: 'Réfrigérateur'
      }
    ];

    const { data: createdInventory, error: inventoryError } = await supabase
      .from('inventory')
      .upsert(inventory.map(i => ({ ...i, company_id: company.id })), { onConflict: 'company_id,name' })
      .select();

    if (inventoryError) throw inventoryError;
    console.log('✅ Inventaire créé:', createdInventory.length, 'éléments');

    // 6. Créer des commandes d'exemple
    const orders = [
      {
        customer_id: createdCustomers[0].id,
        status: 'confirmed',
        order_date: '2024-01-15',
        due_date: '2024-01-18',
        delivery_method: 'delivery',
        delivery_address: '45 avenue des Roses, 75015 Paris',
        tax_rate: 20,
        notes: 'Commande pour anniversaire',
        special_instructions: 'Écriture "Joyeux anniversaire Sophie" en chocolat'
      },
      {
        customer_id: createdCustomers[1].id,
        status: 'in_production',
        order_date: '2024-01-16',
        due_date: '2024-01-17',
        delivery_method: 'pickup',
        tax_rate: 20,
        notes: 'Commande hebdomadaire restaurant'
      },
      {
        customer_id: createdCustomers[2].id,
        status: 'pending',
        order_date: '2024-01-17',
        due_date: '2024-01-20',
        delivery_method: 'delivery',
        delivery_address: '78 boulevard Saint-Germain, 75005 Paris',
        tax_rate: 20,
        discount: 5.00,
        notes: 'Première commande - remise fidélité'
      }
    ];

    const createdOrders = [];
    for (const orderData of orders) {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({ ...orderData, company_id: company.id })
        .select()
        .single();

      if (orderError) throw orderError;
      createdOrders.push(order);
    }

    console.log('✅ Commandes créées:', createdOrders.length);

    // 7. Créer des articles de commande
    const orderItems = [
      // Commande 1
      {
        order_id: createdOrders[0].id,
        product_id: createdProducts[0].id,
        quantity: 1,
        unit_price: 25.99,
        line_total: 25.99,
        customizations: {
          message: 'Joyeux anniversaire Sophie',
          couleur_ecriture: 'Chocolat blanc'
        },
        notes: 'Gâteau personnalisé'
      },
      // Commande 2
      {
        order_id: createdOrders[1].id,
        product_id: createdProducts[1].id,
        quantity: 3,
        unit_price: 18.50,
        line_total: 55.50
      },
      {
        order_id: createdOrders[1].id,
        product_id: createdProducts[2].id,
        quantity: 24,
        unit_price: 1.20,
        line_total: 28.80
      },
      // Commande 3
      {
        order_id: createdOrders[2].id,
        product_id: createdProducts[0].id,
        quantity: 1,
        unit_price: 25.99,
        line_total: 25.99
      },
      {
        order_id: createdOrders[2].id,
        product_id: createdProducts[1].id,
        quantity: 1,
        unit_price: 18.50,
        line_total: 18.50
      }
    ];

    const { data: createdOrderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (orderItemsError) throw orderItemsError;
    console.log('✅ Articles de commande créés:', orderItems.length);

    // 8. Créer des mouvements de stock
    const stockMovements = [
      {
        inventory_id: createdInventory[0].id, // Farine
        type: 'in',
        quantity: 50,
        unit_cost: 1.20,
        reference: 'BON-2024-001',
        reason: 'Livraison fournisseur - Minoterie Dupont',
        created_at: '2024-01-10T09:00:00Z'
      },
      {
        inventory_id: createdInventory[1].id, // Chocolat
        type: 'in',
        quantity: 10,
        unit_cost: 12.50,
        reference: 'BON-2024-002',
        reason: 'Livraison fournisseur - Chocolaterie Martin',
        created_at: '2024-01-12T14:30:00Z'
      },
      {
        inventory_id: createdInventory[0].id, // Farine
        type: 'out',
        quantity: 24.5,
        reason: 'Utilisation production',
        created_at: '2024-01-15T08:00:00Z'
      },
      {
        inventory_id: createdInventory[1].id, // Chocolat
        type: 'out',
        quantity: 6.8,
        reason: 'Utilisation production gâteaux chocolat',
        created_at: '2024-01-15T10:30:00Z'
      }
    ];

    const { data: createdMovements, error: movementsError } = await supabase
      .from('stock_movements')
      .insert(stockMovements.map(m => ({ ...m, company_id: company.id })));

    if (movementsError) throw movementsError;
    console.log('✅ Mouvements de stock créés:', stockMovements.length);

    console.log('\n🎉 Seeding terminé avec succès !');
    console.log('\n📊 Résumé des données créées :');
    console.log(`- 1 entreprise : ${company.name}`);
    console.log(`- ${createdProducts.length} produits`);
    console.log(`- ${createdCustomers.length} clients`);
    console.log(`- ${createdInventory.length} éléments d\'inventaire`);
    console.log(`- ${createdOrders.length} commandes`);
    console.log(`- ${orderItems.length} articles de commande`);
    console.log(`- ${stockMovements.length} mouvements de stock`);

    console.log('\n🔐 Identifiants de test :');
    console.log('Email: demo@orderflow.com');
    console.log('Mot de passe: demo123456');

  } catch (error) {
    console.error('❌ Erreur lors du seeding :', error);
    process.exit(1);
  }
}

seedDatabase();