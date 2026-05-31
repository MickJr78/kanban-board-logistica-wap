const { prisma } = require('../server');

const auditLogger = (action) => {
  return async (req, res, next) => {
    const oldData = req.method === 'PUT' || req.method === 'DELETE' ? await prisma.card.findUnique({ where: { id: req.params.id } }) : null;
    
    const originalSend = res.send;
    res.send = function(body) {
      if (res.statusCode < 300) {
        prisma.auditLog.create({
          data: {
            userId: req.user?.id,
            action,
            cardId: req.params.id || req.body?.id,
            oldValue: oldData || null,
            newValue: req.method !== 'DELETE' ? req.body : null
          }
        }).catch(() => {});
      }
      return originalSend.call(this, body);
    };
    next();
  };
};

module.exports = { auditLogger };