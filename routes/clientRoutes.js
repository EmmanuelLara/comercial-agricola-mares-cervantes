const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');

// GET all clients
router.get('/', async (req, res) => {
    try {
        const clients = await Cliente.find();
        if (req.baseUrl.startsWith('/api')) {
            return res.json(clients);
        }
        res.render('clients', { title: 'Clientes - Comercial Agrícola Mares Cervantes', clients });
    } catch (err) {
        if (req.baseUrl.startsWith('/api')) {
            return res.status(500).json({ success: false, message: 'Error al obtener clientes' });
        }
        res.status(500).render('error', { message: 'Error al obtener clientes' });
    }
});

const { getNextSequenceValue } = require('../utils/counter');

// POST new client
router.post('/', async (req, res) => {
    try {
        const { 
            NombreCompleto, 
            RFC, 
            RazonSocial, 
            RegimenFiscal, 
            UsoCFDI,
            CodigoPostal, 
            Calle,
            Num_Ext,
            Num_Int,
            Colonia,
            Localidad,
            Municipio,
            EstadoGeografico,
            Correo,
            Telefono,
            Serie_Interno,
            Folio_Interno,
            Total_Deuda,
            Estado
        } = req.body;

        // Construir dirección combinada automáticamente
        const buildDireccion = (calle, ext, int_, colonia) => {
            const parts = [calle, ext].filter(Boolean).join(' ');
            const intPart = int_ ? `Int. ${int_}` : '';
            return [parts, intPart, colonia].filter(Boolean).join(', ');
        };
        
        let sequence = await getNextSequenceValue('cliente_numero');
        let Numero_Cliente = 'C' + sequence.toString().padStart(3, '0');
        while (await Cliente.exists({ Numero_Cliente })) {
            sequence = await getNextSequenceValue('cliente_numero');
            Numero_Cliente = 'C' + sequence.toString().padStart(3, '0');
        }
        const calculatedFolio = Folio_Interno ? String(Folio_Interno).trim() : sequence.toString().padStart(3, '0');

        const newClient = new Cliente({
            Numero_Cliente,
            Serie_Interno: Serie_Interno ? String(Serie_Interno).trim().toUpperCase() : 'A',
            Folio_Interno: calculatedFolio,
            NombreCompleto: String(NombreCompleto).trim(),
            RFC: (RFC || '').toUpperCase().trim(),
            RazonSocial: RazonSocial || NombreCompleto,
            RegimenFiscal: RegimenFiscal || '616 - Sin obligaciones fiscales',
            UsoCFDI: UsoCFDI || 'G03 - Gastos en general',
            Total_Deuda: Number(Total_Deuda) || 0,
            CodigoPostal: CodigoPostal || '',
            Calle: Calle || '',
            Num_Ext: Num_Ext || '',
            Num_Int: Num_Int || '',
            Colonia: Colonia || '',
            Direccion: buildDireccion(Calle, Num_Ext, Num_Int, Colonia),
            Localidad: Localidad || '',
            Municipio: Municipio || '',
            EstadoGeografico: EstadoGeografico || '',
            Correo: Correo || '',
            Telefono: Telefono || '',
            Estado: Estado || 'Activo'
        });
        await newClient.save();
        if (req.baseUrl.startsWith('/api')) {
            return res.status(201).json({ success: true, cliente: newClient });
        }
        res.redirect('/clients');
    } catch (err) {
        console.error(err);
        if (req.baseUrl.startsWith('/api')) {
            return res.status(500).json({ success: false, message: 'Error al registrar cliente: ' + err.message });
        }
        res.status(500).render('error', { message: 'Error al registrar cliente: ' + err.message });
    }
});

