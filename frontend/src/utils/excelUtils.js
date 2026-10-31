import * as XLSX from 'xlsx';

/**
 * Exporta un arreglo de datos a un archivo .xlsx de Excel
 * Soporta arreglos grandes (4,000+ filas) con alto rendimiento
 * @param {Array} data - Arreglo de objetos
 * @param {Array} columns - Opcional: lista de { key, label }
 * @param {string} fileName - Nombre del archivo de salida
 * @param {string} sheetName - Nombre de la hoja de cálculo
 */
export const exportToExcel = (data, columns = null, fileName = 'exportacion', sheetName = 'Datos') => {
  try {
    if (!data || data.length === 0) {
      alert('No hay datos disponibles para exportar.');
      return;
    }

    // Si columns no es arreglo pero fue pasado como string (fileName)
    if (typeof columns === 'string') {
      fileName = columns;
      columns = null;
    }

    // Formatear datos usando columnas personalizadas si se proporcionan
    let rowsToExport = data;
    if (Array.isArray(columns) && columns.length > 0) {
      rowsToExport = data.map(item => {
        const row = {};
        columns.forEach(col => {
          let val = item[col.key];
          if (val === undefined || val === null) {
            val = '';
          }
          row[col.label] = val;
        });
        return row;
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(rowsToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Calcular ancho de columnas de forma segura para miles de registros (sin stack overflow)
    const keys = Object.keys(rowsToExport[0] || {});
    const maxSample = Math.min(rowsToExport.length, 200); // Muestreo rápido
    const colWidths = keys.map(key => {
      let maxLen = key.length;
      for (let i = 0; i < maxSample; i++) {
        const cellValue = String(rowsToExport[i][key] ?? '');
        if (cellValue.length > maxLen) {
          maxLen = cellValue.length;
        }
      }
      return { wch: Math.min(Math.max(maxLen + 3, 10), 60) };
    });
    worksheet['!cols'] = colWidths;

    const dateStr = new Date().toISOString().substring(0, 10);
    const cleanFileName = (fileName || 'exportacion').replace(/[^\w-]/g, '_');
    XLSX.writeFile(workbook, `${cleanFileName}_${dateStr}.xlsx`);
  } catch (error) {
    console.error('Error al exportar Excel:', error);
    alert('Error al generar el archivo de Excel: ' + error.message);
  }
};

/**
 * Lee un archivo .xlsx, .xls o .csv subido por el usuario y devuelve una Promesa con el JSON
 * @param {File} file
 * @returns {Promise<Array>}
 */
export const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('El archivo Excel no contiene hojas de cálculo.');
        }
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
