/**
 * Generador de documento XML CFDI 4.0 oficial del SAT
 */

function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function extractRegimenCode(regimenStr) {
    if (!regimenStr) return '612';
    const match = regimenStr.match(/^(\d{3})/);
    return match ? match[1] : '612';
}

function extractUsoCfdiCode(usoStr) {
    if (!usoStr) return 'G03';
    const match = usoStr.match(/^([A-Z0-9]{3})/);
    return match ? match[1] : 'G03';
}

function extractFormaPagoCode(formaStr) {
    if (!formaStr) return '01';
    const match = formaStr.match(/^(\d{2})/);
    return match ? match[1] : '01';
}

function extractMetodoPagoCode(metodoStr) {
    if (!metodoStr) return 'PUE';
    const match = metodoStr.match(/^([A-Z]{3})/);
    return match ? match[1] : 'PUE';
}

function generarXmlCFDI40(factura, negocioInfo, datosTimbrado) {
    const fechaISO = new Date(factura.FechaEmision || Date.now()).toISOString().substring(0, 19);

    const emisorRfc = escapeXml((negocioInfo?.RFC || 'MACE680608RC7').toUpperCase().trim());
    const emisorNombre = escapeXml(negocioInfo?.RazonSocial || 'ERNESTO MARES DE LA CRUZ');
    const emisorRegimen = extractRegimenCode(negocioInfo?.RegimenFiscal);
    const lugarExpedicion = escapeXml(negocioInfo?.CodigoPostal || '20903');

    const receptorRfc = escapeXml((factura.RFC || 'XAXX010101000').toUpperCase().trim());
    const receptorNombre = escapeXml(factura.RazonSocial || 'PÚBLICO EN GENERAL');
    const receptorRegimen = extractRegimenCode(factura.RegimenFiscal);
    const receptorUso = extractUsoCfdiCode(factura.UsoCFDI);
    const receptorCp = escapeXml(factura.CodigoPostal || '36700');

    const subtotalStr = (Number(factura.Subtotal) || 0).toFixed(2);
    const totalStr = (Number(factura.Total) || 0).toFixed(2);
    const ivaTotalStr = (Number(factura.IVATotal) || 0).toFixed(2);

    const uuid = datosTimbrado.uuid;
    const fechaTimbrado = datosTimbrado.fechaTimbrado || fechaISO;
    const selloCFDI = datosTimbrado.selloCFDI;
    const selloSAT = datosTimbrado.selloSAT;
    const noCertificadoSAT = datosTimbrado.noCertificadoSAT || '00001000000504465028';
    const noCertificadoEmisor = datosTimbrado.noCertificadoEmisor || '00001000000505123456';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante 
    xmlns:cfdi="http://www.sat.gob.mx/cfd/4" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
    xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" 
    xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd" 
    Version="4.0" 
    Serie="${escapeXml(factura.Serie || 'FAC')}" 
    Folio="${escapeXml(factura.Folio || '1')}" 
    Fecha="${fechaISO}" 
    Sello="${escapeXml(selloCFDI)}" 
    FormaPago="${extractFormaPagoCode(factura.FormaPago)}" 
    NoCertificado="${noCertificadoEmisor}" 
    SubTotal="${subtotalStr}" 
    Moneda="MXN" 
    Total="${totalStr}" 
    TipoDeComprobante="I" 
    Exportacion="01" 
    MetodoPago="${extractMetodoPagoCode(factura.MetodoPago)}" 
    LugarExpedicion="${lugarExpedicion}">
    <cfdi:Emisor Rfc="${emisorRfc}" Nombre="${emisorNombre}" RegimenFiscal="${emisorRegimen}" />
    <cfdi:Receptor Rfc="${receptorRfc}" Nombre="${receptorNombre}" DomicilioFiscalReceptor="${receptorCp}" RegimenFiscalReceptor="${receptorRegimen}" UsoCFDI="${receptorUso}" />
    <cfdi:Conceptos>`;

    (factura.Items || []).forEach(it => {
        const cantStr = (Number(it.Cantidad) || 1).toString();
        const valUnitStr = (Number(it.ValorUnitario) || 0).toFixed(2);
        const impStr = (Number(it.Importe) || 0).toFixed(2);
        const ivaStr = (Number(it.IVA) || 0).toFixed(2);

        xml += `
        <cfdi:Concepto ClaveProdServ="${escapeXml(it.ClaveProdServ || '10151500')}" Cantidad="${cantStr}" ClaveUnidad="${escapeXml(it.ClaveUnidad || 'H87')}" Unidad="${escapeXml(it.Unidad || 'Pieza')}" Descripcion="${escapeXml(it.Descripcion)}" ValorUnitario="${valUnitStr}" Importe="${impStr}" ObjetoImp="02">
            <cfdi:Impuestos>
                <cfdi:Traslados>
                    <cfdi:Traslado Base="${impStr}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${ivaStr}" />
                </cfdi:Traslados>
            </cfdi:Impuestos>
        </cfdi:Concepto>`;
    });

    xml += `
    </cfdi:Conceptos>
    <cfdi:Impuestos TotalImpuestosTrasladados="${ivaTotalStr}">
        <cfdi:Traslados>
            <cfdi:Traslado Base="${subtotalStr}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${ivaTotalStr}" />
        </cfdi:Traslados>
    </cfdi:Impuestos>
    <cfdi:Complemento>
        <tfd:TimbreFiscalDigital Version="1.1" UUID="${uuid}" FechaTimbrado="${fechaTimbrado}" RfcProvCertif="SAT970701NN3" SelloCFDI="${escapeXml(selloCFDI)}" NoCertificadoSAT="${noCertificadoSAT}" SelloSAT="${escapeXml(selloSAT)}" />
    </cfdi:Complemento>
</cfdi:Comprobante>`;

    return xml;
}

module.exports = { generarXmlCFDI40 };
