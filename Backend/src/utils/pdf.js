const PDFDocument = require('pdfkit');

function formatValue(value) {
  if (value === null || value === undefined) return '-';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') return Number(value.toFixed(2));
  return String(value);
}

function buildRows(reportType, data) {
  if (reportType === 'sanitario') {
    return data.registros.map((item) => ({
      fecha: item.fechaEvento,
      arete: item.animal?.numeroArete,
      tipo: item.tipoEvento?.nombreTipo,
      estado: item.estadoAprobacion,
      diagnostico: item.diagnostico || '',
    }));
  }

  if (reportType === 'productivo') {
    return [
      ...data.registrosPeso.map((item) => ({
        modulo: 'peso',
        fecha: item.fechaRegistro,
        arete: item.animal?.numeroArete,
        valor: item.peso,
        estado: item.estadoValidacion,
      })),
      ...data.produccionLeche.map((item) => ({
        modulo: 'leche',
        fecha: item.fechaRegistro,
        arete: item.animal?.numeroArete,
        valor: item.litrosProducidos,
        estado: item.estadoValidacion,
      })),
      ...data.eventosReproductivos.map((item) => ({
        modulo: 'repro',
        fecha: item.fechaEvento,
        arete: item.animal?.numeroArete,
        valor: item.tipoEvento,
        estado: item.estadoValidacion,
      })),
    ];
  }

  if (reportType === 'comparativo') {
    return Object.entries(data.variacion).map(([key, value]) => ({
      indicador: key,
      periodoA: data.periodoA[key],
      periodoB: data.periodoB[key],
      variacion: value,
    }));
  }

  return [
    ...data.solicitudes.map((item) => ({
      modulo: 'solicitudes',
      fecha: item.fechaSolicitud,
      estado: item.estadoSolicitud,
      monto: item.detalles.reduce((sum, detail) => sum + Number(detail.subtotalEstimado), 0),
    })),
    ...data.compras.map((item) => ({
      modulo: 'compras',
      fecha: item.fechaCompra,
      estado: 'COMPLETADA',
      monto: item.totalReal,
    })),
    ...data.movimientos.map((item) => ({
      modulo: 'movimientos',
      fecha: item.fechaMovimiento,
      estado: item.tipoMovimiento,
      monto: item.cantidad,
    })),
  ];
}

function writeKeyValues(doc, title, values) {
  doc.fontSize(12).text(title, { underline: true });
  Object.entries(values || {}).forEach(([key, value]) => {
    doc.fontSize(10).text(`${key}: ${formatValue(value)}`);
  });
  doc.moveDown(0.5);
}

function reportToPdf(reportType, data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text(`SIGGAB - Reporte ${reportType.toUpperCase()}`);
    doc.moveDown(0.5);

    if (data.periodo) {
      writeKeyValues(doc, 'Periodo', data.periodo);
    }

    if (data.resumen) {
      writeKeyValues(doc, 'Resumen', data.resumen);
    }

    const rows = buildRows(reportType, data);
    doc.fontSize(12).text('Detalle', { underline: true });
    doc.moveDown(0.3);

    if (!rows.length) {
      doc.fontSize(10).text('Sin datos para el periodo solicitado.');
      doc.end();
      return;
    }

    rows.forEach((row, idx) => {
      const rowText = Object.entries(row)
        .map(([key, value]) => `${key}: ${formatValue(value)}`)
        .join(' | ');
      doc.fontSize(9).text(`${idx + 1}. ${rowText}`);

      if (doc.y > 760) {
        doc.addPage();
      }
    });

    doc.end();
  });
}

module.exports = { reportToPdf };
