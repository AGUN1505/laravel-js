const Controller = require('./Controller');

class HomeController extends Controller {
  async index(req, res) {
    return res.render('home', {
      title: 'Home',
      message: 'Welcome to Laravel-Express',
    });
  }

  async about(req, res) {
    return res.render('about', {
      title: 'About',
    });
  }
}

module.exports = new HomeController();
