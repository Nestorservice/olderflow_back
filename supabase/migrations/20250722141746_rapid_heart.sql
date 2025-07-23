/*
  # Schema Initial OrderFlow MVP

  1. Nouvelles Tables
    - `companies` - Profils des entreprises
    - `products` - Produits/services avec support gâteaux et vente en gros
    - `customers` - Clients des entreprises
    - `orders` - Commandes avec statuts et métadonnées
    - `order_items` - Articles des commandes avec quantités et prix
    - `inventory` - Gestion des stocks (produits finis et ingrédients)
    - `recipes` - Relations ingrédients/produits pour la gestion des stocks
    - `stock_movements` - Historique des mouvements de stock

  2. Sécurité
    - RLS activé sur toutes les tables
    - Policies pour isoler les données par entreprise
    - Authentification utilisateur requise
*/

-- Extension UUID pour les clés primaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des entreprises/profils utilisateur
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  business_type text CHECK (business_type IN ('custom_orders', 'wholesale')) DEFAULT 'custom_orders',
  inventory_management boolean DEFAULT false,
  inventory_type text CHECK (inventory_type IN ('finished_products', 'raw_materials')) DEFAULT 'finished_products',
  currency text DEFAULT 'EUR',
  timezone text DEFAULT 'Europe/Paris',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des produits/services
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  price decimal(10,2) NOT NULL DEFAULT 0,
  sku text,
  unit text DEFAULT 'pièce',
  category text DEFAULT 'general',
  -- Attributs spécifiques (JSON flexible)
  attributes jsonb DEFAULT '{}',
  -- Gestion stock
  track_inventory boolean DEFAULT false,
  stock_quantity integer DEFAULT 0,
  min_stock_level integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour la recherche rapide
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku) WHERE sku IS NOT NULL;

-- Table des clients
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  postal_code text,
  country text DEFAULT 'France',
  notes text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email) WHERE email IS NOT NULL;

-- Table des commandes
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  order_number text NOT NULL,
  status text CHECK (status IN (
    'draft', 'pending', 'confirmed', 'in_production', 
    'ready', 'delivered', 'completed', 'cancelled'
  )) DEFAULT 'draft',
  order_date date DEFAULT CURRENT_DATE,
  due_date date,
  delivery_date date,
  delivery_address text,
  delivery_method text CHECK (delivery_method IN ('delivery', 'pickup')) DEFAULT 'pickup',
  subtotal decimal(10,2) DEFAULT 0,
  discount decimal(10,2) DEFAULT 0,
  tax_rate decimal(5,2) DEFAULT 0,
  tax_amount decimal(10,2) DEFAULT 0,
  total decimal(10,2) DEFAULT 0,
  notes text DEFAULT '',
  special_instructions text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index et contrainte unique pour le numéro de commande par entreprise
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_company_number ON orders(company_id, order_number);
CREATE INDEX IF NOT EXISTS idx_orders_company_id ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);

