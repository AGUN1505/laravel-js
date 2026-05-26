const express = require('express');

class Router {
  constructor() {
    this.expressRouter = express.Router({ mergeParams: true });
    this._scope = { prefix: '', middleware: [] };
  }

  prefix(path) {
    return new Scope(this, { prefix: path, middleware: [] });
  }

  middleware(...mw) {
    return new Scope(this, { prefix: '', middleware: mw });
  }

  group(callback) {
    callback(this);
    return this;
  }

  get(path, ...handlers) { return this._add('get', path, handlers); }
  post(path, ...handlers) { return this._add('post', path, handlers); }
  put(path, ...handlers) { return this._add('put', path, handlers); }
  patch(path, ...handlers) { return this._add('patch', path, handlers); }
  delete(path, ...handlers) { return this._add('delete', path, handlers); }

  _add(method, path, handlers) {
    const fullPath = (this._scope.prefix + path) || '/';
    this.expressRouter[method](fullPath, ...this._scope.middleware, ...handlers);
    return this;
  }

  resource(name, controller, options = {}) {
    const base = name.startsWith('/') ? name : `/${name}`;
    const only = options.only || ['index', 'store', 'show', 'update', 'destroy'];
    const except = options.except || [];
    const enabled = only.filter((a) => !except.includes(a));

    const map = {
      index:   () => this.get(base, (req, res, next) => controller.index(req, res, next)),
      store:   () => this.post(base, (req, res, next) => controller.store(req, res, next)),
      show:    () => this.get(`${base}/:id`, (req, res, next) => controller.show(req, res, next)),
      update:  () => {
        this.put(`${base}/:id`, (req, res, next) => controller.update(req, res, next));
        this.patch(`${base}/:id`, (req, res, next) => controller.update(req, res, next));
      },
      destroy: () => this.delete(`${base}/:id`, (req, res, next) => controller.destroy(req, res, next)),
    };

    enabled.forEach((action) => map[action] && map[action]());
    return this;
  }

  toExpress() {
    return this.expressRouter;
  }
}

class Scope {
  constructor(router, opts) {
    this.router = router;
    this._prefix = opts.prefix || '';
    this._middleware = opts.middleware || [];
  }

  prefix(path) {
    return new Scope(this.router, {
      prefix: this._prefix + path,
      middleware: this._middleware,
    });
  }

  middleware(...mw) {
    return new Scope(this.router, {
      prefix: this._prefix,
      middleware: [...this._middleware, ...mw],
    });
  }

  group(callback) {
    const saved = this.router._scope;
    this.router._scope = {
      prefix: saved.prefix + this._prefix,
      middleware: [...saved.middleware, ...this._middleware],
    };
    try {
      callback(this.router);
    } finally {
      this.router._scope = saved;
    }
    return this.router;
  }
}

module.exports = { Router, Scope };
