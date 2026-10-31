const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const { getNextSequenceValue } = require('../utils/counter');
const auth = require('../middleware/auth');

// Obtener todos los productos (Acceso para Vendedor, Jefe y Administrador)
router.get('/', async (req, res) => {
    try {
        const productos = await Producto.find().sort({ FechaRegistro: -1 });
        if (req.baseUrl.startsWith('/api')) {
            return res.json(productos);
        }
        res.render('inventory', { title: 'Inventario - Comercial Agrícola Mares Cervantes', productos });
    } catch (error) {
        if (req.baseUrl.startsWith('/api')) {
            return res.status(500).json({ success: false, error: error.message });
        }
        res.status(500).render('error', { error: error.message });
    }
});

// Crear producto (auto-merge: si ya existe por código de barras o nombre, suma el stock)
router.post('/', auth(), async (req, res) => {
    try {
        const { Codigo_Barras, Nombre, Stock, Precio_Compra, Precio_venta } = req.body;

        // Buscar producto existente por código de barras (validar rechazo si ya pertenece a otro)
        let existente = null;
        if (Codigo_Barras && Codigo_Barras.trim() !== '') {
            const porCodigo = await Producto.findOne({ Codigo_Barras: Codigo_Barras.trim() });
            if (porCodigo) {
                const nombreDiferente = Nombre && porCodigo.Nombre.trim().toLowerCase() !== Nombre.trim().toLowerCase();
                if (req.body.rechazarDuplicado || nombreDiferente) {
                    return res.status(400).json({
                        success: false,
                        rechazado: true,
                        message: 'CÓDIGO RECHAZADO: El código de barras "' + Codigo_Barras.trim() + '" ya está asignado al producto "' + porCodigo.Nombre + '" (' + porCodigo.Numero + '). No se permiten códigos duplicados.'
                    });
                }
                existente = porCodigo;
            }
        }
        if (!existente && Nombre && Nombre.trim() !== '') {
            existente = await Producto.findOne({ Nombre: { $regex: new RegExp(`^${Nombre.trim()}$`, 'i') } });
        }

        if (existente) {
            // Auto-merge: sumar stock y actualizar precios si se proporcionan
            const nuevoStock = (existente.Stock || 0) + (Number(Stock) || 0);
            const updateData = { Stock: nuevoStock };
            if (Precio_Compra) updateData.Precio_Compra = Number(Precio_Compra);
            if (Precio_venta) updateData.Precio_venta = Number(Precio_venta);

            const productoActualizado = await Producto.findByIdAndUpdate(
                existente._id,
                updateData,
                { new: true }
            );

            if (req.baseUrl.startsWith('/api')) {
                return res.status(200).json({
                    success: true,
                    merged: true,
                    message: `Producto "${existente.Nombre}" ya existía. Se sumaron ${Number(Stock) || 0} unidades al stock (Total: ${nuevoStock}).`,
                    producto: productoActualizado
                });
            }
            return res.redirect('/inventory');
        }

        // Producto nuevo: asignar número y crear
        if (!req.body.Numero) {
            const sequence = await getNextSequenceValue('producto_numero');
            req.body.Numero = 'P' + sequence.toString().padStart(3, '0');
        }
        const nuevoProducto = new Producto(req.body);
        await nuevoProducto.save();
        if (req.baseUrl.startsWith('/api')) {
            return res.status(201).json({ success: true, merged: false, producto: nuevoProducto });
        }
        res.redirect('/inventory');
    } catch (error) {
        if (req.baseUrl.startsWith('/api')) {
            return res.status(400).json({ success: false, error: error.message });
        }
        res.status(400).render('error', { error: "Error al crear el producto: " + error.message });
    }
});

// Actualizar producto
router.put('/:id', auth(), async (req, res) => {
    try {
        const producto = await Producto.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!producto) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        return res.json({ success: true, producto, message: 'Producto actualizado exitosamente' });
    } catch (error) {
        console.error(error);
        return res.status(400).json({ success: false, message: 'Error al actualizar producto: ' + error.message });
    }
});

const Compra = require('../models/Compra');
const Venta = require('../models/Venta');
const Salida = require('../models/Salida');

