import { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'https://apple-store-kolwezi-production.up.railway.app';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', contact: '', phone: '', email: '', address: '', notes: '' });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchSuppliers(); }, []);

  async function fetchSuppliers() {
    try {
      const res = await axios.get(`${API}/api/suppliers`, { headers });
      setSuppliers(res.data);
    } catch (e) { setError('Erreur de chargement'); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', contact: '', phone: '', email: '', address: '', notes: '' });
    setShowModal(true);
  }

  function openEdit(s) {
    setEditing(s);
    setForm({ name: s.name, contact: s.contact || '', phone: s.phone || '', email: s.email || '', address: s.address || '', notes: s.notes || '' });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API}/api/suppliers/${editing.id}`, form, { headers });
      } else {
        await axios.post(`${API}/api/suppliers`, form, { headers });
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (e) { setError('Erreur lors de la sauvegarde'); }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce fournisseur ?')) return;
    try {
      await axios.delete(`${API}/api/suppliers/${id}`, { headers });
      fetchSuppliers();
    } catch (e) { setError('Erreur lors de la suppression'); }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fournisseurs</h1>
          <p className="text-gray-500 text-sm mt-1">{suppliers.length} fournisseurs</p>
        </div>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <span>+</span> Nouveau Fournisseur
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Nom</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Contact</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Téléphone</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Adresse</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.contact || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.address || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openEdit(s)} className="text-blue-600 hover:text-blue-800 mr-3 text-xs font-medium">Modifier</button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Supprimer</button>
                    </td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucun fournisseur enregistré</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Modifier Fournisseur' : 'Nouveau Fournisseur'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Personne de contact</label>
                <input value={form.contact} onChange={e => setForm({...form, contact: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
