const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// GET Login Page
router.get('/login', (req, res) => {
    if (req.cookies.token) return res.redirect('/');
    res.render('login', { layout: false, title: 'Iniciar Sesión - Comercial Agrícola Mares Cervantes', error: null });
});

// POST Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const cleanUsername = (username || '').trim();
        const cleanPassword = (password || '').trim();

        if (!cleanUsername || !cleanPassword) {
            return res.status(400).json({ success: false, message: 'Ingresa usuario y contraseña' });
        }

        const user = await Usuario.findOne({ 
            Usuario: new RegExp('^' + cleanUsername.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') 
        });

        if (!user || !(await user.comparePassword(cleanPassword))) {
            if (req.baseUrl.startsWith('/api')) {
                return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
            }
            return res.render('login', { 
                layout: false, 
                title: 'Iniciar Sesión - Comercial Agrícola Mares Cervantes', 
                error: 'Usuario o contraseña incorrectos' 
            });
        }

        const token = jwt.sign(
            { id: user._id, nombre: user.Nombre_completo, usuario: user.Usuario, rol: user.Rol },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '24h' }
        );

        if (req.baseUrl.startsWith('/api')) {
            // For API, we might want to return the token in the body OR as a cookie
            res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: 'lax' });
            return res.json({ 
                success: true, 
                token, 
                user: { id: user._id, nombre: user.Nombre_completo, usuario: user.Usuario, rol: user.Rol } 
            });
        }

        res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.redirect('/');
    } catch (err) {
        console.error(err);
        if (req.baseUrl.startsWith('/api')) {
            return res.status(500).json({ success: false, message: 'Ocurrió un error en el servidor' });
        }
        res.render('login', { 
            layout: false, 
            title: 'Iniciar Sesión - Comercial Agrícola Mares Cervantes', 
            error: 'Ocurrió un error en el servidor' 
        });
    }
});

// GET Verify / Current user session
const auth = require('../middleware/auth');
router.get('/verify', auth(), (req, res) => {
    res.json({ success: true, user: req.user });
});

router.get('/me', auth(), (req, res) => {
    res.json({ success: true, user: req.user });
});

// GET Logout
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    if (req.baseUrl.startsWith('/api')) {
        return res.json({ success: true, message: 'Sesión cerrada' });
    }
    res.redirect('/login');
});

module.exports = router;
