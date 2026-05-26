import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Users() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        isSuperAdmin() || hasPermission('view roles')
          ? api.get('/roles').catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } }),
      ]);
      setUsers(usersRes.data.data);
      setRoles(rolesRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit = (user) => { setEditing(user); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Users</h1>
        {hasPermission('create users') && (
          <button className="btn" onClick={openCreate}>+ New User</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                {(u.roles || []).map((r) => (
                  <span key={r.id || r} className={`badge badge-${(r.name || r) === 'superadmin' ? 'super' : 'role'}`}>
                    {r.name || r}
                  </span>
                ))}
              </td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td className="actions">
                {hasPermission('edit users') && (
                  <button className="btn-sm" onClick={() => openEdit(u)}>Edit</button>
                )}
                {isSuperAdmin() && !u.roles?.some((r) => (r.name || r) === 'superadmin') && (
                  <button className="btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <UserForm
          user={editing}
          roles={roles}
          onClose={closeForm}
          onSaved={() => { closeForm(); load(); }}
        />
      )}
    </div>
  );
}

function UserForm({ user, roles, onClose, onSaved }) {
  const { isSuperAdmin } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    roles: (user?.roles || []).map((r) => r.name || r),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleRole = (name) => {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(name) ? f.roles.filter((r) => r !== name) : [...f.roles, name],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email };
      if (form.password) payload.password = form.password;
      if (isSuperAdmin()) payload.roles = form.roles;

      if (user) {
        await api.put(`/users/${user.id}`, payload);
      } else {
        await api.post('/users', { ...payload, password: form.password });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{user ? 'Edit User' : 'New User'}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password {user && <small>(leave blank to keep)</small>}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!user} />
          </div>

          {isSuperAdmin() && roles.length > 0 && (
            <div className="form-group">
              <label>Roles</label>
              <div className="checkbox-list">
                {roles.map((r) => (
                  <label key={r.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={form.roles.includes(r.name)}
                      onChange={() => toggleRole(r.name)}
                      disabled={r.name === 'superadmin'}
                    />
                    {r.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
