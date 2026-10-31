const express = require('express');
const router = express.Router();
const Compra = require('../models/Compra');
const Proveedor = require('../models/Proveedor');
const Producto = require('../models/Producto');
const auth = require('../middleware/auth');

// GET all purchases - Acceso para Vendedor, Jefe y Administrador
router.get('/', async (req, res) => {
    try {
        const purchases = await Compra.find()
            .populate('Id_Proveedor')
            .sort({ FechaRegistro: -1 });
        if (req.baseUrl.startsWith('/api')) {
            return res.json(purchases);
        }
        res.render('purchases', {
            title: 'Compras - Comercial Agrícola Mares Cervantes',
            purchases: purchases
        });
    } catch (err) {
        console.error(err);
        if (req.baseUrl.startsWith('/api')) {
            return res.status(500).json({ success: false, message: 'Error al obtener las compras' });
        }
        res.status(500).render('error', { message: 'Error al obtener las compras' });
    }
});

const { getNextSequenceValue } = require('../utils/counter');

// POST new purchase
router.post('/', auth(), async (req, res) => {
    try {
        const { Id_Proveedor, Tipodedocumento, MontoTotal, Detalles } = req.body;
        
        const sequence = await getNextSequenceValue('compra_folio');
        const Folio = 'COM' + sequence.toString().padStart(5, '0');

        const newPurchase = new Compra({
            Id_Proveedor,
            Tipodedocumento,
            Folio,
            MontoTotal,
            Detalles
        });

        await newPurchase.save();

        // Update Stock for each product
        for (const item of Detalles) {
            await Producto.findByIdAndUpdate(item.Id_Producto, {
                $inc: { Stock: item.Stock },
                $set: { 
                    Precio_Compra: item.Precio_Compra,
                    Precio_venta: item.Precio_venta || 0
                }
            });
        }

        if (req.baseUrl.startsWith('/api')) {
            return res.status(201).json({ success: true, compra: newPurchase });
        }
        res.redirect('/purchases');
    } catch (err) {
        console.error(err);
        if (req.baseUrl.startsWith('/api')) {
            return res.status(500).json({ success: false, message: 'Error al registrar la compra' });
        }
        res.status(500).render('error', { message: 'Error al registrar la compra' });
    }
});

// GET single purchase with details populated
router.get('/:id', async (req, res) => {
    try {
        const purchase = await Compra.findById(req.params.id).populate('Id_Proveedor');
        if (!purchase) {
            return res.status(404).json({ success: false, message: 'Compra no encontrada' });
        }

        const detallesConNombre = await Promise.all(
            purchase.Detalles.map(async (detalle) => {
                const producto = await Producto.findById(detalle.Id_Producto).select('Nombre Numero Codigo Codigo_Pieza');
                return {
                    ...detalle.toObject(),
                    Nombre_Producto: producto ? producto.Nombre : 'Producto eliminado',
                    Codigo_Producto: producto ? producto.Numero : 'N/A'
                };
            })
        );

        return res.json({ success: true, compra: { ...purchase.toObject(), Detalles: detallesConNombre } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error al obtener la compra: ' + err.message });
    }
});

// DELETE purchase
router.delete('/:id', auth(), async (req, res) => {
    try {
        const purchase = await Compra.findById(req.params.id);
        if (!purchase) {
            return res.status(404).json({ success: false, message: 'Compra no encontrada' });
        }

        // Revert stock
        for (const item of purchase.Detalles) {
            await Producto.findByIdAndUpdate(item.Id_Producto, {
                $inc: { Stock: -item.Stock }
            });
        }

        await Compra.findByIdAndDelete(req.params.id);
        return res.json({ success: true, message: `Compra #${purchase.Folio} cancelada y eliminada correctamente` });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error al eliminar compra: ' + err.message });
    }
});

module.exports = router;
