const Controller = require('./Controller');
const jwt = require('jsonwebtoken');
const { User } = require('../../Models');
const authConfig = require('../../../config/auth');

async function userPayload(user) {
  const data = user.toJSON();
  data.roles = await user.getRoleNames();
  data.permissions = await user.getPermissionNames();
  return data;
}

class AuthController extends Controller {
  async apiLogin(req, res) {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.checkPassword(password))) {
      return this.error(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign({ sub: user.id }, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.expiresIn,
    });

    return this.success(res, { token, user: await userPayload(user) }, 'Login successful');
  }

  async apiRegister(req, res) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return this.error(res, 'Name, email, and password are required', 422);
      }
      const user = await User.create({ name, email, password });
      await user.assignRole('user');
      const token = jwt.sign({ sub: user.id }, authConfig.jwt.secret, {
        expiresIn: authConfig.jwt.expiresIn,
      });
      return this.success(res, { token, user: await userPayload(user) }, 'Registration successful', 201);
    } catch (err) {
      return this.error(res, err.message, 422);
    }
  }

  async me(req, res) {
    return this.success(res, await userPayload(req.user));
  }
}

module.exports = new AuthController();
