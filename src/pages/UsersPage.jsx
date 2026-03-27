import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, X, UserCheck, UserX, Shield, ShieldCheck } from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'staff', is_active: 1 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Admin-only guard
  if (currentUser?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'staff', is_active: 1 });
    setError('');
    setShowModal(true);
  }

  function openEditModal(u) {
    setEditingUser(u);
    setFormData({ name: u.name, email: u.email, role: u.role, is_active: u.is_active });
    setError('');
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');
      setShowModal(false);
      setSuccessMsg(editingUser ? 'User berhasil diupdate' : 'User berhasil ditambahkan');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(u) {
    if (!confirm(`Hapus user "${u.name}"?`)) return;
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus');
      setSuccessMsg('User berhasil dihapus');
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kelola Users</h1>
          <p className="text-sm text-slate-500 mt-1">Manage user accounts yang bisa mengakses sistem</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus size={18} />
          Tambah User
        </button>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
          ✓ {successMsg}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-slate-500">Belum ada user terdaftar</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Nama</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Login Terakhir</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900">{u.name}</td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      u.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.role === 'admin' ? <ShieldCheck size={12}/> : <Shield size={12}/>}
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      Number(u.is_active) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {Number(u.is_active) ? <UserCheck size={12}/> : <UserX size={12}/>}
                      {Number(u.is_active) ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEditModal(u)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors">
                        <Pencil size={16}/>
                      </button>
                      {u.id !== currentUser.id && (
                        <button onClick={() => handleDelete(u)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                          <Trash2 size={16}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">{editingUser ? 'Edit User' : 'Tambah User'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama</label>
                <input
                  type="text" required value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email" required value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {editingUser && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox" id="is_active"
                    checked={Number(formData.is_active) === 1}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked ? 1 : 0})}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-slate-700">Aktif</label>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