// PUT update client
router.put('/:id', async (req, res) => {
    try {
        const { 
            NombreCompleto, 
            RFC, 
            RazonSocial, 
            RegimenFiscal, 
            UsoCFDI,
            CodigoPostal, 
            Calle,
            Num_Ext,
            Num_Int,
            Colonia,
            Localidad,
            Municipio,
            EstadoGeografico,
            Correo,
            Telefono,
            Estado,
            Serie_Interno,
            Folio_Interno,
            Total_Deuda
        } = req.body;

        // Construir dirección combinada automáticamente
        const buildDireccion = (calle, ext, int_, colonia) => {
            const parts = [calle, ext].filter(Boolean).join(' ');
            const intPart = int_ ? `Int. ${int_}` : '';
            return [parts, intPart, colonia].filter(Boolean).join(', ');
        };
        
        const updateData = {
            NombreCompleto, 
            RFC: (RFC || '').toUpperCase().trim(), 
            RazonSocial: RazonSocial || NombreCompleto, 
            RegimenFiscal, 
            UsoCFDI: UsoCFDI || 'G03 - Gastos en general',
            CodigoPostal,
            Calle: Calle || '',
            Num_Ext: Num_Ext || '',
            Num_Int: Num_Int || '',
            Colonia: Colonia || '',
            Direccion: buildDireccion(Calle, Num_Ext, Num_Int, Colonia),
            Localidad: Localidad || '',
            Municipio: Municipio || '',
            EstadoGeografico: EstadoGeografico || '',
            Correo,
            Telefono: Telefono || '',
            Estado
        };

        if (Serie_Interno !== undefined) updateData.Serie_Interno = String(Serie_Interno).trim().toUpperCase();
        if (Folio_Interno !== undefined) updateData.Folio_Interno = String(Folio_Interno).trim();
        if (Total_Deuda !== undefined) updateData.Total_Deuda = Number(Total_Deuda) || 0;

        const client = await Cliente.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );
        if (!client) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
        }
        return res.json({ success: true, cliente: client, message: 'Cliente actualizado exitosamente' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error al actualizar cliente: ' + err.message });
    }
});

