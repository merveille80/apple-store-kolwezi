import { useState, useEffect } from 'react'
import axios from 'axios'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  CubeIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'

const API = import.meta.env.VITE_API_URL || 'https://apple-store-kolwezi-production.up.railway.app'

const fmt = (v) => `${Number(v).toLocaleString('fr-CD')} FC`

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [salesData, setSalesData] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    try {
      const [statsRes, salesRes, lowStockRes, recentRes] = await Promise.all([
        axios.get(`${API}/api/dashboard/stats`),
        axios.get(`${API}/api/dashboard/sales-chart`),
        axios.get(`${API}/api/products?low_stock=true&limit=5`),
        axios.get(`${API}/api/sales?limit=5`)
      ])
      setStats(statsRes.data)
      setSalesData(salesRes.data || [])
      setLowStock(lowStockRes.data?.products || [])
      setRecentSales(recentRes.data?.sales || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>
  )

  const statCards = [
    {
      title: 'Produits en stock',
      value: stats?.total_products ?? '—',
      icon: CubeIcon,
      color: 'bg-blue-50 text-blue-600',
      trend: null
    },
    {
      title: 'Ventes du mois',
      value: stats?.monthly_sales ? fmt(stats.monthly_sales) : '—',
      icon: ShoppingCartIcon,
      color: 'bg-green-50 text-green-600',
      trend: stats?.sales_trend
    },
    {
      title: 'Revenus totaux',
      value: stats?.total_revenue ? fmt(stats.total_revenue) : '—',
      icon: CurrencyDollarIcon,
      color: 'bg-purple-50 text-purple-600',
      trend: null
    },
    {
      title: 'Stock faible',
      value: stats?.low_stock_count ?? '—',
      icon: ExclamationTriangleIcon,
      color: 'bg-red-50 text-red-600',
      trend: null
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de votre activité</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.title} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                {card.trend !== null && card.trend !== undefined && (
                  <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${card.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {card.trend >= 0 ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                    {Math.abs(card.trend)}% ce mois
                  </div>
                )}
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Ventes (7 derniers jours)</h2>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${Number(v).toLocaleString('fr-CD')} FC`, 'Ventes']} />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="url(#colorSales)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Aucune donnée disponible</div>
          )}
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Stock faible</h2>
          {lowStock.length > 0 ? (
            <div className="space-y-3">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.category}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${p.quantity <= 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {p.quantity} unités
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Aucun produit en stock faible</div>
          )}
        </div>
      </div>

      {/* Recent sales */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Ventes récentes</h2>
        {recentSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Référence</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Client</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Montant</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 font-mono text-xs text-gray-600">#{s.id}</td>
                    <td className="py-2.5 text-gray-900">{s.customer_name || 'Client anonyme'}</td>
                    <td className="py-2.5 text-gray-500">{new Date(s.sale_date).toLocaleDateString('fr-FR')}</td>
                    <td className="py-2.5 text-right font-semibold text-gray-900">{fmt(s.total_amount)}</td>
                    <td className="py-2.5 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        s.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                        s.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {s.payment_status === 'paid' ? 'Payé' : s.payment_status === 'pending' ? 'En attente' : 'Annulé'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">Aucune vente récente</p>
        )}
      </div>
    </div>
  )
}
