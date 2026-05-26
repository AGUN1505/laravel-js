const express = require('express');

class Router {
  constructor(expressRouter = null) {
    this.router = expressRouter || express.Router({ mergeParams: true });
  }

  prefix(path) {
    return new RouteBuilder(this, { prefix: path });
  }

  middleware(...mw) {
    return new RouteBuilder(this, { middleware: mw });
  }

  group(callback) {
    callback(this);
    return this;
  }

  get(path, ...handlers) { this.router.get(path, ...handlers); return this; }
  post(path, ...handlers) { this.router.post(path, ...handlers); return this; }
  put(path, ...handlers) { this.router.put(path, ...handlers); return this; }
  patch(path, ...handlers) { this.router.patch(path, ...handlers); return this; }
  delete(path, ...handlers) { this.router.delete(path, ...handlers); return this; }

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
    return this.router;
  }
}

class RouteBuilder {
  constructor(parent, options = {}) {
    this.parent = parent;
    this._prefix = options.prefix || '';
    this._middleware = options.middleware || [];
  }

  prefix(path) {
    return new RouteBuilder(this.parent, {
      prefix: this._prefix + path,
      middleware: this._middleware,
    });
  }

  middleware(...mw) {
    return new RouteBuilder(this.parent, {
      prefix: this._prefix,
      middleware: [...this._middleware, ...mw],
    });
  }

  group(callback) {
    const subRouter = express.Router({ mergeParams: true });

    if (this._middleware.length) {
      subRouter.use(...this._middleware);
    }

    const subContext = new Router(subRouter);
    callback(subContext);

    this.parent.router.use(this._prefix || '/', subRouter);
    return this.parent;
  }
}

module.exports = { Router, RouteBuilder };
