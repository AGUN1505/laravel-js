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
- `GET /api/v1/users` → List users (perm: `view users`)
- `POST /api/v1/users` → Create user (perm: `create users`)
- `GET /api/v1/users/:id` → Show user (perm: `view users`)
- `PUT /api/v1/users/:id` → Update user (perm: `edit users`)
- `DELETE /api/v1/users/:id` → Delete user (superadmin only)
- `POST /api/v1/users/:id/roles` → Assign roles (superadmin only)
- `GET /api/v1/roles` → List roles (perm: `view roles`)
- `GET /api/v1/roles/:id` → Show role (perm: `view roles`)
- `POST /api/v1/roles` → Create role (superadmin only)
- `PUT /api/v1/roles/:id` → Update role (superadmin only)
- `DELETE /api/v1/roles/:id` → Delete role (superadmin only)
- `GET /api/v1/permissions` → List permissions (superadmin only)

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

## Role & Permission (Spatie-style)

Sistem role/permission lengkap mirip Spatie laravel-permission.

### Default Roles & Permissions

Setelah `node artisan.js db:seed`:

**Roles:** `superadmin`, `admin`, `editor`, `user`
**Permissions:** `view/create/edit/delete users`, `view/create/edit/delete posts`, `view/create/edit/delete roles`

**Default user:**
- `super@example.com` → role `superadmin` (bypass semua permission check)
- `admin@example.com` → role `admin` (CRUD users + posts)
- `john@example.com` → role `user` (`view posts` only)

### Superadmin

Role `superadmin` memiliki akses penuh:
- `user.hasPermissionTo(...)` selalu return `true`
- Middleware `hasRole`, `hasPermission`, `hasAllRoles`, `hasRoleOrPermission` selalu lolos
- Hanya superadmin yang bisa mengelola roles & users (create/delete)

```js
const { requireSuperAdmin } = require('./app/Http/Middleware/Authorize');

r.middleware(requireSuperAdmin).group((r) => {
  r.post('/roles', RoleController.store);
});

// Cek manual:
await user.isSuperAdmin();
```

Role `superadmin` dilindungi: tidak bisa dihapus atau diubah lewat API.

### API di Model

```js
const { User, Role, Permission } = require('./app/Models');

// Assign / sync roles
await user.assignRole('admin');
await user.assignRole('admin', 'editor');
await user.syncRoles('user');           // replace
await user.removeRole('admin');

// Check roles
await user.hasRole('admin');
await user.hasAnyRole('admin', 'editor');
await user.hasAllRoles('admin', 'verified');
await user.getRoleNames();              // ['admin']

// Direct permissions ke user
await user.givePermissionTo('edit posts');
await user.syncPermissions('view posts', 'edit posts');
await user.revokePermissionTo('edit posts');

// Check permissions (direct + via role)
await user.hasPermissionTo('edit posts');
await user.hasAnyPermission('view posts', 'edit posts');
await user.hasDirectPermission('edit posts');
await user.hasPermissionViaRole('edit posts');
await user.getAllPermissions();
await user.getPermissionNames();

// Permissions di Role
await role.givePermissionTo('edit posts');
await role.syncPermissions('view posts', 'edit posts');
await role.revokePermissionTo('edit posts');
await role.hasPermissionTo('edit posts');
```

### Middleware (untuk routes)

```js
const { hasRole, hasPermission, hasAllRoles, hasRoleOrPermission }
  = require('./app/Http/Middleware/Authorize');

r.middleware(hasRole('admin')).group(...)
r.middleware(hasRole('admin', 'editor')).group(...)         // OR
r.middleware(hasAllRoles('admin', 'verified')).group(...)   // AND
r.middleware(hasPermission('edit posts')).group(...)
r.middleware(hasRoleOrPermission(['admin'], ['edit posts'])).group(...)
```

Middleware harus dipasang **setelah** middleware `auth` karena butuh `req.user`.

### Contoh route dengan gating

```js
r.middleware(auth).group((r) => {
  r.prefix('/users').group((r) => {
    r.middleware(hasPermission('view users')).group((r) => {
      r.get('/', UserController.index);
      r.get('/:id', UserController.show);
    });
    r.middleware(hasRole('admin')).group((r) => {
      r.delete('/:id', UserController.destroy);
    });
  });
});
```

Response endpoint `/api/v1/me` dan `/api/v1/login` sekarang menyertakan `roles[]` dan `permissions[]`.

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
