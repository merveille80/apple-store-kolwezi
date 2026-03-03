import { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'https://apple-store-kolwezi-production.up.railway.app';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', category: '', price: '', cost: '', stock: '', minStock: '', description: '' });
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    try {
      const res = await axios.get(`${API}/api/products`, { headers });
      setProducts(res.data);
    } catch (e) { setError('Erreur de chargement'); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', category: '', price: '', cost: '', stock: '', minStock: '', description: '' });
    setShowModal(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({ name: p.name, category: p.category || '', price: p.price, cost: p.cost || '', stock: p.stock, minStock: p.minStock || '', description: p.description || '' });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API}/api/products/${editing.id}`, form, { headers });
      } else {
        await axios.post(`${API}/api/products`, form, { headers });
      }
      setShowModal(false);
      fetchProducts();
    } catch (e) { setError('Erreur lors de la sauvegarde'); }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      await axios.delete(`${API}/api/products/${id}`, { headers });
      fetchProducts();
    } catch (e) { setError('Erreur lors de la suppression'); }
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = products.filter(p => p.stock <= (p.minStock || 5));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventaire</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} produits au total</p>
        </div>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <span>+</span> Nouveau Produit
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 font-medium">⚠️ Stock faible : {lowStock.map(p => p.name).join(', ')}</p>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Produit</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Catégorie</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Prix Vente</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Coût</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Stock</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-medium">Statut</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.category || '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{Number(p.price).toLocaleString('fr-CD')} FC</td>
                    <td className="px-4 py-3 text-right text-gray-600">{p.cost ? `${Number(p.cost).toLocaleString('fr-CD')} FC` : '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">{p.stock}</td>
                    <td className="px-4 py-3 text-center">
                      {p.stock <= (p.minStock || 5) ? (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Stock faible</span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">En stock</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800 mr-3 text-xs font-medium">Modifier</button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Supprimer</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Aucun produit trouvé</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Modifier Produit' : 'Nouveau Produit'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <input value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix Vente *</label>
                  <input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coût d'achat</label>
                  <input type="number" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                  <input required type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Min.</label>
                  <input type="number" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
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
