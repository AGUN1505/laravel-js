import { Outlet, Link, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Layout() {
  const { user, logout } = useAuth();
  const [menus, setMenus] = useState([]);

  useEffect(() => {
    if (!user) {
      setMenus([]);
      return;
    }
    api.get('/menus/me')
      .then((res) => setMenus(res.data.data))
      .catch(() => setMenus([]));
  }, [user]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Link to="/">Laravel-Express</Link>
        </div>

        <nav className="sidebar-nav">
          {user && menus.map((m) => <MenuItem key={m.id} item={m} />)}

          {!user && (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>

        {user && (
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
            <button onClick={logout} className="btn-sm">Logout</button>
          </div>
        )}
      </aside>

      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function MenuItem({ item, depth = 0 }) {
  const [open, setOpen] = useState(true);
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div className="sidebar-group">
        <button
          className="sidebar-group-toggle"
          onClick={() => setOpen((o) => !o)}
          style={{ paddingLeft: `${0.75 + depth * 0.75}rem` }}
        >
          <span>{item.label}</span>
          <span className={`chevron ${open ? 'open' : ''}`}>›</span>
        </button>
        {open && (
          <div className="sidebar-group-items">
            {item.children.map((c) => <MenuItem key={c.id} item={c} depth={depth + 1} />)}
          </div>
        )}
      </div>
    );
  }
  if (!item.path) {
    return <span className="sidebar-text" style={{ paddingLeft: `${0.75 + depth * 0.75}rem` }}>{item.label}</span>;
  }
  return (
    <NavLink to={item.path} style={{ paddingLeft: `${0.75 + depth * 0.75}rem` }}>
      {item.label}
    </NavLink>
  );
}
