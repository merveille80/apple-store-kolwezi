import { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'https://apple-store-kolwezi-production.up.railway.app';

export default function Accounting() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('expenses');
  const [form, setForm] = useState({ category: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [exp, acc] = await Promise.all([
        axios.get(`${API}/api/expenses`, { headers }),
        axios.get(`${API}/api/accounting/summary`, { headers }).catch(() => ({ data: null })),
      ]);
      setExpenses(exp.data);
      setSummary(acc.data);
    } catch (e) { setError('Erreur de chargement'); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/expenses`, form, { headers });
      setShowModal(false);
      setForm({ category: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchAll();
    } catch (e) { setError('Erreur lors de l\'enregistrement'); }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette dépense ?')) return;
    try {
      await axios.delete(`${API}/api/expenses/${id}`, { headers });
      fetchAll();
    } catch (e) { setError('Erreur lors de la suppression'); }
  }

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const revenue = summary?.totalRevenue || 0;
  const profit = Number(revenue) - totalExpenses;

  const categories = [...new Set(expenses.map(e => e.category).filter(Boolean))];
  const byCategory = categories.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount || 0), 0)
  })).sort((a, b) => b.total - a.total);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comptabilité</h1>
          <p className="text-gray-500 text-sm mt-1">Suivi des dépenses et résultats financiers</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <span>+</span> Nouvelle Dépense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Chiffre d'affaires</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{Number(revenue).toLocaleString('fr-CD')} FC</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total dépenses</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{totalExpenses.toLocaleString('fr-CD')} FC</p>
        </div>
        <div className={`rounded-xl border p-4 ${profit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-sm text-gray-500">Bénéfice net</p>
          <p className={`text-2xl font-bold mt-1 ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {profit >= 0 ? '+' : ''}{profit.toLocaleString('fr-CD')} FC
          </p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('expenses')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'expenses' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
          Dépenses
        </button>
        <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'categories' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
          Par Catégorie
        </button>
      </div>

      {activeTab === 'expenses' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Catégorie</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Description</th>
                    <th className="text-right px-4 py-3 text-gray-600 font-medium">Montant</th>
                    <th className="text-center px-4 py-3 text-gray-600 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{new Date(e.date || e.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{e.category || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{e.description || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-700">{Number(e.amount).toLocaleString('fr-CD')} FC</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleDelete(e.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Supprimer</button>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Aucune dépense enregistrée</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          {byCategory.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Aucune donnée disponible</p>
          ) : (
            <div className="space-y-3">
              {byCategory.map(({ cat, total }) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{cat}</span>
                    <span className="text-red-600 font-semibold">{total.toLocaleString('fr-CD')} FC</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-red-400 h-2 rounded-full" style={{ width: `${totalExpenses > 0 ? (total / totalExpenses) * 100 : 0}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{totalExpenses > 0 ? ((total / totalExpenses) * 100).toFixed(1) : 0}% du total</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Nouvelle Dépense</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                <input required value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  placeholder="Ex: Loyer, Salaires, Transport..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant *</label>
                <input required type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">Annuler</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