// Obtener Kardex / Historial de Movimientos de un Producto
router.get('/:id/kardex', async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);
        if (!producto) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        const [compras, ventas, salidas] = await Promise.all([
            Compra.find({ 'Detalles.Id_Producto': req.params.id }).populate('Id_Proveedor'),
            Venta.find({ 'Detalles.Id_Producto': req.params.id }),
            Salida.find({ Id_Producto: req.params.id, Estado: 'Registrada' })
        ]);

        const movimientos = [];

        // Entradas por compras
        compras.forEach(compra => {
            compra.Detalles.forEach(det => {
                if (det.Id_Producto.toString() === req.params.id.toString()) {
                    movimientos.push({
                        id: compra._id + '_' + det._id,
                        fecha: compra.FechaRegistro,
                        tipo: 'ENTRADA',
                        concepto: 'Compra / Reabastecimiento',
                        folio: compra.Folio,
                        documento: compra.Tipodedocumento,
                        contacto: compra.Id_Proveedor?.RazonSocial || compra.Id_Proveedor?.Nombre_Contacto || 'Proveedor',
                        cantidad: Number(det.Stock),
                        precioUnitario: Number(det.Precio_Compra),
                        total: Number(det.Stock) * Number(det.Precio_Compra)
                    });
                }
            });
        });

        // Salidas por ventas
        ventas.forEach(venta => {
            venta.Detalles.forEach(det => {
                if (det.Id_Producto.toString() === req.params.id.toString()) {
                    movimientos.push({
                        id: venta._id + '_' + det._id,
                        fecha: venta.FechaRegistro,
                        tipo: 'SALIDA',
                        concepto: 'Venta Mostrador',
                        folio: venta.Folio,
                        documento: venta.Tipodedocumento,
                        contacto: venta.Nombre_Cliente || 'Cliente General',
                        cantidad: Number(det.Cantidad),
                        precioUnitario: Number(det.Precio_Venta),
                        total: Number(det.Cantidad) * Number(det.Precio_Venta)
                    });
                }
            });
        });

        // Salidas por Despacho de Aceite o Insumo para Trabajos
        salidas.forEach(salida => {
            movimientos.push({
                id: salida._id.toString(),
                fecha: salida.Fecha,
                tipo: 'SALIDA',
                concepto: `${salida.TipoSalida}: ${salida.DestinoTrabajo || 'Consumo Taller'}`,
                folio: salida.Folio,
                documento: 'Vale de Salida',
                contacto: salida.Solicitante || salida.Nombre_Cliente || 'Taller',
                cantidad: Number(salida.Cantidad),
                precioUnitario: Number(salida.PrecioUnitario || salida.CostoUnitario || 0),
                total: Number(salida.Total || (salida.Cantidad * (salida.PrecioUnitario || 0)))
            });
        });

        // Ordenar por fecha ascendente para calcular saldo acumulativo
        movimientos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        let saldoAcumulado = 0;
        const movimientosConSaldo = movimientos.map(mov => {
            if (mov.tipo === 'ENTRADA') {
                saldoAcumulado += mov.cantidad;
            } else {
                saldoAcumulado -= mov.cantidad;
            }
            return {
                ...mov,
                saldo: saldoAcumulado
            };
        });

        return res.json({
            success: true,
            producto,
            totalEntradas: movimientos.filter(m => m.tipo === 'ENTRADA').reduce((a, m) => a + m.cantidad, 0),
            totalSalidas: movimientos.filter(m => m.tipo === 'SALIDA').reduce((a, m) => a + m.cantidad, 0),
            movimientos: movimientosConSaldo.reverse() // Mostrar los más recientes primero para la vista
        });
    } catch (error) {
        console.error('Error al generar kardex:', error);
        return res.status(500).json({ success: false, message: 'Error al generar el Kardex: ' + error.message });
    }
});

