const { Router } = require('../app/Http/Router');

const AuthController = require('../app/Http/Controllers/AuthController');
const UserController = require('../app/Http/Controllers/UserController');
const RoleController = require('../app/Http/Controllers/RoleController');
const PermissionController = require('../app/Http/Controllers/PermissionController');
const MenuController = require('../app/Http/Controllers/MenuController');
const auth = require('../app/Http/Middleware/Authenticate');
const { hasPermission, requireSuperAdmin } = require('../app/Http/Middleware/Authorize');

const route = new Router();

route.prefix('/v1').group((r) => {
  r.post('/login', (req, res, next) => AuthController.apiLogin(req, res, next));
  r.post('/register', (req, res, next) => AuthController.apiRegister(req, res, next));

  r.middleware(auth).group((r) => {
    r.get('/me', (req, res, next) => AuthController.me(req, res, next));
    r.get('/menus/me', (req, res, next) => MenuController.myMenu(req, res, next));

    r.prefix('/users').group((r) => {
      r.middleware(hasPermission('view users')).group((r) => {
        r.get('/', (req, res, next) => UserController.index(req, res, next));
        r.get('/:id', (req, res, next) => UserController.show(req, res, next));
      });
      r.middleware(hasPermission('create users')).group((r) => {
        r.post('/', (req, res, next) => UserController.store(req, res, next));
      });
      r.middleware(hasPermission('edit users')).group((r) => {
        r.put('/:id', (req, res, next) => UserController.update(req, res, next));
      });
      r.middleware(requireSuperAdmin).group((r) => {
        r.delete('/:id', (req, res, next) => UserController.destroy(req, res, next));
        r.post('/:id/roles', (req, res, next) => UserController.assignRoles(req, res, next));
      });
    });

    r.prefix('/roles').group((r) => {
      r.middleware(hasPermission('view roles')).group((r) => {
        r.get('/', (req, res, next) => RoleController.index(req, res, next));
        r.get('/:id', (req, res, next) => RoleController.show(req, res, next));
      });
      r.middleware(requireSuperAdmin).group((r) => {
        r.post('/', (req, res, next) => RoleController.store(req, res, next));
        r.put('/:id', (req, res, next) => RoleController.update(req, res, next));
        r.delete('/:id', (req, res, next) => RoleController.destroy(req, res, next));
      });
    });

    r.prefix('/permissions').group((r) => {
      r.middleware(hasPermission('view permissions', 'view roles')).group((r) => {
        r.get('/', (req, res, next) => PermissionController.index(req, res, next));
        r.get('/:id', (req, res, next) => PermissionController.show(req, res, next));
      });
      r.middleware(requireSuperAdmin).group((r) => {
        r.post('/', (req, res, next) => PermissionController.store(req, res, next));
        r.put('/:id', (req, res, next) => PermissionController.update(req, res, next));
        r.delete('/:id', (req, res, next) => PermissionController.destroy(req, res, next));
      });
    });

    r.prefix('/menus').group((r) => {
      r.middleware(hasPermission('view menus')).group((r) => {
        r.get('/', (req, res, next) => MenuController.index(req, res, next));
        r.get('/tree', (req, res, next) => MenuController.tree(req, res, next));
        r.get('/:id', (req, res, next) => MenuController.show(req, res, next));
      });
      r.middleware(requireSuperAdmin).group((r) => {
        r.post('/', (req, res, next) => MenuController.store(req, res, next));
        r.post('/reorder', (req, res, next) => MenuController.reorder(req, res, next));
        r.put('/:id', (req, res, next) => MenuController.update(req, res, next));
        r.delete('/:id', (req, res, next) => MenuController.destroy(req, res, next));
      });
    });
  });
});

module.exports = route.toExpress();
