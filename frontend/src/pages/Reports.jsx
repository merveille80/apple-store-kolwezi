import { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'https://apple-store-kolwezi-production.up.railway.app';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('month');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchReport(); }, [period]);

  async function fetchReport() {
    setLoading(true);
    try {
      const [dash, sales, purchases, expenses] = await Promise.all([
        axios.get(`${API}/api/dashboard`, { headers }),
        axios.get(`${API}/api/sales`, { headers }),
        axios.get(`${API}/api/purchases`, { headers }),
        axios.get(`${API}/api/expenses`, { headers }),
      ]);
      setData({ dash: dash.data, sales: sales.data, purchases: purchases.data, expenses: expenses.data });
    } catch (e) { setError('Erreur de chargement du rapport'); }
    finally { setLoading(false); }
  }

  function filterByPeriod(items, dateField = 'createdAt') {
    const now = new Date();
    return items.filter(item => {
      const d = new Date(item[dateField] || item.createdAt);
      if (period === 'week') {
        const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      } else if (period === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else if (period === 'year') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }

  if (loading) return <div className="p-6 text-center text-gray-500">Chargement du rapport...</div>;
  if (error) return <div className="p-6"><div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">{error}</div></div>;
  if (!data) return null;

  const filteredSales = filterByPeriod(data.sales);
  const filteredPurchases = filterByPeriod(data.purchases);
  const filteredExpenses = filterByPeriod(data.expenses, 'date');

  const totalRevenue = filteredSales.reduce((s, v) => s + Number(v.totalPrice || v.total || 0), 0);
  const totalPurchases = filteredPurchases.reduce((s, p) => s + Number(p.totalCost || p.total || 0), 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const grossProfit = totalRevenue - totalPurchases;
  const netProfit = grossProfit - totalExpenses;
  const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Top products by revenue
  const productMap = {};
  filteredSales.forEach(s => {
    const name = s.Product?.name || s.productName || 'Inconnu';
    if (!productMap[name]) productMap[name] = { revenue: 0, qty: 0 };
    productMap[name].revenue += Number(s.totalPrice || s.total || 0);
    productMap[name].qty += Number(s.quantity || 0);
  });
  const topProducts = Object.entries(productMap).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);

  const periodLabel = { week: 'Cette semaine', month: 'Ce mois', year: 'Cette année', all: 'Tout' }[period];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
          <p className="text-gray-500 text-sm mt-1">Analyse financière — {periodLabel}</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'year', 'all'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${period === p ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
              {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : p === 'year' ? 'Année' : 'Tout'}
            </button>
          ))}
        </div>
      </div>

      {/* P&L Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Chiffre d'affaires</p>
          <p className="text-xl font-bold text-green-600 mt-1">{totalRevenue.toLocaleString('fr-CD')} FC</p>
          <p className="text-xs text-gray-400 mt-1">{filteredSales.length} ventes</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Coût d'achat</p>
          <p className="text-xl font-bold text-orange-600 mt-1">{totalPurchases.toLocaleString('fr-CD')} FC</p>
          <p className="text-xs text-gray-400 mt-1">{filteredPurchases.length} achats</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Dépenses</p>
          <p className="text-xl font-bold text-red-600 mt-1">{totalExpenses.toLocaleString('fr-CD')} FC</p>
          <p className="text-xs text-gray-400 mt-1">{filteredExpenses.length} entrées</p>
        </div>
        <div className={`rounded-xl border p-4 ${netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Bénéfice net</p>
          <p className={`text-xl font-bold mt-1 ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString('fr-CD')} FC
          </p>
          <p className="text-xs text-gray-400 mt-1">Marge: {margin}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Compte de résultat */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Compte de Résultat</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Chiffre d'affaires</span>
              <span className="font-semibold text-green-700">+{totalRevenue.toLocaleString('fr-CD')} FC</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Coût des marchandises</span>
              <span className="font-semibold text-red-600">-{totalPurchases.toLocaleString('fr-CD')} FC</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 bg-gray-50 px-2 rounded">
              <span className="font-medium text-gray-700">Marge brute</span>
              <span className={`font-bold ${grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {grossProfit >= 0 ? '+' : ''}{grossProfit.toLocaleString('fr-CD')} FC
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Charges d'exploitation</span>
              <span className="font-semibold text-red-600">-{totalExpenses.toLocaleString('fr-CD')} FC</span>
            </div>
            <div className={`flex justify-between py-3 px-2 rounded-lg ${netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <span className="font-bold text-gray-900">Résultat net</span>
              <span className={`font-bold text-lg ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString('fr-CD')} FC
              </span>
            </div>
          </div>
        </div>

        {/* Top produits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top Produits ({periodLabel})</h2>
          {topProducts.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Aucune vente sur cette période</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map(([name, stats], i) => (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">
                      <span className="text-gray-400 mr-2">#{i + 1}</span>{name}
                    </span>
                    <span className="text-green-700 font-semibold">{stats.revenue.toLocaleString('fr-CD')} FC</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{stats.qty} unités vendues</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stock overview from dashboard */}
      {data.dash && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Aperçu du Stock</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{data.dash.totalProducts || 0}</p>
              <p className="text-gray-500">Produits</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{data.dash.lowStockCount || 0}</p>
              <p className="text-gray-500">Stock faible</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{data.dash.totalSalesToday || 0}</p>
              <p className="text-gray-500">Ventes aujourd'hui</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{Number(data.dash.revenueToday || 0).toLocaleString('fr-CD')}</p>
              <p className="text-gray-500">Revenu aujourd'hui (FC)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