// Importación masiva ultrarrápida desde Excel (.xlsx / .csv) - Soporta 4,000+ productos en <1 segundo
router.post('/bulk', auth(), async (req, res) => {
    try {
        const { productos } = req.body;
        if (!Array.isArray(productos) || productos.length === 0) {
            return res.status(400).json({ success: false, message: 'Debe proporcionar una lista de productos para importar' });
        }

        // Cargar todos los productos existentes en memoria en 1 sola consulta
        const allExisting = await Producto.find({}, 'Numero Codigo_Barras Nombre Stock Precio_Compra Precio_venta Ubicacion');
        const numeroMap = new Map();
        const barcodeMap = new Map();
        const nameMap = new Map();

        for (const p of allExisting) {
            if (p.Numero && String(p.Numero).trim() !== '') {
                numeroMap.set(String(p.Numero).trim(), p._id);
            }
            if (p.Codigo_Barras && String(p.Codigo_Barras).trim() !== '') {
                barcodeMap.set(String(p.Codigo_Barras).trim(), p._id);
            }
            if (p.Nombre) {
                nameMap.set(String(p.Nombre).trim().toLowerCase(), p._id);
            }
        }

        let seqCounter = await getNextSequenceValue('producto_numero');
        const bulkOps = [];
        let importadosCount = 0;
        let actualizadosCount = 0;

        // Helper para extraer el valor de una propiedad flexibilizando variaciones de nombres de columnas de Excel
        const getFieldValue = (item, candidateKeys, fieldType = '') => {
            // 1. Coincidencia exacta por lista de candidatos
            for (const key of candidateKeys) {
                if (item[key] !== undefined && item[key] !== null && String(item[key]).trim() !== '') {
                    return String(item[key]).trim();
                }
            }

            const itemKeys = Object.keys(item);

            // 2. Búsqueda por encabezado normalizado (sin acentos ni caracteres especiales)
            const normCandidates = candidateKeys.map(cand =>
                cand.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "")
            );

            for (const k of itemKeys) {
                if (item[k] === undefined || item[k] === null || String(item[k]).trim() === '') continue;
                const normKey = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");

                if (normCandidates.includes(normKey)) {
                    return String(item[k]).trim();
                }
            }

            // 3. Coincidencia parcial/difusa según tipo de campo
            for (const k of itemKeys) {
                if (item[k] === undefined || item[k] === null || String(item[k]).trim() === '') continue;
                const normKey = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");

                if (fieldType === 'codigo_barras') {
                    if (normKey.includes('BARRA') || normKey.includes('BARCODE') || normKey.includes('CODIGO') || normKey.includes('PIEZ') || normKey === 'COD') {
                        return String(item[k]).trim();
                    }
                } else if (fieldType === 'ubicacion') {
                    if (normKey.includes('ESTANT') || normKey.includes('UBIC') || normKey.includes('ESTANTE')) {
                        return String(item[k]).trim();
                    }
                } else if (fieldType === 'precio_compra') {
                    if (normKey.includes('COMPR') || normKey.includes('COSTO')) {
                        return String(item[k]).trim();
                    }
                } else if (fieldType === 'precio_venta') {
                    if ((normKey.includes('VENTA') || normKey === 'PRECIO') && !normKey.includes('COMPR')) {
                        return String(item[k]).trim();
                    }
                } else if (fieldType === 'stock') {
                    if (normKey.includes('STOCK') || normKey.includes('CANTID') || normKey.includes('EXISTEN')) {
                        return String(item[k]).trim();
                    }
                }
            }

            return '';
        };

        const parseNum = (val) => {
            if (val === undefined || val === null || val === '') return 0;
            if (typeof val === 'number') return isNaN(val) ? 0 : val;

            let str = String(val).trim();
            if (str === '-' || str === '—' || str === '') return 0;

            // Remover símbolo de moneda y espacios
            str = str.replace(/[$sS]/g, '').trim();

            if (str.includes(',') && str.includes('.')) {
                if (str.lastIndexOf('.') > str.lastIndexOf(',')) {
                    str = str.replace(/,/g, '');
                } else {
                    str = str.replace(/\./g, '').replace(/,/g, '.');
                }
            } else if (str.includes(',')) {
                const parts = str.split(',');
                if (parts.length === 2 && parts[1].length <= 2) {
                    str = str.replace(',', '.');
                } else {
                    str = str.replace(/,/g, '');
                }
            }

            const clean = str.replace(/[^0-9.-]/g, '');
            const num = parseFloat(clean);
            return isNaN(num) ? 0 : num;
        };

        for (const item of productos) {
            const nombreCandidate = getFieldValue(item, [
                'NOMBRE', 'Nombre', 'Nombre de Refacción', 'NOMBRE REFACCIÓN', 'PRODUCTO', 'Producto', 'Nombre_Producto'
            ], 'nombre');

            const descripcionCandidate = getFieldValue(item, [
                'DESCRIPCIÓN', 'DESCRIPCION', 'Descripcion', 'Descripción', 'DETALLE', 'Detalle', 'NOTAS', 'Notas'
            ], 'descripcion');

            const cleanNombre = nombreCandidate || descripcionCandidate;
            if (!cleanNombre) continue;

            const descripcion = (nombreCandidate && descripcionCandidate && nombreCandidate !== descripcionCandidate) 
                ? descripcionCandidate 
                : (item.Descripcion || item['DESCRIPCIÓN'] || '');

            const numeroCandidate = getFieldValue(item, [
                'ID SISTEMA', 'ID Sistema', 'Numero', 'NUMERO', 'PROD'
            ], 'numero');

            const codigoBarras = getFieldValue(item, [
                'CÓDIGO DE BARRAS', 'CODIGO DE BARRAS', 'CÓD. BARRAS', 'COD. BARRAS', 'Codigo_Barras', 'BARCODE', 'Barcode', 'Codigo Barras', 'CÓDIGO', 'CODIGO', 'Código', 'Codigo', 'CÓD. PIEZ.', 'COD. PIEZ.'
            ], 'codigo_barras');

            const stockVal = getFieldValue(item, [
                'STOCK', 'Stock', 'Stock Actual', 'CANTIDAD', 'Cantidad', 'EXISTENCIA', 'Existencia'
            ], 'stock');
            const stock = parseNum(stockVal);

            const stockMinimoVal = getFieldValue(item, [
                'STOCK MÍNIMO', 'STOCK MINIMO', 'Stock Mínimo', 'Stock Minimo', 'MÍNIMO', 'MINIMO', 'PUNTO DE REORDEN'
            ], 'stock_minimo');
            const stockMinimo = parseNum(stockMinimoVal) || 2;

            const precioCompraVal = getFieldValue(item, [
                'P. COMPRA', 'P.COMPRA', 'P. COMPR', 'P.COMPR', 'PRECIO COMPRA', 'Precio Compra ($)', 'Precio Compra', 'Precio_Compra', 'COSTO', 'Costo', 'P COMPRA'
            ], 'precio_compra');
            const precioCompra = parseNum(precioCompraVal);

            const precioVentaVal = getFieldValue(item, [
                'P. VENTA', 'P.VENTA', 'PRECIO VENTA', 'Precio Venta ($)', 'Precio Venta', 'Precio_venta', 'Precio_Venta', 'PRECIO', 'Precio', 'P VENTA'
            ], 'precio_venta');
            const precioVenta = parseNum(precioVentaVal);

            const ubicacion = getFieldValue(item, [
                'ESTANTERÍA / UB', 'ESTANTERIA / UB', 'ESTANTERÍA / UB.', 'ESTANTERIA / UB.', 'ESTANTERÍA / UBIC.', 'ESTANTERIA / UBIC.', 'ESTANTERÍA / UBICAC.', 'ESTANTERÍA / UBICACIÓN', 'ESTANTERIA / UBICACION', 'Estantería / Ubicación', 'Ubicacion', 'UBICACION', 'Ubicación', 'UBICACIÓN', 'Ubicacion_Estanteria', 'ESTANTE', 'Estanteria', 'Estantería'
            ], 'ubicacion') || 'SIN ESTANTE';

            const estado = getFieldValue(item, [
                'ESTADO', 'Estado'
            ], 'estado') || 'Activo';

            // Auto-merge: buscar por Numero, Codigo_Barras o Nombre
            let existingId = null;
            if (numeroCandidate && numeroMap.has(numeroCandidate)) {
                existingId = numeroMap.get(numeroCandidate);
            } else if (codigoBarras && barcodeMap.has(codigoBarras)) {
                existingId = barcodeMap.get(codigoBarras);
            } else if (nameMap.has(cleanNombre.toLowerCase())) {
                existingId = nameMap.get(cleanNombre.toLowerCase());
            }

            if (existingId) {
                const updateDoc = {};
                if (stock > 0) {
                    updateDoc.$inc = { Stock: stock };
                }

                const setDoc = {};
                if (codigoBarras) setDoc.Codigo_Barras = codigoBarras;
                if (descripcion) setDoc.Descripcion = descripcion;
                if (stockMinimoVal) setDoc.Stock_Minimo = stockMinimo;
                if (precioCompra > 0) setDoc.Precio_Compra = precioCompra;
                if (precioVenta > 0) setDoc.Precio_venta = precioVenta;
                if (ubicacion && ubicacion !== 'SIN ESTANTE') setDoc.Ubicacion = ubicacion;
                if (estado) setDoc.Estado = estado;

                if (Object.keys(setDoc).length > 0) updateDoc.$set = setDoc;

                if (Object.keys(updateDoc).length > 0) {
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: existingId },
                            update: updateDoc
                        }
                    });
                    actualizadosCount++;
                }
            } else {
                const currentSeq = seqCounter++;
                const Numero = 'PROD-' + currentSeq.toString().padStart(4, '0');
                const newId = new mongoose.Types.ObjectId();

                bulkOps.push({
                    insertOne: {
                        document: {
                            _id: newId,
                            Numero,
                            Codigo_Barras: codigoBarras,
                            Nombre: cleanNombre,
                            Descripcion: descripcion,
                            Stock: stock,
                            Stock_Minimo: stockMinimo,
                            Precio_Compra: precioCompra,
                            Precio_venta: precioVenta,
                            Ubicacion: ubicacion,
                            Estado: estado,
                            FechaRegistro: new Date()
                        }
                    }
                });

                if (codigoBarras) barcodeMap.set(codigoBarras, newId);
                nameMap.set(cleanNombre.toLowerCase(), newId);
                importadosCount++;
            }
        }

        // Ejecutar operaciones en lotes de 1000
        if (bulkOps.length > 0) {
            const BATCH_SIZE = 1000;
            for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
                const batch = bulkOps.slice(i, i + BATCH_SIZE);
                await Producto.bulkWrite(batch, { ordered: false });
            }
        }

        return res.json({ 
            success: true, 
            message: `¡Importación completada con éxito! Se procesaron ${productos.length} filas: ${importadosCount} refacciones nuevas agregadas y ${actualizadosCount} actualizadas.` 
        });
    } catch (error) {
        console.error('Error en importación masiva de productos:', error);
        return res.status(500).json({ success: false, message: 'Error en la importación: ' + error.message });
    }
});

