import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="error-page">
      <h1>404</h1>
      <p>Halaman tidak ditemukan.</p>
      <Link to="/" className="btn">Kembali ke Home</Link>
    </div>
  );
}
