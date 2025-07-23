import { z } from 'zod';

// Company schemas
export const createCompanySchema = z.object({
  name: z.string().min(1, 'Le nom de l\'entreprise est requis'),
  email: z.string().email('Email invalide').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  business_type: z.enum(['custom_orders', 'wholesale']).default('custom_orders'),
  inventory_management: z.boolean().default(false),
  inventory_type: z.enum(['finished_products', 'raw_materials']).default('finished_products'),
  currency: z.string().default('EUR'),
  timezone: z.string().default('Europe/Paris'),
});

export const updateCompanySchema = createCompanySchema.partial();

// Product schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Le nom du produit est requis'),
  description: z.string().default(''),
  price: z.number().min(0, 'Le prix doit être positif'),
  sku: z.string().optional(),
  unit: z.string().default('pièce'),
  category: z.string().default('general'),
  attributes: z.record(z.any()).default({}),
  track_inventory: z.boolean().default(false),
  stock_quantity: z.number().int().min(0).default(0),
  min_stock_level: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

// Customer schemas
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Le nom du client est requis'),
  email: z.string().email('Email invalide').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().default('France'),
  notes: z.string().default(''),
  is_active: z.boolean().default(true),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// Order schemas
export const createOrderSchema = z.object({
  customer_id: z.string().uuid('ID client invalide'),
  order_date: z.string().optional(),
  due_date: z.string().optional(),
  delivery_date: z.string().optional(),
  delivery_address: z.string().optional(),
  delivery_method: z.enum(['delivery', 'pickup']).default('pickup'),
  discount: z.number().min(0).default(0),
  tax_rate: z.number().min(0).max(100).default(0),
  notes: z.string().default(''),
  special_instructions: z.string().default(''),
  items: z.array(z.object({
    product_id: z.string().uuid('ID produit invalide'),
    quantity: z.number().int().min(1, 'La quantité doit être positive'),
    unit_price: z.number().min(0, 'Le prix unitaire doit être positif'),
    discount: z.number().min(0).default(0),
    customizations: z.record(z.any()).default({}),
    notes: z.string().default(''),
  })).min(1, 'Au moins un article est requis'),
});

export const updateOrderSchema = z.object({
  customer_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'pending', 'confirmed', 'in_production', 'ready', 'delivered', 'completed', 'cancelled']).optional(),
  order_date: z.string().optional(),
  due_date: z.string().optional(),
  delivery_date: z.string().optional(),
  delivery_address: z.string().optional(),
  delivery_method: z.enum(['delivery', 'pickup']).optional(),
  discount: z.number().min(0).optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  special_instructions: z.string().optional(),
});

// Order item schemas
export const createOrderItemSchema = z.object({
  product_id: z.string().uuid('ID produit invalide'),
  quantity: z.number().int().min(1, 'La quantité doit être positive'),
  unit_price: z.number().min(0, 'Le prix unitaire doit être positif'),
  discount: z.number().min(0).default(0),
  customizations: z.record(z.any()).default({}),
  notes: z.string().default(''),
});

// Inventory schemas
export const createInventorySchema = z.object({
  product_id: z.string().uuid().optional(),
  name: z.string().min(1, 'Le nom est requis'),
  type: z.enum(['finished_product', 'raw_material']),
  unit: z.string().default('pièce'),
  current_stock: z.number().min(0).default(0),
  min_stock_level: z.number().min(0).default(0),
  max_stock_level: z.number().min(0).optional(),
  cost_per_unit: z.number().min(0).default(0),
  supplier: z.string().optional(),
  location: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const updateInventorySchema = createInventorySchema.partial();

// Recipe schemas
export const createRecipeSchema = z.object({
  finished_product_id: z.string().uuid('ID produit invalide'),
  ingredient_id: z.string().uuid('ID ingrédient invalide'),
  quantity_needed: z.number().min(0, 'La quantité doit être positive'),
  unit: z.string().default('pièce'),
  notes: z.string().default(''),
});

// Stock movement schemas
export const createStockMovementSchema = z.object({
  inventory_id: z.string().uuid('ID inventaire invalide'),
  order_id: z.string().uuid().optional(),
  type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.number().min(0, 'La quantité doit être positive'),
  unit_cost: z.number().min(0).optional(),
  reference: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().default(''),
});

// Query schemas for filtering and pagination
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export const orderFilterSchema = z.object({
  status: z.enum(['draft', 'pending', 'confirmed', 'in_production', 'ready', 'delivered', 'completed', 'cancelled']).optional(),
  customer_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
}).merge(paginationSchema);

export const productFilterSchema = z.object({
  category: z.string().optional(),
  is_active: z.boolean().optional(),
  track_inventory: z.boolean().optional(),
}).merge(paginationSchema);

export const inventoryFilterSchema = z.object({
  type: z.enum(['finished_product', 'raw_material']).optional(),
  low_stock: z.boolean().optional(),
  is_active: z.boolean().optional(),
}).merge(paginationSchema);