-- Table des articles de commande
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL,
  discount decimal(10,2) DEFAULT 0,
  line_total decimal(10,2) NOT NULL,
  customizations jsonb DEFAULT '{}',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Table pour la gestion des stocks/ingrédients
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text CHECK (type IN ('finished_product', 'raw_material')) NOT NULL,
  unit text DEFAULT 'pièce',
  current_stock decimal(10,3) DEFAULT 0,
  min_stock_level decimal(10,3) DEFAULT 0,
  max_stock_level decimal(10,3),
  cost_per_unit decimal(10,4) DEFAULT 0,
  supplier text,
  location text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_company_id ON inventory(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_type ON inventory(type);

-- Table des recettes (relation ingrédients -> produits finis)
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  finished_product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  ingredient_id uuid REFERENCES inventory(id) ON DELETE CASCADE NOT NULL,
  quantity_needed decimal(10,3) NOT NULL,
  unit text DEFAULT 'pièce',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipes_company_id ON recipes(company_id);
CREATE INDEX IF NOT EXISTS idx_recipes_product_id ON recipes(finished_product_id);
CREATE INDEX IF NOT EXISTS idx_recipes_ingredient_id ON recipes(ingredient_id);

-- Table des mouvements de stock
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  inventory_id uuid REFERENCES inventory(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  type text CHECK (type IN ('in', 'out', 'adjustment')) NOT NULL,
  quantity decimal(10,3) NOT NULL,
  unit_cost decimal(10,4),
  reference text,
  reason text,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_company_id ON stock_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory_id ON stock_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_order_id ON stock_movements(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);

-- Fonction pour générer automatiquement les numéros de commande
CREATE OR REPLACE FUNCTION generate_order_number(company_id_param uuid)
RETURNS text AS $$
DECLARE
  next_number integer;
  order_number text;
BEGIN
  -- Obtenir le prochain numéro pour cette entreprise
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '\d+$') AS integer)), 0) + 1
  INTO next_number
  FROM orders 
  WHERE company_id = company_id_param;
  
  -- Formater le numéro de commande
  order_number := 'ORD-' || LPAD(next_number::text, 6, '0');
  
  RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement le numéro de commande
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number(NEW.company_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Fonction pour mettre à jour automatiquement les totaux des commandes
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders 
  SET 
    subtotal = (
      SELECT COALESCE(SUM(line_total - discount), 0)
      FROM order_items 
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  -- Recalculer le total avec taxes
  UPDATE orders 
  SET 
    tax_amount = subtotal * (tax_rate / 100),
    total = subtotal - discount + (subtotal * (tax_rate / 100))
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_totals
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_totals();

-- Fonction pour gérer automatiquement les mouvements de stock
CREATE OR REPLACE FUNCTION manage_inventory_on_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut passe à 'confirmed', décrémenter le stock des produits finis
  IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
    INSERT INTO stock_movements (company_id, inventory_id, order_id, type, quantity, reason)
    SELECT 
      NEW.company_id,
      i.id,
      NEW.id,
      'out',
      oi.quantity,
      'Order confirmed: ' || NEW.order_number
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN inventory i ON i.product_id = p.id AND i.type = 'finished_product'
    WHERE oi.order_id = NEW.id AND p.track_inventory = true;
    
    -- Mettre à jour les quantités en stock
    UPDATE inventory 
    SET current_stock = current_stock - movements.total_out
    FROM (
      SELECT 
        i.id as inventory_id,
        SUM(oi.quantity) as total_out
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN inventory i ON i.product_id = p.id AND i.type = 'finished_product'
      WHERE oi.order_id = NEW.id AND p.track_inventory = true
      GROUP BY i.id
    ) movements
    WHERE inventory.id = movements.inventory_id;
  END IF;
  
  -- Si le statut passe à 'in_production', décrémenter les ingrédients
  IF OLD.status != 'in_production' AND NEW.status = 'in_production' THEN
    INSERT INTO stock_movements (company_id, inventory_id, order_id, type, quantity, reason)
    SELECT 
      NEW.company_id,
      r.ingredient_id,
      NEW.id,
      'out',
      (oi.quantity * r.quantity_needed),
      'Production started: ' || NEW.order_number
    FROM order_items oi
    JOIN recipes r ON oi.product_id = r.finished_product_id
    WHERE oi.order_id = NEW.id;
    
    -- Mettre à jour les quantités d'ingrédients
    UPDATE inventory 
    SET current_stock = current_stock - movements.total_used
    FROM (
      SELECT 
        r.ingredient_id,
        SUM(oi.quantity * r.quantity_needed) as total_used
      FROM order_items oi
      JOIN recipes r ON oi.product_id = r.finished_product_id
      WHERE oi.order_id = NEW.id
      GROUP BY r.ingredient_id
    ) movements
    WHERE inventory.id = movements.ingredient_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_manage_inventory
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION manage_inventory_on_order_status_change();

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger updated_at sur toutes les tables pertinentes
CREATE TRIGGER trigger_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security sur toutes les tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Policies pour companies
CREATE POLICY "Users can manage their own company" ON companies
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies pour products
CREATE POLICY "Users can manage products of their company" ON products
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- Policies pour customers
CREATE POLICY "Users can manage customers of their company" ON customers
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- Policies pour orders
CREATE POLICY "Users can manage orders of their company" ON orders
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- Policies pour order_items
CREATE POLICY "Users can manage order items of their company" ON order_items
  FOR ALL TO authenticated
  USING (order_id IN (
    SELECT id FROM orders WHERE company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  ))
  WITH CHECK (order_id IN (
    SELECT id FROM orders WHERE company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  ));

-- Policies pour inventory
CREATE POLICY "Users can manage inventory of their company" ON inventory
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- Policies pour recipes
CREATE POLICY "Users can manage recipes of their company" ON recipes
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- Policies pour stock_movements
CREATE POLICY "Users can view stock movements of their company" ON stock_movements
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "System can insert stock movements" ON stock_movements
  FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));