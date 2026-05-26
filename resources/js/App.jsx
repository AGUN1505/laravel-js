import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import AdminRoute from './components/AdminRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Permissions from './pages/Permissions';
import Menus from './pages/Menus';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        <Route element={<AdminRoute permission="view users" />}>
          <Route path="/users" element={<Users />} />
        </Route>

        <Route element={<AdminRoute permission="view roles" />}>
          <Route path="/roles" element={<Roles />} />
        </Route>

        <Route element={<AdminRoute permission="view permissions" />}>
          <Route path="/permissions" element={<Permissions />} />
        </Route>

        <Route element={<AdminRoute permission="view menus" />}>
          <Route path="/menus" element={<Menus />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
