const crypto = require('crypto');
const { generarXmlCFDI40 } = require('./cfdiGenerator');

let FacturapiClass = null;
try {
    const pkg = require('facturapi');
    FacturapiClass = pkg.default || pkg;
} catch (e) {
    console.warn('[PAC] Facturapi SDK no disponible, usando simulador local.');
}

function extractCode(str, regex, defaultVal = '') {
    if (!str) return defaultVal;
    const match = str.match(regex);
    return match ? match[1] : defaultVal;
}

/**
 * Servicio de Timbrado de Facturas CFDI 4.0
 * Soporta Facturapi (Producción y Sandbox) y Simulación Local
 */
async function timbrarFactura(factura, negocioInfo) {
    const apiKey = negocioInfo?.FacturapiApiKey || process.env.FACTURAPI_KEY || process.env.FACTURAPI_SECRET_KEY;

    if (apiKey && FacturapiClass) {
        try {
            console.log(`[Facturapi] Iniciando timbrado con Facturapi para ${factura.RFC}...`);
            const facturapi = new FacturapiClass(apiKey.trim());

            // Mapear catálogo de régimen, uso y forma de pago a códigos SAT
            const regimenCode = extractCode(factura.RegimenFiscal, /^(\d{3})/, '612');
            const usoCode = extractCode(factura.UsoCFDI, /^([A-Z0-9]{3})/, 'G03');
            const formaPagoCode = extractCode(factura.FormaPago, /^(\d{2})/, '01');
            const metodoPagoCode = extractCode(factura.MetodoPago, /^([A-Z]{3})/, 'PUE');

            // Preparar conceptos para Facturapi
            const itemsFacturapi = (factura.Items || []).map(it => {
                const precio = Number(it.ValorUnitario) || 0;
                const cant = Number(it.Cantidad) || 1;
                const desc = Number(it.Descuento) || 0;

                const itemObj = {
                    quantity: cant,
                    product: {
                        description: it.Descripcion || 'Concepto Comercial',
                        product_key: extractCode(it.ClaveProdServ, /^(\d{8})/, '10151500'),
                        unit_key: extractCode(it.ClaveUnidad, /^([A-Z0-9]{2,3})/, 'H87'),
                        unit_name: it.Unidad || 'Pieza',
                        price: precio,
                        taxes: [
                            {
                                type: 'IVA',
                                rate: 0.16
                            }
                        ]
                    }
                };

                if (desc > 0) {
                    itemObj.discount = desc;
                }

                return itemObj;
            });

            const invoicePayload = {
                customer: {
                    legal_name: (factura.RazonSocial || 'PUBLICO EN GENERAL').trim(),
                    tax_id: (factura.RFC || 'XAXX010101000').toUpperCase().trim(),
                    tax_system: regimenCode,
                    address: {
                        zip: (factura.CodigoPostal || '20903').trim()
                    }
                },
                items: itemsFacturapi,
                use: usoCode,
                payment_form: formaPagoCode,
                payment_method: metodoPagoCode,
                series: factura.Serie || 'FAC'
            };

            if (factura.Email && factura.Email.includes('@')) {
                invoicePayload.customer.email = factura.Email.trim();
            }

            // Llamar a la API oficial de Facturapi
            const createdInvoice = await facturapi.invoices.create(invoicePayload);
            console.log(`[Facturapi] ¡Factura timbrada exitosamente! UUID: ${createdInvoice.uuid}`);

            // Descargar el XML timbrado oficial
            let xmlString = '';
            try {
                const xmlStream = await facturapi.invoices.downloadXml(createdInvoice.id);
                if (typeof xmlStream === 'string') {
                    xmlString = xmlStream;
                } else if (Buffer.isBuffer(xmlStream)) {
                    xmlString = xmlStream.toString('utf8');
                } else if (xmlStream && typeof xmlStream.pipe === 'function') {
                    const chunks = [];
                    for await (const chunk of xmlStream) {
                        chunks.push(chunk);
                    }
                    xmlString = Buffer.concat(chunks).toString('utf8');
                }
            } catch (xmlErr) {
                console.warn('[Facturapi] Advertencia al descargar XML:', xmlErr.message);
            }

            const isLive = apiKey.startsWith('sk_live');

            return {
                FacturapiId: createdInvoice.id,
                FolioFiscalUUID: createdInvoice.uuid,
                SelloCFDI: createdInvoice.stamp?.signature || '',
                SelloSAT: createdInvoice.stamp?.sat_signature || '',
                NoSerieCSD: createdInvoice.stamp?.sat_cert_number || '00001000000505123456',
                NoSerieSAT: createdInvoice.stamp?.sat_cert_number || '00001000000504465028',
                CadenaOriginalSAT: createdInvoice.stamp?.sat_signature ? `||1.1|${createdInvoice.uuid}|...||` : '',
                QrCodeUrl: createdInvoice.verification_url || `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${createdInvoice.uuid}`,
                XmlString: xmlString || generarXmlCFDI40(factura, negocioInfo, { uuid: createdInvoice.uuid, selloCFDI: createdInvoice.stamp?.signature, selloSAT: createdInvoice.stamp?.sat_signature }),
                ModoTimbrado: isLive ? 'Producción Oficial (Facturapi SAT)' : 'Pruebas (Facturapi Sandbox)'
            };
        } catch (apiErr) {
            console.error('[Facturapi] Error timbrando con Facturapi:', apiErr.message || apiErr);
            // Si el error es de validación SAT, lanzar el error descriptivo
            const errorMsg = apiErr.response?.data?.message || apiErr.message || 'Error en Facturapi';
            throw new Error(`Error en timbrado Facturapi SAT: ${errorMsg}`);
        }
    }

    // Si no hay API Key configurada, usar el motor de timbrado de prueba local (Sandbox)
    return timbrarFacturaPrueba(factura, negocioInfo);
}

