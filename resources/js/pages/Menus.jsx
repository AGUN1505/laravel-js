import { useEffect, useState, Fragment } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function buildTree(items) {
  const map = new Map();
  const roots = [];
  items.forEach((it) => map.set(it.id, { ...it, children: [] }));
  map.forEach((it) => {
    if (it.parent_id && map.has(it.parent_id)) {
      map.get(it.parent_id).children.push(it);
    } else {
      roots.push(it);
    }
  });
  const sortFn = (a, b) => a.order - b.order || a.id - b.id;
  const sortRec = (nodes) => {
    nodes.sort(sortFn);
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

export default function Menus() {
  const { isSuperAdmin, refresh } = useAuth();
  const [menus, setMenus] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [collapsed, setCollapsed] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [menusRes, permsRes] = await Promise.all([
        api.get('/menus'),
        isSuperAdmin() ? api.get('/permissions') : Promise.resolve({ data: { data: [] } }),
      ]);
      setMenus(menusRes.data.data);
      setPermissions(permsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, label) => {
    if (!confirm(`Delete menu "${label}"?`)) return;
    try {
      await api.delete(`/menus/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit = (m) => { setEditing(m); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const reorderSiblings = async (parentId, newOrder) => {
    const others = menus.filter((m) => (m.parent_id || null) !== (parentId || null));
    const updated = newOrder.map((m, idx) => ({ ...m, order: idx + 1 }));
    setMenus([...others, ...updated]);

    setSavingOrder(true);
    try {
      await api.post('/menus/reorder', {
        items: updated.map((m) => ({ id: m.id, order: m.order })),
      });
      try { await refresh(); } catch {}
    } catch (err) {
      alert(err.response?.data?.message || 'Reorder failed');
      load();
    } finally {
      setSavingOrder(false);
    }
  };

  const toggleCollapse = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  const toggleActive = async (menu) => {
    const next = !menu.is_active;
    setMenus((list) => list.map((m) => (m.id === menu.id ? { ...m, is_active: next } : m)));
    try {
      await api.put(`/menus/${menu.id}`, { is_active: next });
      try { await refresh(); } catch {}
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
      load();
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  const tree = buildTree(menus);

  return (
    <div>
      <div className="page-header">
        <h1>
          Menus {savingOrder && <small style={{ fontWeight: 400, color: '#6e6e73' }}>Saving...</small>}
        </h1>
        {isSuperAdmin() && (
          <button className="btn" onClick={openCreate}>+ New Menu</button>
        )}
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {isSuperAdmin() && (
        <p style={{ color: '#6e6e73', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          Drag rows to reorder within same parent. To move to another parent, use Edit.
        </p>
      )}

      <table className="table">
        <thead>
          <tr>
            {isSuperAdmin() && <th style={{ width: 40 }}></th>}
            <th style={{ width: 30 }}></th>
            <th>Label</th>
            <th>Path</th>
            <th>Permission</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <SortableLevel
            items={tree}
            parentId={null}
            depth={0}
            collapsed={collapsed}
            toggleCollapse={toggleCollapse}
            isSuperAdmin={isSuperAdmin()}
            onEdit={openEdit}
            onDelete={handleDelete}
            onToggleActive={toggleActive}
            reorderSiblings={reorderSiblings}
          />
        </tbody>
      </table>

      {showForm && (
        <MenuForm
          menu={editing}
          menus={menus}
          permissions={permissions}
          onClose={closeForm}
          onSaved={() => { closeForm(); load(); }}
        />
      )}
    </div>
  );
}

function SortableLevel({ items, parentId, depth, collapsed, toggleCollapse, isSuperAdmin, onEdit, onDelete, onToggleActive, reorderSiblings }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((m) => m.id === active.id);
    const newIndex = items.findIndex((m) => m.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(items, oldIndex, newIndex);
    reorderSiblings(parentId, reordered);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((m) => m.id)} strategy={verticalListSortingStrategy}>
        {items.map((m) => (
          <Fragment key={m.id}>
            <SortableRow
              menu={m}
              depth={depth}
              hasChildren={m.children.length > 0}
              isCollapsed={!!collapsed[m.id]}
              onToggle={() => toggleCollapse(m.id)}
              onToggleActive={onToggleActive}
              isSuperAdmin={isSuperAdmin}
              onEdit={onEdit}
              onDelete={onDelete}
            />
            {m.children.length > 0 && !collapsed[m.id] && (
              <SortableLevel
                items={m.children}
                parentId={m.id}
                depth={depth + 1}
                collapsed={collapsed}
                toggleCollapse={toggleCollapse}
                isSuperAdmin={isSuperAdmin}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
                reorderSiblings={reorderSiblings}
              />
            )}
          </Fragment>
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ menu, depth, hasChildren, isCollapsed, onToggle, onToggleActive, isSuperAdmin, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: menu.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: isDragging ? '#f0f7ff' : undefined,
    opacity: isDragging ? 0.85 : 1,
  };
  return (
    <tr ref={setNodeRef} style={style}>
      {isSuperAdmin && (
        <td>
          <span className="drag-handle" {...attributes} {...listeners} title="Drag to reorder">⋮⋮</span>
        </td>
      )}
      <td>
        {hasChildren ? (
          <button className="tree-toggle" onClick={onToggle} title={isCollapsed ? 'Expand' : 'Collapse'}>
            {isCollapsed ? '▸' : '▾'}
          </button>
        ) : null}
      </td>
      <td>
        <span style={{ paddingLeft: `${depth * 1.5}rem`, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          {depth > 0 && <span className="tree-line">└</span>}
          <strong>{menu.label}</strong>
        </span>
      </td>
      <td><code>{menu.path || '-'}</code></td>
      <td>{menu.permission ? <span className="badge badge-perm">{menu.permission}</span> : '-'}</td>
      <td>
        {isSuperAdmin ? (
          <label className="toggle">
            <input type="checkbox" checked={menu.is_active} onChange={() => onToggleActive(menu)} />
            <span className="toggle-slider"></span>
          </label>
        ) : (
          menu.is_active ? 'Yes' : 'No'
        )}
      </td>
      <td className="actions">
        {isSuperAdmin && (
          <>
            <button className="btn-sm" onClick={() => onEdit(menu)}>Edit</button>
            <button className="btn-sm btn-danger" onClick={() => onDelete(menu.id, menu.label)}>Delete</button>
          </>
        )}
      </td>
    </tr>
  );
}

function MenuForm({ menu, menus, permissions, onClose, onSaved }) {
  const { refresh } = useAuth();
  const [form, setForm] = useState({
    label: menu?.label || '',
    path: menu?.path || '',
    icon: menu?.icon || '',
    permission: menu?.permission || '',
    parent_id: menu?.parent_id || '',
    order: menu?.order ?? 0,
    is_active: menu?.is_active ?? true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        parent_id: form.parent_id || null,
        permission: form.permission || null,
        order: parseInt(form.order, 10) || 0,
      };
      if (menu) {
        await api.put(`/menus/${menu.id}`, payload);
      } else {
        await api.post('/menus', payload);
      }
      try { await refresh(); } catch {}
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const isDescendant = (id, ancestorId) => {
    if (!id) return false;
    let current = menus.find((m) => m.id === id);
    while (current) {
      if (current.parent_id === ancestorId) return true;
      current = menus.find((m) => m.id === current.parent_id);
    }
    return false;
  };

  const parentOptions = menus.filter((m) => {
    if (!menu) return true;
    if (m.id === menu.id) return false;
    if (isDescendant(m.id, menu.id)) return false;
    return true;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{menu ? 'Edit Menu' : 'New Menu'}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Label</label>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Path</label>
            <input value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} placeholder="/users" />
          </div>
          <div className="form-group">
            <label>Icon (optional)</label>
            <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Permission</label>
            <select value={form.permission} onChange={(e) => setForm({ ...form, permission: e.target.value })}>
              <option value="">— No permission required —</option>
              {permissions.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Parent</label>
            <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
              <option value="">— Root (no parent) —</option>
              {parentOptions.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Order</label>
            <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="toggle-row">
              <span>Active</span>
              <span className="toggle">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </span>
            </label>
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
