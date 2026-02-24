/**
 * Permissions Middleware
 * 
 * Provides fine-grained module-based access control
 * for different roles in the fertility clinic
 */

const { ROLES, MODULES, PERMISSIONS, hasPermission, isAdminRole } = require('../config/roles.config');

/**
 * Middleware to check if user has access to a specific module
 * @param {string} module - The module to check access for
 * @param {string} requiredPermission - The permission level required (view, create, edit, delete)
 */
const requireModuleAccess = (module, requiredPermission = PERMISSIONS.VIEW) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                error: 'Authentication required' 
            });
        }

        const userRole = req.user.role;
        
        // Check if user has permission
        if (!hasPermission(userRole, module, requiredPermission)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                message: `You do not have ${requiredPermission} permission for the ${module} module`,
                requiredPermission,
                module,
                userRole
            });
        }

        // Add module info to request for potential use in controllers
        req.moduleAccess = {
            module,
            permission: requiredPermission,
            role: userRole
        };

        next();
    };
};

/**
 * Middleware to check if user has any of the specified permissions for a module
 * @param {string} module - The module to check access for
 * @param {string[]} permissions - Array of permissions (any one will grant access)
 */
const requireAnyModulePermission = (module, permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                error: 'Authentication required' 
            });
        }

        const userRole = req.user.role;
        
        // Check if user has any of the required permissions
        const hasAccess = permissions.some(permission => 
            hasPermission(userRole, module, permission)
        );
        
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                message: `You do not have required permissions for the ${module} module`,
                requiredPermissions: permissions,
                module,
                userRole
            });
        }

        req.moduleAccess = {
            module,
            permissions,
            role: userRole
        };

        next();
    };
};

/**
 * Middleware to check access to multiple modules (user needs access to all)
 * @param {Array<{module: string, permission: string}>} modulePermissions - Array of module/permission pairs
 */
const requireMultipleModuleAccess = (modulePermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                error: 'Authentication required' 
            });
        }

        const userRole = req.user.role;
        const missingPermissions = [];
        
        for (const { module, permission } of modulePermissions) {
            if (!hasPermission(userRole, module, permission)) {
                missingPermissions.push({ module, permission });
            }
        }
        
        if (missingPermissions.length > 0) {
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                message: 'You do not have all required permissions',
                missingPermissions,
                userRole
            });
        }

        req.moduleAccess = {
            modules: modulePermissions,
            role: userRole
        };

        next();
    };
};

/**
 * Middleware to check if user is an admin (owner or admin role)
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Authentication required' 
        });
    }

    if (!isAdminRole(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: 'Admin access required',
            message: 'This action requires administrator privileges',
            userRole: req.user.role
        });
    }

    next();
};

/**
 * Middleware to check if user is the clinic owner
 */
const requireOwner = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Authentication required' 
        });
    }

    if (req.user.role !== ROLES.OWNER) {
        return res.status(403).json({
            success: false,
            error: 'Owner access required',
            message: 'This action requires clinic owner privileges',
            userRole: req.user.role
        });
    }

    next();
};

/**
 * Middleware to add user permissions to response locals
 * Useful for frontend to know what user can access
 */
const attachUserPermissions = (req, res, next) => {
    if (req.user) {
        const { ROLE_PERMISSIONS } = require('../config/roles.config');
        const roleConfig = ROLE_PERMISSIONS[req.user.role];
        
        if (roleConfig) {
            req.userPermissions = {
                role: req.user.role,
                displayName: roleConfig.displayName,
                modules: roleConfig.modules
            };
        }
    }
    next();
};

module.exports = {
    requireModuleAccess,
    requireAnyModulePermission,
    requireMultipleModuleAccess,
    requireAdmin,
    requireOwner,
    attachUserPermissions,
    // Re-export for convenience
    MODULES,
    PERMISSIONS
};
