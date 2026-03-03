import { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ productId: '', quantity: 1, unitPrice: '', customerName: '', paymentMethod: 'cash', notes: '' });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchSales(); fetchProducts(); }, []);

  async function fetchSales() {
    try {
      const res = await axios.get(`${API}/api/sales`, { headers });
      setSales(res.data);
    } catch (e) { setError('Erreur de chargement des ventes'); }
    finally { setLoading(false); }
  }

  async function fetchProducts() {
    try {
      const res = await axios.get(`${API}/api/products`, { headers });
      setProducts(res.data);
    } catch (e) {}
  }

  function handleProductChange(e) {
    const pid = e.target.value;
    const prod = products.find(p => String(p.id) === String(pid));
    setForm({ ...form, productId: pid, unitPrice: prod ? prod.price : '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/sales`, form, { headers });
      setShowModal(false);
      setForm({ productId: '', quantity: 1, unitPrice: '', customerName: '', paymentMethod: 'cash', notes: '' });
      fetchSales();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la vente');
    }
  }

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalPrice || s.total || 0), 0);
  const todaySales = sales.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString());

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventes</h1>
          <p className="text-gray-500 text-sm mt-1">{sales.length} ventes enregistrées</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <span>+</span> Nouvelle Vente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Chiffre d'affaires total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalRevenue.toLocaleString('fr-CD')} FC</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Ventes aujourd'hui</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{todaySales.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Revenu aujourd'hui</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {todaySales.reduce((s, v) => s + Number(v.totalPrice || v.total || 0), 0).toLocaleString('fr-CD')} FC
          </p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Historique des ventes</h2>
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
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Client</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Qté</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Prix Unit.</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Total</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-medium">Paiement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{new Date(s.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.Product?.name || s.productName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.customerName || '—'}</td>
                    <td className="px-4 py-3 text-right">{s.quantity}</td>
                    <td className="px-4 py-3 text-right">{Number(s.unitPrice).toLocaleString('fr-CD')} FC</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">{Number(s.totalPrice || s.total || 0).toLocaleString('fr-CD')} FC</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${s.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' : s.paymentMethod === 'mobile' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {s.paymentMethod === 'cash' ? 'Espèces' : s.paymentMethod === 'mobile' ? 'Mobile' : s.paymentMethod || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Aucune vente enregistrée</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Nouvelle Vente</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Produit *</label>
                <select required value={form.productId} onChange={handleProductChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sélectionner un produit</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
                  <input required type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix Unitaire *</label>
                  <input required type="number" value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {form.unitPrice && form.quantity && (
                <div className="bg-blue-50 rounded-lg p-3 text-sm">
                  <span className="text-blue-700 font-medium">Total: {(Number(form.unitPrice) * Number(form.quantity)).toLocaleString('fr-CD')} FC</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <input value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})}
                  placeholder="Nom du client (optionnel)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
                <select value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="cash">Espèces</option>
                  <option value="mobile">Mobile Money</option>
                  <option value="card">Carte</option>
                  <option value="credit">Crédit</option>
                </select>
              </div>
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
