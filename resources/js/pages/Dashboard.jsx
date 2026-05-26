import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="card">
        <h2>Hi, {user.name}</h2>
        <p>Email: {user.email}</p>
        <p>User ID: {user.id}</p>
      </div>
    </div>
  );
}
