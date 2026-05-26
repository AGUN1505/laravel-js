const { Router } = require('../app/Http/Router');

const AuthController = require('../app/Http/Controllers/AuthController');
const UserController = require('../app/Http/Controllers/UserController');
const auth = require('../app/Http/Middleware/Authenticate');

const route = new Router();

route.prefix('/v1').group((r) => {
  r.post('/login', (req, res, next) => AuthController.apiLogin(req, res, next));
  r.post('/register', (req, res, next) => AuthController.apiRegister(req, res, next));

  r.middleware(auth).group((r) => {
    r.get('/me', (req, res, next) => AuthController.me(req, res, next));

    r.prefix('/users').group((r) => {
      r.get('/', (req, res, next) => UserController.index(req, res, next));
      r.post('/', (req, res, next) => UserController.store(req, res, next));
      r.get('/:id', (req, res, next) => UserController.show(req, res, next));
      r.put('/:id', (req, res, next) => UserController.update(req, res, next));
      r.delete('/:id', (req, res, next) => UserController.destroy(req, res, next));
    });
  });
});

module.exports = route.toExpress();
