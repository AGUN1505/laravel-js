import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Roles() {
  const { isSuperAdmin } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/roles'),
        isSuperAdmin() ? api.get('/permissions') : Promise.resolve({ data: { data: [] } }),
      ]);
      setRoles(rolesRes.data.data);
      setPermissions(permsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, name) => {
    if (name === 'superadmin') return alert('Cannot delete superadmin role');
    if (!confirm(`Delete role "${name}"?`)) return;
    try {
      await api.delete(`/roles/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit = (role) => { setEditing(role); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Roles</h1>
        {isSuperAdmin() && (
          <button className="btn" onClick={openCreate}>+ New Role</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Guard</th>
            <th>Permissions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>
                <span className={`badge badge-${r.name === 'superadmin' ? 'super' : 'role'}`}>
                  {r.name}
                </span>
              </td>
              <td>{r.guard_name}</td>
              <td>
                <div className="perm-list">
                  {(r.permissions || []).map((p) => (
                    <span key={p.id} className="badge badge-perm">{p.name}</span>
                  ))}
                </div>
              </td>
              <td className="actions">
                {isSuperAdmin() && r.name !== 'superadmin' && (
                  <>
                    <button className="btn-sm" onClick={() => openEdit(r)}>Edit</button>
                    <button className="btn-sm btn-danger" onClick={() => handleDelete(r.id, r.name)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <RoleForm
          role={editing}
          permissions={permissions}
          onClose={closeForm}
          onSaved={() => { closeForm(); load(); }}
        />
      )}
    </div>
  );
}

function RoleForm({ role, permissions, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: role?.name || '',
    guard_name: role?.guard_name || 'api',
    permissions: (role?.permissions || []).map((p) => p.name),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const togglePerm = (name) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(name)
        ? f.permissions.filter((p) => p !== name)
        : [...f.permissions, name],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (role) {
        await api.put(`/roles/${role.id}`, form);
      } else {
        await api.post('/roles', form);
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
        <h2>{role ? 'Edit Role' : 'New Role'}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Guard</label>
            <input
              value={form.guard_name}
              onChange={(e) => setForm({ ...form, guard_name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Permissions</label>
            <div className="checkbox-list">
              {permissions.map((p) => (
                <label key={p.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(p.name)}
                    onChange={() => togglePerm(p.name)}
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </div>

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
