# Laravel-Express

Express.js project dengan struktur folder ala Laravel + React SPA frontend.

## Struktur Folder

```
laravel-express/
├── app/
│   ├── Http/
│   │   ├── Controllers/    # Controller (Home, Auth, User)
│   │   └── Middleware/     # Middleware (Authenticate, RedirectIfAuthenticated)
│   ├── Models/             # Sequelize models (mirip Eloquent)
│   └── Providers/
├── bootstrap/              # App bootstrap (Express + DB)
├── config/                 # Konfigurasi (app, database, auth)
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── public/
│   ├── css/
│   └── build/              # Hasil build Vite (production)
├── resources/
│   ├── index.html          # Entry HTML untuk Vite
│   └── js/                 # React SPA
│       ├── main.jsx        # Entry point
│       ├── App.jsx         # Router utama
│       ├── components/     # Layout, ProtectedRoute, GuestRoute
│       ├── pages/          # Home, About, Login, Register, Dashboard, Users, NotFound
│       ├── context/        # AuthContext
│       └── services/       # Axios API client
├── routes/
│   └── api.js              # API routes (JSON, JWT auth)
├── storage/
├── artisan.js              # CLI tool
├── server.js               # Entry point Express
├── vite.config.js
└── .env
```

## Setup

```bash
npm install
node artisan.js migrate
node artisan.js db:seed
```

## Development

Jalankan server Express dan Vite dev server bersamaan:

```bash
npm run dev
```

- Express API: `http://localhost:3030`
- React dev (Vite): `http://localhost:5173`

Buka `http://localhost:5173`. Vite akan proxy `/api/*` ke Express.

Atau bisa juga jalankan terpisah:
```bash
npm run dev:server   # Express only
npm run dev:client   # Vite only
```

## Production

```bash
npm run build        # Build React ke public/build/
npm start            # Express serve API + React build di port 3030
```

## Artisan Commands

```bash
node artisan.js migrate              # Jalankan migrations
node artisan.js migrate:fresh        # Drop & re-run migrations
node artisan.js db:seed              # Jalankan seeders
node artisan.js make:controller Foo  # Buat controller baru
node artisan.js make:model Foo       # Buat model baru
node artisan.js make:middleware Foo  # Buat middleware baru
node artisan.js make:migration foo   # Buat migration baru
```

## API Routes

Semua route JSON, auth pakai JWT (`Authorization: Bearer <token>`).

**Public:**
- `POST /api/v1/login` → Get JWT token
- `POST /api/v1/register` → Register + get JWT token

**Protected (butuh `Authorization: Bearer <token>`):**
- `GET /api/v1/me` → Current user
- `GET /api/v1/users` → List users
- `POST /api/v1/users` → Create user
- `GET /api/v1/users/:id` → Show user
- `PUT /api/v1/users/:id` → Update user
- `DELETE /api/v1/users/:id` → Delete user

## Route Helper (Laravel-style)

`app/Http/Router.js` menyediakan helper untuk grouping, prefix, middleware, dan resource — mirip `Route::` di Laravel.

```js
const route = new Router();

route.prefix('/v1').group((r) => {
  r.post('/login', AuthController.apiLogin);

  r.middleware(auth).group((r) => {
    r.get('/me', AuthController.me);

    // Manual:
    r.prefix('/users').group((r) => {
      r.get('/', UserController.index);
      r.post('/', UserController.store);
      r.get('/:id', UserController.show);
    });

    // Atau pakai resource (mirip Route::resource di Laravel):
    r.resource('/users', UserController);
    // Hasilkan: index, store, show, update, destroy

    r.resource('/posts', PostController, { only: ['index', 'show'] });
    r.resource('/comments', CommentController, { except: ['destroy'] });
  });
});

module.exports = route.toExpress();
```

Method yang tersedia: `get`, `post`, `put`, `patch`, `delete`, `prefix`, `middleware`, `group`, `resource`.

## Default Credentials (setelah seed)

- Email: `admin@example.com`
- Password: `password`

## Pemetaan Konsep Laravel → Express

| Laravel | Laravel-Express |
|---------|-----------------|
| `php artisan` | `node artisan.js` |
| Eloquent | Sequelize |
| Blade | React (SPA) |
| `app/Http/Controllers` | `app/Http/Controllers` |
| `app/Models` | `app/Models` |
| `routes/api.php` | `routes/api.js` |
| `config/*.php` | `config/*.js` |
| `database/migrations` | `database/migrations` |
| `resources/views` | `resources/js` (React) |
| Vite (Laravel 10+) | Vite |
| `.env` | `.env` |
