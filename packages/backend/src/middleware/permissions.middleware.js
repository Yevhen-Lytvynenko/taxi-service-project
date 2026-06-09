"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOfficePermission = requireOfficePermission;
const officePermissions_1 = require("../lib/officePermissions");
const authorize_middleware_1 = require("./authorize.middleware");
function effectivePerm(user, key) {
    const fromJwt = user.perms?.[key];
    if (fromJwt === 'none' || fromJwt === 'read' || fromJwt === 'write') {
        return fromJwt;
    }
    if (!(0, authorize_middleware_1.isOfficeRole)(user.role)) {
        return 'none';
    }
    return (0, officePermissions_1.defaultPermissionsForLegacyRole)(user.role)[key];
}
/** Перевірка матриці дозволів офісу (JWT `perms` або дефолт за `role`). */
function requireOfficePermission(key, min) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!(0, authorize_middleware_1.isOfficeRole)(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        if (!(0, officePermissions_1.levelMeets)(effectivePerm(req.user, key), min)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}
//# sourceMappingURL=permissions.middleware.js.map