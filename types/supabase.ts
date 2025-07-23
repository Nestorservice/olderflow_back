export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          business_type: 'custom_orders' | 'wholesale'
          inventory_management: boolean
          inventory_type: 'finished_products' | 'raw_materials'
          currency: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          business_type?: 'custom_orders' | 'wholesale'
          inventory_management?: boolean
          inventory_type?: 'finished_products' | 'raw_materials'
          currency?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          business_type?: 'custom_orders' | 'wholesale'
          inventory_management?: boolean
          inventory_type?: 'finished_products' | 'raw_materials'
          currency?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string
          price: number
          sku: string | null
          unit: string
          category: string
          attributes: Json
          track_inventory: boolean
          stock_quantity: number
          min_stock_level: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string
          price?: number
          sku?: string | null
          unit?: string
          category?: string
          attributes?: Json
          track_inventory?: boolean
          stock_quantity?: number
          min_stock_level?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string
          price?: number
          sku?: string | null
          unit?: string
          category?: string
          attributes?: Json
          track_inventory?: boolean
          stock_quantity?: number
          min_stock_level?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          company_id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          country: string
          notes: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          notes?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          notes?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          company_id: string
          customer_id: string
          order_number: string
          status: 'draft' | 'pending' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'completed' | 'cancelled'
          order_date: string
          due_date: string | null
          delivery_date: string | null
          delivery_address: string | null
          delivery_method: 'delivery' | 'pickup'
          subtotal: number
          discount: number
          tax_rate: number
          tax_amount: number
          total: number
          notes: string
          special_instructions: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          customer_id: string
          order_number?: string
          status?: 'draft' | 'pending' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'completed' | 'cancelled'
          order_date?: string
          due_date?: string | null
          delivery_date?: string | null
          delivery_address?: string | null
          delivery_method?: 'delivery' | 'pickup'
          subtotal?: number
          discount?: number
          tax_rate?: number
          tax_amount?: number
          total?: number
          notes?: string
          special_instructions?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          customer_id?: string
          order_number?: string
          status?: 'draft' | 'pending' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'completed' | 'cancelled'
          order_date?: string
          due_date?: string | null
          delivery_date?: string | null
          delivery_address?: string | null
          delivery_method?: 'delivery' | 'pickup'
          subtotal?: number
          discount?: number
          tax_rate?: number
          tax_amount?: number
          total?: number
          notes?: string
          special_instructions?: string
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          discount: number
          line_total: number
          customizations: Json
          notes: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          unit_price: number
          discount?: number
          line_total: number
          customizations?: Json
          notes?: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          discount?: number
          line_total?: number
          customizations?: Json
          notes?: string
          created_at?: string
        }
      }
      inventory: {
        Row: {
          id: string
          company_id: string
          product_id: string | null
          name: string
          type: 'finished_product' | 'raw_material'
          unit: string
          current_stock: number
          min_stock_level: number
          max_stock_level: number | null
          cost_per_unit: number
          supplier: string | null
          location: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          product_id?: string | null
          name: string
          type: 'finished_product' | 'raw_material'
          unit?: string
          current_stock?: number
          min_stock_level?: number
          max_stock_level?: number | null
          cost_per_unit?: number
          supplier?: string | null
          location?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          product_id?: string | null
          name?: string
          type?: 'finished_product' | 'raw_material'
          unit?: string
          current_stock?: number
          min_stock_level?: number
          max_stock_level?: number | null
          cost_per_unit?: number
          supplier?: string | null
          location?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          company_id: string
          finished_product_id: string
          ingredient_id: string
          quantity_needed: number
          unit: string
          notes: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          finished_product_id: string
          ingredient_id: string
          quantity_needed: number
          unit?: string
          notes?: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          finished_product_id?: string
          ingredient_id?: string
          quantity_needed?: number
          unit?: string
          notes?: string
          created_at?: string
        }
      }
      stock_movements: {
        Row: {
          id: string
          company_id: string
          inventory_id: string
          order_id: string | null
          type: 'in' | 'out' | 'adjustment'
          quantity: number
          unit_cost: number | null
          reference: string | null
          reason: string | null
          notes: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          inventory_id: string
          order_id?: string | null
          type: 'in' | 'out' | 'adjustment'
          quantity: number
          unit_cost?: number | null
          reference?: string | null
          reason?: string | null
          notes?: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          inventory_id?: string
          order_id?: string | null
          type?: 'in' | 'out' | 'adjustment'
          quantity?: number
          unit_cost?: number | null
          reference?: string | null
          reason?: string | null
          notes?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: {
        Args: {
          company_id_param: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}