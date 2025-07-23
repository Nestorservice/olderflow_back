import { NextApiRequest, NextApiResponse } from 'next';
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OrderFlow API',
      version: '1.0.0',
      description: 'API complète pour le SaaS de gestion des commandes OrderFlow',
      contact: {
        name: 'Support OrderFlow',
        email: 'support@orderflow.com'
      }
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        description: 'Serveur de développement'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Entrez le token JWT obtenu lors de la connexion (sans le préfixe "Bearer")'
        }
      },
      schemas: {
        Company: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            business_type: { type: 'string', enum: ['custom_orders', 'wholesale'] },
            inventory_management: { type: 'boolean' },
            inventory_type: { type: 'string', enum: ['finished_products', 'raw_materials'] },
            currency: { type: 'string' },
            timezone: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        UpdateCompany: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            business_type: { type: 'string', enum: ['custom_orders', 'wholesale'] },
            inventory_management: { type: 'boolean' },
            inventory_type: { type: 'string', enum: ['finished_products', 'raw_materials'] },
            currency: { type: 'string' },
            timezone: { type: 'string' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            company_id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            sku: { type: 'string' },
            unit: { type: 'string' },
            category: { type: 'string' },
            attributes: { type: 'object' },
            track_inventory: { type: 'boolean' },
            stock_quantity: { type: 'integer' },
            min_stock_level: { type: 'integer' },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateProduct: {
          type: 'object',
          required: ['name', 'price'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number', minimum: 0 },
            sku: { type: 'string' },
            unit: { type: 'string' },
            category: { type: 'string' },
            attributes: { type: 'object' },
            track_inventory: { type: 'boolean' },
            stock_quantity: { type: 'integer', minimum: 0 },
            min_stock_level: { type: 'integer', minimum: 0 },
            is_active: { type: 'boolean' }
          }
        },
        UpdateProduct: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number', minimum: 0 },
            sku: { type: 'string' },
            unit: { type: 'string' },
            category: { type: 'string' },
            attributes: { type: 'object' },
            track_inventory: { type: 'boolean' },
            stock_quantity: { type: 'integer', minimum: 0 },
            min_stock_level: { type: 'integer', minimum: 0 },
            is_active: { type: 'boolean' }
          }
        },
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            company_id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
            postal_code: { type: 'string' },
            country: { type: 'string' },
            notes: { type: 'string' },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateCustomer: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
            postal_code: { type: 'string' },
            country: { type: 'string' },
            notes: { type: 'string' },
            is_active: { type: 'boolean' }
          }
        },
        UpdateCustomer: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
            postal_code: { type: 'string' },
            country: { type: 'string' },
            notes: { type: 'string' },
            is_active: { type: 'boolean' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            company_id: { type: 'string', format: 'uuid' },
            customer_id: { type: 'string', format: 'uuid' },
            order_number: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['draft', 'pending', 'confirmed', 'in_production', 'ready', 'delivered', 'completed', 'cancelled'] 
            },
            order_date: { type: 'string', format: 'date' },
            due_date: { type: 'string', format: 'date' },
            delivery_date: { type: 'string', format: 'date' },
            delivery_address: { type: 'string' },
            delivery_method: { type: 'string', enum: ['delivery', 'pickup'] },
            subtotal: { type: 'number' },
            discount: { type: 'number' },
            tax_rate: { type: 'number' },
            tax_amount: { type: 'number' },
            total: { type: 'number' },
            notes: { type: 'string' },
            special_instructions: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateOrder: {
          type: 'object',
          required: ['customer_id', 'items'],
          properties: {
            customer_id: { type: 'string', format: 'uuid' },
            order_date: { type: 'string', format: 'date' },
            due_date: { type: 'string', format: 'date' },
            delivery_date: { type: 'string', format: 'date' },
            delivery_address: { type: 'string' },
            delivery_method: { type: 'string', enum: ['delivery', 'pickup'] },
            discount: { type: 'number', minimum: 0 },
            tax_rate: { type: 'number', minimum: 0, maximum: 100 },
            notes: { type: 'string' },
            special_instructions: { type: 'string' },
            items: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['product_id', 'quantity', 'unit_price'],
                properties: {
                  product_id: { type: 'string', format: 'uuid' },
                  quantity: { type: 'integer', minimum: 1 },
                  unit_price: { type: 'number', minimum: 0 },
                  discount: { type: 'number', minimum: 0 },
                  customizations: { type: 'object' },
                  notes: { type: 'string' }
                }
              }
            }
          }
        },
        UpdateOrder: {
          type: 'object',
          properties: {
            customer_id: { type: 'string', format: 'uuid' },
            status: { 
              type: 'string', 
              enum: ['draft', 'pending', 'confirmed', 'in_production', 'ready', 'delivered', 'completed', 'cancelled'] 
            },
            order_date: { type: 'string', format: 'date' },
            due_date: { type: 'string', format: 'date' },
            delivery_date: { type: 'string', format: 'date' },
            delivery_address: { type: 'string' },
            delivery_method: { type: 'string', enum: ['delivery', 'pickup'] },
            discount: { type: 'number', minimum: 0 },
            tax_rate: { type: 'number', minimum: 0, maximum: 100 },
            notes: { type: 'string' },
            special_instructions: { type: 'string' }
          }
        },
        OrderWithCustomer: {
          allOf: [
            { $ref: '#/components/schemas/Order' },
            {
              type: 'object',
              properties: {
                customers: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' }
                  }
                }
              }
            }
          ]
        },
        OrderWithItems: {
          allOf: [
            { $ref: '#/components/schemas/OrderWithCustomer' },
            {
              type: 'object',
              properties: {
                order_items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      product_id: { type: 'string', format: 'uuid' },
                      quantity: { type: 'integer' },
                      unit_price: { type: 'number' },
                      discount: { type: 'number' },
                      line_total: { type: 'number' },
                      customizations: { type: 'object' },
                      notes: { type: 'string' },
                      products: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          name: { type: 'string' },
                          unit: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          ]
        },
        Inventory: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            company_id: { type: 'string', format: 'uuid' },
            product_id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['finished_product', 'raw_material'] },
            unit: { type: 'string' },
            current_stock: { type: 'number' },
            min_stock_level: { type: 'number' },
            max_stock_level: { type: 'number' },
            cost_per_unit: { type: 'number' },
            supplier: { type: 'string' },
            location: { type: 'string' },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateInventory: {
          type: 'object',
          required: ['name', 'type'],
          properties: {
            product_id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['finished_product', 'raw_material'] },
            unit: { type: 'string' },
            current_stock: { type: 'number', minimum: 0 },
            min_stock_level: { type: 'number', minimum: 0 },
            max_stock_level: { type: 'number', minimum: 0 },
            cost_per_unit: { type: 'number', minimum: 0 },
            supplier: { type: 'string' },
            location: { type: 'string' },
            is_active: { type: 'boolean' }
          }
        },
        StockMovement: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            company_id: { type: 'string', format: 'uuid' },
            inventory_id: { type: 'string', format: 'uuid' },
            order_id: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['in', 'out', 'adjustment'] },
            quantity: { type: 'number' },
            unit_cost: { type: 'number' },
            reference: { type: 'string' },
            reason: { type: 'string' },
            notes: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./pages/api/**/*.ts'], // Chemins vers les fichiers API
};

const specs = swaggerJsdoc(options);

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(specs);
}