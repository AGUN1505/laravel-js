const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const fs = require('fs');

const appConfig = require('../config/app');
const authConfig = require('../config/auth');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (appConfig.debug) {
  app.use(morgan('dev'));
}

app.use(session({
  secret: authConfig.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: authConfig.session.cookie,
}));

const apiRoutes = require('../routes/api');
app.use('/api', apiRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/api')) {
    return res.status(500).json({
      success: false,
      message: appConfig.debug ? err.message : 'Server Error',
    });
  }
  next(err);
});

const buildPath = path.resolve(__dirname, '..', 'public', 'build');
const buildExists = fs.existsSync(path.join(buildPath, 'index.html'));

if (buildExists) {
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  app.use(express.static(path.resolve(__dirname, '..', 'public')));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).send(`
      <h1>React build not found</h1>
      <p>Untuk development, jalankan <code>npm run dev:client</code> dan buka <a href="http://localhost:5173">http://localhost:5173</a>.</p>
      <p>Atau build dulu: <code>npm run build</code> lalu jalankan <code>npm start</code>.</p>
    `);
  });
}

module.exports = app;
