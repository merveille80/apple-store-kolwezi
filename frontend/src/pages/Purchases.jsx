import { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ productId: '', supplierId: '', quantity: 1, unitCost: '', notes: '' });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [p, pr, s] = await Promise.all([
        axios.get(`${API}/api/purchases`, { headers }),
        axios.get(`${API}/api/products`, { headers }),
        axios.get(`${API}/api/suppliers`, { headers }),
      ]);
      setPurchases(p.data);
      setProducts(pr.data);
      setSuppliers(s.data);
    } catch (e) { setError('Erreur de chargement'); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/purchases`, form, { headers });
      setShowModal(false);
      setForm({ productId: '', supplierId: '', quantity: 1, unitCost: '', notes: '' });
      fetchAll();
    } catch (e) { setError(e.response?.data?.message || 'Erreur lors de l\'achat'); }
  }

  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.totalCost || p.total || 0), 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Achats</h1>
          <p className="text-gray-500 text-sm mt-1">{purchases.length} achats enregistrés</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <span>+</span> Nouvel Achat
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total dépensé</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{totalSpent.toLocaleString('fr-CD')} FC</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Nombre d'achats</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{purchases.length}</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Historique des achats</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Produit</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Fournisseur</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Qté</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Coût Unit.</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchases.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.Product?.name || p.productName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{p.Supplier?.name || p.supplierName || '—'}</td>
                    <td className="px-4 py-3 text-right">{p.quantity}</td>
                    <td className="px-4 py-3 text-right">{Number(p.unitCost).toLocaleString('fr-CD')} FC</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-700">{Number(p.totalCost || p.total || 0).toLocaleString('fr-CD')} FC</td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucun achat enregistré</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Nouvel Achat</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Produit *</label>
                <select required value={form.productId} onChange={e => setForm({...form, productId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sélectionner un produit</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                <select value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sélectionner un fournisseur</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
                  <input required type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coût Unitaire *</label>
                  <input required type="number" value={form.unitCost} onChange={e => setForm({...form, unitCost: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {form.unitCost && form.quantity && (
                <div className="bg-red-50 rounded-lg p-3 text-sm">
                  <span className="text-red-700 font-medium">Total: {(Number(form.unitCost) * Number(form.quantity)).toLocaleString('fr-CD')} FC</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2}
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
