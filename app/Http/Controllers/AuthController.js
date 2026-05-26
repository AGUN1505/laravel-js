const Controller = require('./Controller');
const jwt = require('jsonwebtoken');
const User = require('../../Models/User');
const authConfig = require('../../../config/auth');

class AuthController extends Controller {
  async showLogin(req, res) {
    return res.render('auth/login', { title: 'Login' });
  }

  async showRegister(req, res) {
    return res.render('auth/register', { title: 'Register' });
  }

  async register(req, res) {
    try {
      const { name, email, password } = req.body;
      const user = await User.create({ name, email, password });
      req.session.userId = user.id;
      req.session.flash = { success: 'Registration successful' };
      return res.redirect('/dashboard');
    } catch (err) {
      req.session.flash = { error: err.message };
      return res.redirect('/register');
    }
  }

  async login(req, res) {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.checkPassword(password))) {
      req.session.flash = { error: 'Invalid credentials' };
      return res.redirect('/login');
    }

    req.session.userId = user.id;
    return res.redirect('/dashboard');
  }

  async logout(req, res) {
    req.session.destroy(() => res.redirect('/login'));
  }

  async apiLogin(req, res) {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.checkPassword(password))) {
      return this.error(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign({ sub: user.id }, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.expiresIn,
    });

    return this.success(res, { token, user }, 'Login successful');
  }

  async apiRegister(req, res) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return this.error(res, 'Name, email, and password are required', 422);
      }
      const user = await User.create({ name, email, password });
      const token = jwt.sign({ sub: user.id }, authConfig.jwt.secret, {
        expiresIn: authConfig.jwt.expiresIn,
      });
      return this.success(res, { token, user }, 'Registration successful', 201);
    } catch (err) {
      return this.error(res, err.message, 422);
    }
  }

  async me(req, res) {
    return this.success(res, req.user);
  }
}

module.exports = new AuthController();