/**
 * Motor de timbrado simulado local (Sandbox offline)
 */
async function timbrarFacturaPrueba(factura, negocioInfo) {
    const uuid = crypto.randomUUID().toUpperCase();
    const fechaISO = new Date().toISOString().substring(0, 19);

    const emisorRfc = (negocioInfo?.RFC || 'MACE680608RC7').toUpperCase().trim();
    const receptorRfc = (factura.RFC || 'XAXX010101000').toUpperCase().trim();
    const totalStr = (Number(factura.Total) || 0).toFixed(2);

    const hashInputCFDI = `${uuid}|${emisorRfc}|${receptorRfc}|${totalStr}|${fechaISO}`;
    const selloCFDI = crypto.createHash('sha256').update(hashInputCFDI + 'CFDI_KEY').digest('base64');
    const selloSAT = crypto.createHash('sha256').update(hashInputCFDI + 'SAT_KEY').digest('base64');

    const noCertificadoEmisor = '00001000000505123456';
    const noCertificadoSAT = '00001000000504465028';
    const rfcProvCertif = 'SAT970701NN3';

    const cadenaOriginalSAT = `||1.1|${uuid}|${fechaISO}|${rfcProvCertif}|${selloCFDI}|${noCertificadoSAT}||`;

    const datosTimbrado = {
        uuid,
        fechaTimbrado: fechaISO,
        selloCFDI,
        selloSAT,
        noCertificadoEmisor,
        noCertificadoSAT,
        rfcProvCertif
    };

    const xmlString = generarXmlCFDI40(factura, negocioInfo, datosTimbrado);

    const selloCFDISuffix = selloCFDI.substring(selloCFDI.length - 8);
    const qrCodeUrl = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${uuid}&re=${emisorRfc}&rr=${receptorRfc}&tt=${totalStr}&fe=${encodeURIComponent(selloCFDISuffix)}`;

    return {
        FacturapiId: '',
        FolioFiscalUUID: uuid,
        SelloCFDI: selloCFDI,
        SelloSAT: selloSAT,
        NoSerieCSD: noCertificadoEmisor,
        NoSerieSAT: noCertificadoSAT,
        CadenaOriginalSAT: cadenaOriginalSAT,
        QrCodeUrl: qrCodeUrl,
        XmlString: xmlString,
        ModoTimbrado: 'Prueba (Sandbox Local)'
    };
}

/**
 * Cancelación de Factura en Facturapi y SAT
 */
async function cancelarFacturaPAC(factura) {
    const apiKey = process.env.FACTURAPI_KEY || process.env.FACTURAPI_SECRET_KEY;
    if (apiKey && FacturapiClass && factura.FacturapiId) {
        try {
            console.log(`[Facturapi] Cancelando factura ${factura.FacturapiId} en el SAT...`);
            const facturapi = new FacturapiClass(apiKey.trim());
            const canceled = await facturapi.invoices.cancel(factura.FacturapiId, {
                motive: '02' // 02: Comprobante emitido con errores sin relación
            });
            return { success: true, canceled };
        } catch (err) {
            console.error('[Facturapi] Error al cancelar en Facturapi:', err.message);
            throw new Error(`Error al cancelar en el SAT (Facturapi): ${err.message}`);
        }
    }
    return { success: true, message: 'Cancelada en sistema local' };
}

module.exports = { 
    timbrarFactura, 
    timbrarFacturaPrueba,
    cancelarFacturaPAC
};

