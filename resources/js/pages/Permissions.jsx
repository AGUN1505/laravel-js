import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Permissions() {
  const { isSuperAdmin } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/permissions');
      setPermissions(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete permission "${name}"?`)) return;
    try {
      await api.delete(`/permissions/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit = (p) => { setEditing(p); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Permissions</h1>
        {isSuperAdmin() && (
          <button className="btn" onClick={openCreate}>+ New Permission</button>
        )}
      </div>
      {error && <div className="alert alert-error">{error}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Guard</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {permissions.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td><span className="badge badge-perm">{p.name}</span></td>
              <td>{p.guard_name}</td>
              <td className="actions">
                {isSuperAdmin() && (
                  <>
                    <button className="btn-sm" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn-sm btn-danger" onClick={() => handleDelete(p.id, p.name)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <PermissionForm
          permission={editing}
          onClose={closeForm}
          onSaved={() => { closeForm(); load(); }}
        />
      )}
    </div>
  );
}

function PermissionForm({ permission, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: permission?.name || '',
    guard_name: permission?.guard_name || 'api',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (permission) {
        await api.put(`/permissions/${permission.id}`, form);
      } else {
        await api.post('/permissions', form);
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
        <h2>{permission ? 'Edit Permission' : 'New Permission'}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Guard</label>
            <input value={form.guard_name} onChange={(e) => setForm({ ...form, guard_name: e.target.value })} />
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
