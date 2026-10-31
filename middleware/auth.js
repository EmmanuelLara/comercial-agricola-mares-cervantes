const jwt = require('jsonwebtoken');

const auth = (roles = []) => {
    return (req, res, next) => {
        let token = req.cookies.token;

        // Soporte para Bearer token en cabecera Authorization (para frontends separados)
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            if (req.originalUrl.startsWith('/api')) {
                return res.status(401).json({ success: false, message: 'No autenticado' });
            }
            return res.redirect('/login');
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
            req.user = decoded;

            if (roles.length && !roles.includes(req.user.rol)) {
                if (req.originalUrl.startsWith('/api')) {
                    return res.status(403).json({ success: false, message: 'No tienes permisos para esta acción' });
                }
                return res.status(403).render('error', { message: 'No tienes permisos para acceder a esta sección' });
            }

            // Expose user to views
            res.locals.user = req.user;
            next();
        } catch (err) {
            res.clearCookie('token');
            if (req.originalUrl.startsWith('/api')) {
                return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
            }
            return res.redirect('/login');
        }
    };
};

module.exports = auth;
