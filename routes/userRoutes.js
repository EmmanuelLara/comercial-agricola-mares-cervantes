const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const auth = require('../middleware/auth');

// GET all users
router.get('/', async (req, res) => {
    try {
        const users = await Usuario.find().select('-Clave');
        if (req.baseUrl.startsWith('/api')) {
            return res.json(users);
        }
        res.render('users', { title: 'Usuarios - Comercial Agrícola Mares Cervantes', users });
    } catch (err) {
        if (req.baseUrl.startsWith('/api')) {
            return res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
        }
        res.status(500).render('error', { message: 'Error al obtener usuarios' });
    }
});

const { getNextSequenceValue } = require('../utils/counter');

// POST new user - Solo Administrador
router.post('/', auth(['Administrador']), async (req, res) => {
    try {
        const { Nombre_completo, Usuario: username, Clave, Rol } = req.body;
        
        const sequence = await getNextSequenceValue('usuario_matricula');
        const Matricula_Usuario = sequence.toString().padStart(3, '0');

        const newUser = new Usuario({
            Matricula_Usuario,
            Nombre_completo,
            Usuario: username,
            Clave,
            Rol
        });
        await newUser.save();
        if (req.baseUrl.startsWith('/api')) {
            return res.status(201).json({ success: true, usuario: { ...newUser.toObject(), Clave: undefined } });
        }
        res.redirect('/users');
    } catch (err) {
        console.error(err);
        if (req.baseUrl.startsWith('/api')) {
            return res.status(500).json({ success: false, message: 'Error al registrar usuario: ' + err.message });
        }
        res.status(500).render('error', { message: 'Error al registrar usuario: ' + err.message });
    }
});

// PUT update user - Solo Administrador
router.put('/:id', auth(['Administrador']), async (req, res) => {
    try {
        const { Nombre_completo, Usuario: username, Clave, Rol } = req.body;
        const userId = req.params.id;

        const user = await Usuario.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        // Update fields
        if (Nombre_completo) user.Nombre_completo = Nombre_completo;
        if (username) user.Usuario = username;
        if (Rol) user.Rol = Rol;

        // Only update password if a new one was provided
        if (Clave && Clave.trim() !== '') {
            user.Clave = Clave; // The pre-save hook will hash it
            user.markModified('Clave');
        } else {
            // Don't trigger the password hash if not changed
            user.$locals.skipPasswordHash = true;
        }

        await user.save();
        return res.json({ success: true, message: 'Usuario actualizado correctamente' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error al actualizar usuario: ' + err.message });
    }
});

// DELETE user - Solo Administrador
router.delete('/:id', auth(['Administrador']), async (req, res) => {
    try {
        const userId = req.params.id;

        // Protect: cannot delete yourself
        if (req.user && req.user.id === userId) {
            return res.status(400).json({ success: false, message: 'No puedes eliminar tu propia cuenta' });
        }

        const user = await Usuario.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        return res.json({ success: true, message: `Usuario "${user.Nombre_completo}" eliminado correctamente` });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error al eliminar usuario: ' + err.message });
    }
});

module.exports = router;

