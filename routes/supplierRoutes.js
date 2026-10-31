const express = require('express');
const router = express.Router();
const Proveedor = require('../models/Proveedor');
const { getNextSequenceValue } = require('../utils/counter');
const auth = require('../middleware/auth');

// GET all suppliers (render view / api) - Acceso para Vendedor, Jefe y Administrador
router.get('/', async (req, res) => {
    try {
        const suppliers = await Proveedor.find().sort({ FechaRegistro: -1 });
        if (req.baseUrl.startsWith('/api')) {
            return res.json(suppliers);
        }
        res.render('suppliers', { 
            title: 'Proveedores - Comercial Agrícola Mares Cervantes',
            proveedores: suppliers 
        });
    } catch (err) {
        console.error(err);
        if (req.baseUrl.startsWith('/api')) {
            return res.status(500).json({ success: false, message: 'Error al obtener proveedores' });
        }
        res.status(500).render('error', { message: 'Error al obtener proveedores' });
    }
});

// POST new supplier
router.post('/', auth(), async (req, res) => {
    try {
        const { RazonSocial, RFC, Contacto, Correo, Telefono, Direccion, Ciudad, Estado_Prov, CodigoPostal } = req.body;
        
        const sequence = await getNextSequenceValue('proveedor_numero');
        const Numero_Proveedor = 'PROV' + sequence.toString().padStart(3, '0');

        const newSupplier = new Proveedor({
            Numero_Proveedor,
            RazonSocial,
            RFC,
            Contacto,
            Correo,
            Telefono,
            Direccion,
            Ciudad,
            Estado_Prov,
            CodigoPostal
        });
        await newSupplier.save();
        if (req.baseUrl.startsWith('/api')) {
            return res.status(201).json({ success: true, proveedor: newSupplier });
        }
        res.redirect('/suppliers');
    } catch (err) {
        console.error(err);
        if (req.baseUrl.startsWith('/api')) {
            return res.status(500).json({ success: false, message: 'Error al registrar proveedor' });
        }
        res.status(500).render('error', { message: 'Error al registrar proveedor' });
    }
});

// PUT update supplier
router.put('/:id', auth(), async (req, res) => {
    try {
        const supplier = await Proveedor.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
        }
        return res.json({ success: true, proveedor: supplier, message: 'Proveedor actualizado exitosamente' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error al actualizar proveedor: ' + err.message });
    }
});

// DELETE supplier
router.delete('/:id', auth(), async (req, res) => {
    try {
        const supplier = await Proveedor.findByIdAndDelete(req.params.id);
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
        }
        return res.json({ success: true, message: `Proveedor "${supplier.RazonSocial}" eliminado correctamente` });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error al eliminar proveedor: ' + err.message });
    }
});

module.exports = router;