// POST /bulk - Importación masiva ultrarrápida de clientes desde Excel (soporta 4,000+ registros en <1 seg)
router.post('/bulk', async (req, res) => {
    try {
        const { clientes } = req.body;
        if (!Array.isArray(clientes) || clientes.length === 0) {
            return res.status(400).json({ success: false, message: 'Debe proporcionar una lista de clientes para importar' });
        }

        // Helper para extraer campos insensible a mayúsculas, espacios, guiones y acentos
        const getField = (obj, ...aliases) => {
            const keys = Object.keys(obj);
            for (const alias of aliases) {
                const normAlias = alias.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
                for (const k of keys) {
                    const normK = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
                    if (normK === normAlias && obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') {
                        return obj[k];
                    }
                }
            }
            return '';
        };

        // Función para saber si un RFC es genérico/público en general
        const isGenericOrEmptyRfc = (rfcStr) => {
            if (!rfcStr || typeof rfcStr !== 'string') return true;
            const clean = rfcStr.toUpperCase().trim();
            return clean.length < 9 || clean.startsWith('XAXX') || clean.startsWith('XEXX') || clean.includes('PUBLICO') || clean.includes('GENERAL');
        };

        // Cargar todos los clientes existentes en memoria en 1 sola consulta
        const allExisting = await Cliente.find({}, 'RFC NombreCompleto Serie_Interno Folio_Interno Numero_Cliente');
        const rfcMap = new Map();
        const nameMap = new Map();
        const existingNums = new Set();
        let maxExistingNum = 0;

        for (const c of allExisting) {
            const cleanRfc = (c.RFC || '').trim().toUpperCase();
            if (cleanRfc && !isGenericOrEmptyRfc(cleanRfc)) {
                rfcMap.set(cleanRfc, c._id);
            }
            if (c.NombreCompleto) {
                nameMap.set(c.NombreCompleto.trim().toLowerCase(), c._id);
            }
            if (c.Numero_Cliente) {
                const numStr = String(c.Numero_Cliente).trim();
                existingNums.add(numStr.toUpperCase());
                const digits = numStr.replace(/\D/g, '');
                if (digits) {
                    const parsed = parseInt(digits, 10);
                    if (parsed > maxExistingNum) maxExistingNum = parsed;
                }
            }
        }

        let nextSequenceNumber = maxExistingNum + 1;
        const generateUniqueClientNumber = () => {
            while (existingNums.has('C' + nextSequenceNumber.toString().padStart(3, '0'))) {
                nextSequenceNumber++;
            }
            const generated = 'C' + nextSequenceNumber.toString().padStart(3, '0');
            existingNums.add(generated);
            nextSequenceNumber++;
            return generated;
        };

        const bulkOps = [];
        let importadosCount = 0;
        let actualizadosCount = 0;

        for (const item of clientes) {
            // Extraer Nombre o Razón Social
            const nombreRaw = getField(item, 'NombreCompleto', 'CLIENTE', 'Cliente', 'NOMBRE', 'nombre', 'RazonSocial', 'RAZON_SOCIAL', 'razon_social', 'Razon Social');
            const rfcRaw = getField(item, 'RFC', 'Rfc', 'rfc', 'nif', 'NIF');
            
            // Si no tiene nombre ni RFC, saltar fila vacía
            if (!nombreRaw && !rfcRaw) continue;

            const cleanNombre = String(nombreRaw || rfcRaw).trim();
            const rfc = String(rfcRaw || 'XAXX010101000').toUpperCase().trim();
            const razonSocial = getField(item, 'RazonSocial', 'RAZON_SOCIAL', 'razon_social', 'Razon Social') || cleanNombre;
            const regimenFiscal = getField(item, 'RegimenFiscal', 'REGIMEN', 'Regimen', 'regimen_fiscal', 'regimen') || '616 - Sin obligaciones fiscales';
            const cp = String(getField(item, 'CodigoPostal', 'CP', 'CodPostal', 'codigo_postal', 'cp') || '20000').trim();
            const correo = String(getField(item, 'Correo', 'CORREO', 'Email', 'EMAIL', 'email', 'registros', 'correo') || '').trim();
            const telefono = String(getField(item, 'Telefono', 'TELEFONO', 'Tel', 'tel', 'telefono', 'referencia') || '').trim();
            const localidad = String(getField(item, 'Localidad', 'LOCALIDAD', 'localidad') || '').trim();
            const municipio = String(getField(item, 'Municipio', 'MUNICIPIO', 'municipio') || '').trim();
            const estadoGeo = String(getField(item, 'EstadoGeografico', 'ESTADO', 'Estado_Geo', 'estado', 'ESTADO_GEO', 'estado_geografico') || '').trim();
            const colonia = String(getField(item, 'Colonia', 'COLONIA', 'colonia') || '').trim();

            // Extraer campos de dirección separados
            const calle = String(getField(item, 'Calle', 'CALLE', 'calle', 'domicilio') || '').trim();
            const numExt = String(getField(item, 'Num_Ext', 'NUM_EXT', 'num_exterior', 'NumExt', 'numext', 'numero_exterior') || '').trim();
            const numInt = String(getField(item, 'Num_Int', 'NUM_INT', 'num_interior', 'NumInt', 'numint', 'numero_interior') || '').trim();

            // Construir dirección combinada
            let direccion = String(getField(item, 'Direccion', 'DIRECCION', 'direccion') || '').trim();
            if (!direccion) {
                const parts = [calle, numExt].filter(Boolean).join(' ');
                const intPart = numInt ? `Int. ${numInt}` : '';
                direccion = [parts, intPart, colonia].filter(Boolean).join(', ');
            }

            const serieInterno = String(getField(item, 'Serie_Interno', 'SERIE', 'Serie', 'SERIE_INTERNA', 'Serie_Interna', 'serie') || 'A').toUpperCase().trim();
            const folioInterno = String(getField(item, 'Folio_Interno', 'FOLIO', 'Folio', 'FOLIO_INTERNO', 'Folio_Interno', 'folio') || '').trim();
            const rawDeuda = getField(item, 'Total_Deuda', 'DEUDA', 'Deuda', 'TOTAL_DEUDA', 'Total_deuda', 'SALDO', 'Saldo', 'saldo') || 0;
            const totalDeuda = typeof rawDeuda === 'string' ? parseFloat(rawDeuda.replace(/[^0-9.-]+/g, '')) || 0 : Number(rawDeuda) || 0;

            let existingId = null;
            // Solo buscar por RFC si NO es un RFC genérico o vacío
            if (!isGenericOrEmptyRfc(rfc) && rfcMap.has(rfc)) {
                existingId = rfcMap.get(rfc);
            } else if (nameMap.has(cleanNombre.toLowerCase())) {
                existingId = nameMap.get(cleanNombre.toLowerCase());
            }

            if (existingId) {
                const updateDoc = {
                    $set: {
                        RazonSocial: razonSocial,
                        RegimenFiscal: regimenFiscal,
                        CodigoPostal: cp,
                        Calle: calle,
                        Num_Ext: numExt,
                        Num_Int: numInt,
                        Colonia: colonia,
                        Direccion: direccion,
                        Localidad: localidad,
                        Municipio: municipio,
                        EstadoGeografico: estadoGeo,
                        Serie_Interno: serieInterno,
                        Total_Deuda: totalDeuda
                    }
                };
                if (correo) updateDoc.$set.Correo = correo;
                if (telefono) updateDoc.$set.Telefono = telefono;
                if (folioInterno) updateDoc.$set.Folio_Interno = folioInterno;
                if (rfc && !isGenericOrEmptyRfc(rfc)) updateDoc.$set.RFC = rfc;

                bulkOps.push({
                    updateOne: {
                        filter: { _id: existingId },
                        update: updateDoc
                    }
                });
                actualizadosCount++;
            } else {
                const Numero_Cliente = generateUniqueClientNumber();
                const finalFolio = folioInterno ? folioInterno : Numero_Cliente.replace(/\D/g, '');

                bulkOps.push({
                    insertOne: {
                        document: {
                            Numero_Cliente,
                            Serie_Interno: serieInterno,
                            Folio_Interno: finalFolio,
                            NombreCompleto: cleanNombre,
                            RFC: rfc,
                            RazonSocial: razonSocial,
                            RegimenFiscal: regimenFiscal,
                            Total_Deuda: totalDeuda,
                            CodigoPostal: cp,
                            Calle: calle,
                            Num_Ext: numExt,
                            Num_Int: numInt,
                            Colonia: colonia,
                            Direccion: direccion,
                            Localidad: localidad,
                            Municipio: municipio,
                            EstadoGeografico: estadoGeo,
                            Correo: correo,
                            Telefono: telefono,
                            Estado: 'Activo',
                            FechaRegistro: new Date()
                        }
                    }
                });

                // Guardar en mapas temporales para evitar duplicados en el mismo archivo
                if (!isGenericOrEmptyRfc(rfc)) {
                    rfcMap.set(rfc, true);
                }
                nameMap.set(cleanNombre.toLowerCase(), true);
                importadosCount++;
            }
        }

        // Ejecutar en lotes de 1000 para máximo rendimiento
        if (bulkOps.length > 0) {
            const BATCH_SIZE = 1000;
            for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
                const batch = bulkOps.slice(i, i + BATCH_SIZE);
                await Cliente.bulkWrite(batch, { ordered: false });
            }
        }

        // Sincronizar el contador global con el último número asignado
        try {
            const Counter = require('../models/Counter');
            await Counter.findOneAndUpdate(
                { id: 'cliente_numero' },
                { $set: { seq: nextSequenceNumber } },
                { upsert: true }
            );
        } catch (counterErr) {
            console.warn('Advertencia al sincronizar Counter:', counterErr.message);
        }

        return res.json({ 
            success: true, 
            message: `¡Importación completada con éxito! Se procesaron ${clientes.length} filas: ${importadosCount} clientes nuevos creados y ${actualizadosCount} actualizados.` 
        });
    } catch (error) {
        console.error('Error en importación masiva de clientes:', error);
        return res.status(500).json({ success: false, message: 'Error en la importación: ' + error.message });
    }
});

// DELETE client
router.delete('/:id', async (req, res) => {
    try {
        const client = await Cliente.findByIdAndDelete(req.params.id);
        if (!client) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
        }
        return res.json({ success: true, message: `Cliente "${client.NombreCompleto}" eliminado correctamente` });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error al eliminar cliente: ' + err.message });
    }
});

module.exports = router;
