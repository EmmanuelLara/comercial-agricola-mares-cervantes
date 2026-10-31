/**
 * Exporta un conjunto de datos a formato CSV compatible con Microsoft Excel (con BOM UTF-8)
 * @param {Array<Object>} data - Lista de objetos a exportar
 * @param {Array<{ key: string, label: string }>} columns - Definición de columnas y encabezados
 * @param {string} filename - Nombre del archivo a descargar (sin extensión)
 */
export const exportToExcel = (data, columns, filename = 'reporte') => {
  if (!data || !data.length) {
    alert('No hay datos para exportar.');
    return;
  }

  // Encabezados
  const headers = columns.map(c => `"${(c.label || c.key).replace(/"/g, '""')}"`).join(',');

  // Filas
  const rows = data.map(item => {
    return columns.map(col => {
      let val = item[col.key];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'number') {
        return val;
      }
      if (typeof val === 'boolean') {
        return val ? 'Sí' : 'No';
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  // UTF-8 BOM para que Excel en Windows reconozca acentos y caracteres especiales automáticamente
  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