// Eliminar producto
router.delete('/:id', auth(), async (req, res) => {
    try {
        const producto = await Producto.findByIdAndDelete(req.params.id);
        if (!producto) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        return res.json({ success: true, message: `Producto "${producto.Nombre}" eliminado correctamente` });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error al eliminar producto: ' + error.message });
    }
});


// Analizador de tablas de productos: Valida y rechaza códigos duplicados o inválidos
router.post('/analizar-tabla', auth(), async (req, res) => {
    try {
        const { productos } = req.body;
        if (!Array.isArray(productos) || productos.length === 0) {
            return res.status(400).json({ success: false, message: 'Se requiere una lista de productos o filas para analizar.' });
        }

        const dbProducts = await Producto.find({}, 'Codigo_Barras Numero Nombre Stock Precio_venta');
        const dbBarcodeMap = new Map();
        dbProducts.forEach(p => {
            if (p.Codigo_Barras && p.Codigo_Barras.trim()) {
                dbBarcodeMap.set(p.Codigo_Barras.trim().toLowerCase(), p);
            }
        });

        const vistosEnArchivo = new Set();
        const validos = [];
        const rechazados = [];

        productos.forEach((item, index) => {
            const filaNum = index + 1;
            const nombre = (item.Nombre || item.DESCRIPCION || item['DESCRIPCIÓN'] || item.Nombre_Producto || item.Descripcion || '').toString().trim();
            const codigo = (item.Codigo_Barras || item.CODIGO || item['CÓDIGO'] || item.Codigo || item.Numero || item.Barcode || '').toString().trim();

            if (!nombre) {
                rechazados.push({
                    fila: filaNum,
                    codigo: codigo || 'S/C',
                    nombre: '(Sin nombre)',
                    motivo: 'Falta nombre o descripción del producto'
                });
                return;
            }

            if (codigo) {
                const codLower = codigo.toLowerCase();
                if (vistosEnArchivo.has(codLower)) {
                    rechazados.push({
                        fila: filaNum,
                        codigo,
                        nombre,
                        motivo: 'Código duplicado dentro de la misma tabla'
                    });
                    return;
                }
                vistosEnArchivo.add(codLower);

                if (dbBarcodeMap.has(codLower)) {
                    const existente = dbBarcodeMap.get(codLower);
                    rechazados.push({
                        fila: filaNum,
                        codigo,
                        nombre,
                        motivo: 'Código rechazado: ya existe en inventario asignado a "' + existente.Nombre + '" (' + existente.Numero + ')'
                    });
                    return;
                }
            }

            validos.push({
                fila: filaNum,
                codigo: codigo || 'AUTOMÁTICO',
                nombre,
                precio: Number(item.Precio_venta || item.Precio || item.PRECIO || 0),
                stock: Number(item.Stock || item.Cantidad || item.STOCK || 0)
            });
        });

        return res.json({
            success: true,
            totalFilas: productos.length,
            totalValidos: validos.length,
            totalRechazados: rechazados.length,
            validos,
            rechazados
        });
    } catch (err) {
        console.error('Error al analizar tabla:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

