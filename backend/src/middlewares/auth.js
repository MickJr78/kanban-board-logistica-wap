const jwt = require('jsonwebtoken');

const PERMISSIONS = {
  ADMIN: ['create', 'read', 'update', 'delete', 'archive', 'export'],
  MANAGER: ['create', 'read', 'update', 'archive', 'export'],
  USER: ['create', 'read', 'update'],
  VIEWER: ['read']
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const authorize = (permission) => {
  return (req, res, next) => {
    const userPermissions = PERMISSIONS[req.user?.role] || [];
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorize, PERMISSIONS };