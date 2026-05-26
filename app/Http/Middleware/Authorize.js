const { User } = require('../../Models');

function unauthorized(res, message = 'Unauthorized') {
  return res.status(403).json({ success: false, message });
}

function unauthenticated(res) {
  return res.status(401).json({ success: false, message: 'Unauthenticated' });
}

async function isSuperAdmin(user) {
  return user.hasRole('superadmin');
}

exports.hasRole = (...roles) => async (req, res, next) => {
  if (!req.user) return unauthenticated(res);
  try {
    if (await isSuperAdmin(req.user)) return next();
    const list = roles.flat();
    const ok = await req.user.hasAnyRole(list);
    if (!ok) return unauthorized(res, `Requires role: ${list.join(' or ')}`);
    next();
  } catch (err) { next(err); }
};

exports.hasAllRoles = (...roles) => async (req, res, next) => {
  if (!req.user) return unauthenticated(res);
  try {
    if (await isSuperAdmin(req.user)) return next();
    const list = roles.flat();
    const ok = await req.user.hasAllRoles(list);
    if (!ok) return unauthorized(res, `Requires all roles: ${list.join(', ')}`);
    next();
  } catch (err) { next(err); }
};

exports.hasPermission = (...permissions) => async (req, res, next) => {
  if (!req.user) return unauthenticated(res);
  try {
    if (await isSuperAdmin(req.user)) return next();
    const list = permissions.flat();
    const ok = await req.user.hasAnyPermission(list);
    if (!ok) return unauthorized(res, `Requires permission: ${list.join(' or ')}`);
    next();
  } catch (err) { next(err); }
};

exports.hasRoleOrPermission = (roles, permissions) => async (req, res, next) => {
  if (!req.user) return unauthenticated(res);
  try {
    if (await isSuperAdmin(req.user)) return next();
    const roleOk = await req.user.hasAnyRole(Array.isArray(roles) ? roles : [roles]);
    if (roleOk) return next();
    const permOk = await req.user.hasAnyPermission(Array.isArray(permissions) ? permissions : [permissions]);
    if (permOk) return next();
    return unauthorized(res, 'Requires role or permission');
  } catch (err) { next(err); }
};

exports.requireSuperAdmin = async (req, res, next) => {
  if (!req.user) return unauthenticated(res);
  try {
    if (!(await isSuperAdmin(req.user))) {
      return unauthorized(res, 'Requires superadmin');
    }
    next();
  } catch (err) { next(err); }
};
