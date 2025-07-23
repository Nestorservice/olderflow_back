import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     summary: Statistiques du tableau de bord
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *         description: Période pour les statistiques
 *     responses:
 *       200:
 *         description: Statistiques du tableau de bord
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders_summary:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     by_status:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                 sales_summary:
 *                   type: object
 *                   properties:
 *                     total_revenue:
 *                       type: number
 *                     average_order_value:
 *                       type: number
 *                     growth_rate:
 *                       type: number
 *                 low_stock_alerts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       current_stock:
 *                         type: number
 *                       min_stock_level:
 *                         type: number
 *                       type:
 *                         type: string
 *                 recent_activities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       description:
 *                         type: string
 *                       timestamp:
 *                         type: string
 */

// Définir le handler principal
const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const period = req.query.period || 'month';
    const companyId = req.user.company_id;

    // Calculer la date de début selon la période
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'month':
      default:
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    // 1. Résumé des commandes
    const { data: orderStats, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('company_id', companyId)
      .gte('created_at', startDate.toISOString());

    if (orderError) throw orderError;

    const ordersSummary = {
      total: orderStats.length,
      by_status: orderStats.reduce((acc: any, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {})
    };

    // 2. Résumé des ventes
    const { data: salesData, error: salesError } = await supabaseAdmin
      .from('orders')
      .select('total, created_at')
      .eq('company_id', companyId)
      .in('status', ['completed', 'delivered'])
      .gte('created_at', startDate.toISOString());

    if (salesError) throw salesError;

    const totalRevenue = salesData.reduce((sum, order) => sum + (order.total || 0), 0);
    const averageOrderValue = salesData.length > 0 ? totalRevenue / salesData.length : 0;

    // Calculer le taux de croissance (période précédente)
    const previousStartDate = new Date(startDate);
    const periodDiff = now.getTime() - startDate.getTime();
    previousStartDate.setTime(startDate.getTime() - periodDiff);

    const { data: previousSalesData, error: previousSalesError } = await supabaseAdmin
      .from('orders')
      .select('total')
      .eq('company_id', companyId)
      .in('status', ['completed', 'delivered'])
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    if (previousSalesError) throw previousSalesError;

    const previousRevenue = previousSalesData.reduce((sum, order) => sum + (order.total || 0), 0);
    const growthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const salesSummary = {
      total_revenue: totalRevenue,
      average_order_value: averageOrderValue,
      growth_rate: growthRate
    };

    // 3. Alertes de stock bas
    const { data: inventoryItems, error: stockError } = await supabaseAdmin
      .from('inventory')
      .select('id, name, current_stock, min_stock_level, type')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (stockError) throw stockError;

    // Filtrer les éléments avec un stock bas dans le code
    const lowStockItems = inventoryItems.filter(item => 
      item.current_stock !== null && 
      item.min_stock_level !== null && 
      Number(item.current_stock) < Number(item.min_stock_level)
    );

    // 4. Activités récentes (derniers mouvements de stock et commandes)
    const { data: recentOrders, error: recentOrdersError } = await supabaseAdmin
      .from('orders')
      .select(`
        id, order_number, status, created_at,
        customers (name)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentOrdersError) throw recentOrdersError;

    const { data: recentMovements, error: recentMovementsError } = await supabaseAdmin
      .from('stock_movements')
      .select(`
        id, type, quantity, reason, created_at,
        inventory (name)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentMovementsError) throw recentMovementsError;

    // Combiner et trier les activités récentes
    const recentActivities = [
      ...recentOrders.map(order => ({
        type: 'order',
        description: `Commande ${order.order_number} (${(order.customers as any)?.name}) - ${order.status}`,
        timestamp: order.created_at
      })),
      ...recentMovements.map(movement => ({
        type: 'stock_movement',
        description: `${movement.type === 'in' ? 'Entrée' : movement.type === 'out' ? 'Sortie' : 'Ajustement'} de stock: ${(movement.inventory as any)?.name} (${movement.quantity})`,
        timestamp: movement.created_at
      }))
    ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

    const response = {
      orders_summary: ordersSummary,
      sales_summary: salesSummary,
      low_stock_alerts: lowStockItems,
      recent_activities: recentActivities
    };

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('Erreur dashboard:', error);
    return res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
  }
};

// Exporter avec withAuth
export default withAuth(handler);
