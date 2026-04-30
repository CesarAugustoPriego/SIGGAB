const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const BRAND = {
  title: 'SIGGAB',
  subtitle: 'Sistema Gestor de Ganado Bovino',
  ranch: 'Rancho Los Alpes',
  primary: '#1F6B3A',
  secondary: '#2563EB',
  muted: '#667085',
  border: '#D9E0D9',
  panel: '#F3F6F4',
};

const PALETTE = ['#2563EB', '#15803D', '#D97706', '#B91C1C', '#6D28D9', '#0F766E'];
const STATUS_COLORS = {
  OPTIMO: '#15803D',
  BAJO: '#D97706',
  CRITICO: '#B91C1C',
  SANO: '#15803D',
  EN_TRATAMIENTO: '#D97706',
  ENFERMO: '#B91C1C',
};
const LOSS_REASON_COLORS = {
  enfermedad: '#2563EB',
  accidente: '#15803D',
  venta: '#D97706',
  muerte: '#B91C1C',
  transferencia: '#6D28D9',
};
const INVENTORY_STATUS_ORDER = ['OPTIMO', 'BAJO', 'CRITICO'];

function logoPath() {
  const candidates = [
    path.resolve(__dirname, '..', '..', '..', 'Frontend', 'public', 'branding', 'logo-rancho-los-alpes.png'),
    path.resolve(__dirname, '..', '..', '..', 'Mobile', 'assets', 'images', 'logo-rancho-los-alpes.png'),
  ];
  return candidates.find((item) => fs.existsSync(item)) || null;
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') return Number(value.toFixed(2));
  return String(value);
}

function formatMetric(value, unit = '') {
  const numeric = Number(value);
  const display = Number.isFinite(numeric)
    ? numeric.toLocaleString('es-MX', { maximumFractionDigits: 2 })
    : formatValue(value);
  return unit ? `${display} ${unit}` : String(display);
}

function safeDate(value) {
  if (!value) return '-';
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

function lossReasonColor(reason, index = 0) {
  const normalized = String(reason || '').toLowerCase();
  if (normalized.includes('enfermedad')) return LOSS_REASON_COLORS.enfermedad;
  if (normalized.includes('accidente')) return LOSS_REASON_COLORS.accidente;
  if (normalized.includes('venta')) return LOSS_REASON_COLORS.venta;
  if (normalized.includes('muerte')) return LOSS_REASON_COLORS.muerte;
  if (normalized.includes('transfer')) return LOSS_REASON_COLORS.transferencia;
  return PALETTE[index % PALETTE.length];
}

function reportTitle(reportType) {
  const titles = {
    sanitario: 'Reporte Sanitario',
    productivo: 'Reporte Productivo',
    administrativo: 'Reporte Administrativo',
    comparativo: 'Reporte Comparativo',
    inventario: 'Reporte de Inventario',
    'sanitario-hato': 'Reporte Sanitario del Hato',
    'sanitario-comparativo': 'Reporte Sanitario Comparativo',
    productividad: 'Reporte de Productividad',
    'comparativo-fechas': 'Reporte Comparativo por Fechas',
    perdidas: 'Reporte de Bajas y Perdidas',
    'perdidas-comparativo': 'Reporte Comparativo de Perdidas',
  };
  return titles[reportType] || `Reporte ${String(reportType || '').toUpperCase()}`;
}

function buildRows(reportType, data) {
  if (reportType === 'inventario') {
    return (data.insumos || []).map((item) => ({
      Nombre: item.nombre,
      Categoria: item.categoria,
      Stock: `${formatMetric(item.stockActual)} ${item.unidadMedida}`,
      Estado: item.estado,
    }));
  }

  if (reportType === 'sanitario-hato') {
    return (data.animales || []).map((item) => ({
      Arete: item.arete,
      Raza: item.raza,
      Edad: `${item.edadMeses} meses`,
      Sexo: item.sexo,
      Peso: `${formatMetric(item.pesoKg)} kg`,
      Estado: item.estadoSanitarioLabel,
      Tratamiento: item.tratamiento,
    }));
  }

  if (reportType === 'productividad') {
    return (data.animales || []).map((item) => ({
      Arete: item.arete,
      Raza: item.raza,
      Edad: `${item.edadMeses} meses`,
      Peso: `${formatMetric(item.pesoKg)} kg`,
      GPD: item.gpdKgDia === null ? '-' : `${formatMetric(item.gpdKgDia)} kg/dia`,
    }));
  }

  if (reportType === 'perdidas') {
    return (data.porMotivo || []).map((item) => ({
      Motivo: item.motivo,
      Bajas: item.bajas,
      'Peso perdido': `${formatMetric(item.pesoKg)} kg`,
      Porcentaje: `${formatMetric(item.porcentaje)}%`,
    }));
  }

  if (
    reportType === 'sanitario-comparativo'
    || reportType === 'comparativo-fechas'
    || reportType === 'perdidas-comparativo'
  ) {
    return (data.metricas || []).map((item) => ({
      Indicador: item.label,
      'Periodo 1': formatMetric(item.periodoA, item.unit),
      'Periodo 2': formatMetric(item.periodoB, item.unit),
      Delta: formatMetric(item.delta, item.unit),
      Variacion: `${formatMetric(item.porcentaje)}%`,
    }));
  }

  if (reportType === 'sanitario') {
    return (data.registros || []).map((item) => ({
      Fecha: safeDate(item.fechaEvento),
      Arete: item.animal?.numeroArete,
      Tipo: item.tipoEvento?.nombreTipo,
      Estado: item.estadoAprobacion,
      Diagnostico: item.diagnostico || '',
    }));
  }

  if (reportType === 'productivo') {
    return [
      ...(data.registrosPeso || []).map((item) => ({
        Modulo: 'peso',
        Fecha: safeDate(item.fechaRegistro),
        Arete: item.animal?.numeroArete,
        Valor: `${formatMetric(item.peso)} kg`,
        Estado: item.estadoValidacion,
      })),
      ...(data.produccionLeche || []).map((item) => ({
        Modulo: 'leche',
        Fecha: safeDate(item.fechaRegistro),
        Arete: item.animal?.numeroArete,
        Valor: `${formatMetric(item.litrosProducidos)} L`,
        Estado: item.estadoValidacion,
      })),
      ...(data.eventosReproductivos || []).map((item) => ({
        Modulo: 'repro',
        Fecha: safeDate(item.fechaEvento),
        Arete: item.animal?.numeroArete,
        Valor: item.tipoEvento,
        Estado: item.estadoValidacion,
      })),
    ];
  }

  if (reportType === 'comparativo') {
    return Object.entries(data.variacion || {}).map(([key, value]) => ({
      Indicador: key,
      'Periodo 1': data.periodoA?.[key],
      'Periodo 2': data.periodoB?.[key],
      Delta: value.delta,
      Variacion: `${value.porcentaje}%`,
    }));
  }

  return [
    ...(data.solicitudes || []).map((item) => ({
      Modulo: 'solicitudes',
      Fecha: safeDate(item.fechaSolicitud),
      Estado: item.estadoSolicitud,
      Monto: item.detalles.reduce((sum, detail) => sum + Number(detail.subtotalEstimado), 0),
    })),
    ...(data.compras || []).map((item) => ({
      Modulo: 'compras',
      Fecha: safeDate(item.fechaCompra),
      Estado: 'COMPLETADA',
      Monto: item.totalReal,
    })),
    ...(data.movimientos || []).map((item) => ({
      Modulo: 'movimientos',
      Fecha: safeDate(item.fechaMovimiento),
      Estado: item.tipoMovimiento,
      Monto: item.cantidad,
    })),
  ];
}

function summaryEntries(reportType, data) {
  if (reportType === 'inventario') {
    return [
      ['Total insumos', data.resumen?.totalInsumos],
      ['Optimos', data.resumen?.optimos],
      ['Bajos', data.resumen?.bajos],
      ['Criticos', data.resumen?.criticos],
    ];
  }
  if (reportType === 'sanitario-hato') {
    return [
      ['Total evaluados', data.resumen?.totalEvaluados],
      ['Sanos', data.resumen?.sanos],
      ['En tratamiento', data.resumen?.enTratamiento],
      ['Enfermos', data.resumen?.enfermos],
    ];
  }
  if (reportType === 'productividad') {
    return [
      ['Total animales', data.resumen?.totalAnimales],
      ['Peso total', formatMetric(data.resumen?.pesoTotalKg, 'kg')],
      ['Peso promedio', formatMetric(data.resumen?.pesoPromedioKg, 'kg')],
      ['GPD promedio', formatMetric(data.resumen?.gpdPromedioKgDia, 'kg/dia')],
    ];
  }
  if (reportType === 'perdidas') {
    return [
      ['Bajas totales', data.resumen?.bajasTotales],
      ['Peso perdido', formatMetric(data.resumen?.pesoTotalPerdidoKg, 'kg')],
      ['Filtro activo', data.resumen?.filtroActivo],
    ];
  }
  if (data.metricas) {
    return data.metricas.slice(0, 4).map((item) => [
      item.label,
      `${formatMetric(item.periodoB, item.unit)} (${item.delta > 0 ? '+' : ''}${formatMetric(item.delta, item.unit)})`,
    ]);
  }
  return Object.entries(data.resumen || {}).slice(0, 6);
}

function drawHeader(doc, reportType, data) {
  const logo = logoPath();
  if (logo) {
    doc.image(logo, 40, 30, { width: 78, height: 42, fit: [78, 42] });
  }

  doc.fillColor('#101828').fontSize(18).font('Helvetica-Bold').text(BRAND.title, 132, 32);
  doc.fontSize(9).font('Helvetica').fillColor(BRAND.muted).text(BRAND.subtitle, 132, 54);
  doc.fontSize(10).fillColor(BRAND.primary).text(BRAND.ranch, 132, 68);

  doc.fontSize(13).font('Helvetica-Bold').fillColor('#101828').text(reportTitle(reportType), 330, 36, {
    width: 220,
    align: 'right',
  });
  doc.fontSize(8).font('Helvetica').fillColor(BRAND.muted).text(`Generado: ${new Date().toISOString().slice(0, 10)}`, 330, 58, {
    width: 220,
    align: 'right',
  });

  const period = data.periodo
    ? `${data.periodo.fechaInicio || '-'} a ${data.periodo.fechaFin || '-'}`
    : data.periodoA
      ? `${data.periodoA.fechaInicio || '-'} a ${data.periodoB?.fechaFin || '-'}`
      : '-';
  doc.fontSize(8).text(`Periodo: ${period}`, 330, 72, { width: 220, align: 'right' });

  doc.moveTo(40, 92).lineTo(555, 92).strokeColor(BRAND.border).stroke();
  doc.y = 108;
}

function drawSummary(doc, reportType, data) {
  const entries = summaryEntries(reportType, data);
  const visibleEntries = entries.slice(0, 4);
  const gap = 10;
  const totalWidth = 515;
  const cardW = (totalWidth - gap * Math.max(0, visibleEntries.length - 1)) / Math.max(1, visibleEntries.length);
  const cardH = 64;
  let x = 40;
  const y = doc.y;

  visibleEntries.forEach(([label, value]) => {
    doc.roundedRect(x, y, cardW, cardH, 8).fillAndStroke(BRAND.panel, BRAND.border);
    doc.fillColor(BRAND.muted).fontSize(7).font('Helvetica-Bold').text(String(label).toUpperCase(), x + 10, y + 10, {
      width: cardW - 20,
    });
    doc.fillColor('#101828').fontSize(12).font('Helvetica-Bold').text(formatValue(value), x + 10, y + 28, {
      width: cardW - 20,
      height: cardH - 34,
      lineGap: 1,
    });
    x += cardW + gap;
  });

  doc.y = y + cardH + 20;
}

function drawBarChart(doc, title, data, x, y, width, height) {
  if (!data.length) return y;
  const maxValue = Math.max(...data.map((item) => Number(item.value || 0)), 1);
  const barGap = 14;
  const barWidth = Math.max(18, (width - (data.length - 1) * barGap) / data.length);

  doc.fillColor('#101828').fontSize(11).font('Helvetica-Bold').text(title, x, y);
  const chartY = y + 22;
  doc.moveTo(x, chartY + height).lineTo(x + width, chartY + height).strokeColor(BRAND.border).stroke();

  data.forEach((item, index) => {
    const value = Number(item.value || 0);
    const h = Math.max(2, (value / maxValue) * (height - 22));
    const bx = x + index * (barWidth + barGap);
    const by = chartY + height - h;
    doc.roundedRect(bx, by, barWidth, h, 4).fill(item.color || PALETTE[index % PALETTE.length]);
    doc.fillColor('#101828').fontSize(8).font('Helvetica-Bold').text(formatMetric(value), bx, by - 12, {
      width: barWidth,
      align: 'center',
    });
    doc.fillColor(BRAND.muted).fontSize(7).font('Helvetica').text(item.label, bx - 6, chartY + height + 6, {
      width: barWidth + 12,
      align: 'center',
    });
  });

  return chartY + height + 30;
}

function drawPieChart(doc, title, data, x, y, radius) {
  const cleanData = data.filter((item) => Number(item.value || 0) > 0);
  const total = cleanData.reduce((sum, item) => sum + Number(item.value || 0), 0);
  if (!total) return y;

  doc.fillColor('#101828').fontSize(11).font('Helvetica-Bold').text(title, x, y);
  const cx = x + radius + 10;
  const cy = y + radius + 34;
  const innerRadius = radius * 0.48;
  let currentAngle = 0;

  function point(angle, r) {
    const radians = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(radians),
      y: cy + r * Math.sin(radians),
    };
  }

  cleanData.forEach((item, index) => {
    const value = Number(item.value || 0);
    const angle = (value / total) * 360;
    const endAngle = currentAngle + angle;
    const color = item.color || PALETTE[index % PALETTE.length];

    if (angle >= 359.99) {
      doc.circle(cx, cy, radius).fill(color);
    } else {
      const largeArc = angle > 180 ? 1 : 0;
      const outerStart = point(currentAngle, radius);
      const outerEnd = point(endAngle, radius);
      const innerEnd = point(endAngle, innerRadius);
      const innerStart = point(currentAngle, innerRadius);
      const path = [
        `M ${outerStart.x} ${outerStart.y}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
        `L ${innerEnd.x} ${innerEnd.y}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
        'Z',
      ].join(' ');
      doc.path(path).fill(color);
    }

    currentAngle = endAngle;
  });

  doc.circle(cx, cy, innerRadius).fill('#FFFFFF');
  doc.fillColor('#101828').fontSize(13).font('Helvetica-Bold').text(formatMetric(total), cx - 35, cy - 8, {
    width: 70,
    align: 'center',
  });
  doc.fillColor(BRAND.muted).fontSize(7).font('Helvetica-Bold').text('TOTAL', cx - 35, cy + 8, {
    width: 70,
    align: 'center',
  });

  let legendY = y + 28;
  cleanData.forEach((item, index) => {
    const color = item.color || PALETTE[index % PALETTE.length];
    doc.rect(x + radius * 2 + 35, legendY + 2, 8, 8).fill(color);
    doc.fillColor('#101828').fontSize(8).font('Helvetica-Bold').text(item.label, x + radius * 2 + 48, legendY);
    doc.fillColor(BRAND.muted).fontSize(8).font('Helvetica').text(formatMetric(item.value), x + radius * 2 + 48, legendY + 11);
    legendY += 28;
  });

  return y + radius * 2 + 52;
}

function drawSanitaryPeriodPie(doc, title, period, x, y) {
  const total = Number(period.totalEvaluados || 0);
  const sanos = Number(period.sanos || 0);
  const enfermos = Number(period.enfermos || 0);
  const tratamiento = Math.max(0, total - sanos - enfermos);
  return drawPieChart(doc, title, [
    { label: 'Sanos', value: sanos, color: '#15803D' },
    { label: 'Tratamiento', value: tratamiento, color: '#D97706' },
    { label: 'Enfermos', value: enfermos, color: '#B91C1C' },
  ].filter((item) => item.value > 0), x, y, 58);
}

function drawComparisonRows(doc, title, metrics, x, y, width) {
  if (!metrics.length) return y;
  doc.fillColor('#101828').fontSize(11).font('Helvetica-Bold').text(title, x, y);
  let cursorY = y + 24;

  metrics.slice(0, 5).forEach((metric, index) => {
    const p1 = Number(metric.periodoA || 0);
    const p2 = Number(metric.periodoB || 0);
    const max = Math.max(p1, p2, 1);
    const barX = x + 120;
    const barW = width - 150;
    const labelY = cursorY + 2;

    doc.fillColor('#101828').fontSize(8).font('Helvetica-Bold').text(metric.label, x, labelY, { width: 105 });
    doc.fillColor(BRAND.muted).fontSize(7).font('Helvetica').text(`Var. ${metric.porcentaje > 0 ? '+' : ''}${formatMetric(metric.porcentaje)}%`, x, labelY + 12, { width: 105 });

    doc.fillColor(BRAND.muted).fontSize(7).text('P1', barX, cursorY);
    doc.roundedRect(barX + 18, cursorY, barW * (p1 / max), 8, 3).fill(PALETTE[index % PALETTE.length]);
    doc.fillColor('#101828').fontSize(7).text(formatMetric(p1, metric.unit), barX + 22 + barW * (p1 / max), cursorY - 1, { width: 72 });

    doc.fillColor(BRAND.muted).fontSize(7).text('P2', barX, cursorY + 17);
    doc.roundedRect(barX + 18, cursorY + 17, barW * (p2 / max), 8, 3).fill(PALETTE[(index + 1) % PALETTE.length]);
    doc.fillColor('#101828').fontSize(7).text(formatMetric(p2, metric.unit), barX + 22 + barW * (p2 / max), cursorY + 16, { width: 72 });

    cursorY += 45;
  });

  return cursorY + 6;
}

function drawReportCharts(doc, reportType, data) {
  const y = doc.y;
  if (reportType === 'inventario') {
    const chartData = INVENTORY_STATUS_ORDER.map((status) => {
      const item = (data.estados || []).find((entry) => entry.estado === status);
      return {
        label: status,
        value: item?.total || 0,
        color: STATUS_COLORS[status],
      };
    });
    doc.y = drawPieChart(doc, 'Distribucion del inventario', chartData, 48, y, 58);
    return;
  }

  if (reportType === 'sanitario-hato') {
    const chartData = (data.distribucion || []).map((item) => ({
      label: item.label,
      value: item.total,
      color: STATUS_COLORS[item.estado] || '#15803D',
    }));
    doc.y = drawPieChart(doc, 'Distribucion sanitaria', chartData, 48, y, 58);
    return;
  }

  if (reportType === 'productividad') {
    const chartData = (data.metricas || []).map((item, index) => ({
      label: item.label,
      value: item.value,
      color: index === 2 ? '#15803D' : '#2563EB',
    }));
    doc.y = drawBarChart(doc, 'Indicadores productivos', chartData, 48, y, 460, 120);
    return;
  }

  if (reportType === 'perdidas') {
    const chartData = (data.porMotivo || []).map((item, index) => ({
      label: item.motivo,
      value: item.pesoKg,
      color: lossReasonColor(item.motivo, index),
    }));
    const monthlyData = (data.porPeriodo || []).map((item) => ({
      label: item.periodo,
      value: item.bajas,
      color: '#B91C1C',
    }));
    const pieY = drawPieChart(doc, 'Peso perdido por motivo', chartData, 48, y, 58);
    const monthY = drawBarChart(doc, 'Bajas por mes', monthlyData, 304, y, 210, 88);
    doc.y = Math.max(pieY, monthY) + 4;
    return;
  }

  if (reportType === 'perdidas-comparativo') {
    const motivos = data.motivos || [];
    const periodAData = motivos.map((item, index) => ({
      label: item.motivo,
      value: item.periodoA,
      color: lossReasonColor(item.motivo, index),
    }));
    const periodBData = motivos.map((item, index) => ({
      label: item.motivo,
      value: item.periodoB,
      color: lossReasonColor(item.motivo, index),
    }));
    const yA = drawPieChart(doc, 'Motivos Periodo 1', periodAData, 48, y, 52);
    const yB = drawPieChart(doc, 'Motivos Periodo 2', periodBData, 302, y, 52);
    doc.y = Math.max(yA, yB) + 2;
    doc.y = drawComparisonRows(doc, 'Resumen comparativo', data.metricas || [], 48, doc.y, 470);
    return;
  }

  if (reportType === 'sanitario-comparativo') {
    const yA = drawSanitaryPeriodPie(doc, 'Distribucion Periodo 1', data.periodoA || {}, 48, y);
    const yB = drawSanitaryPeriodPie(doc, 'Distribucion Periodo 2', data.periodoB || {}, 302, y);
    doc.y = Math.max(yA, yB) + 6;
    return;
  }

  if (data.metricas) {
    doc.y = drawComparisonRows(doc, 'Comparativo de periodos', data.metricas, 48, y, 470);
  }
}

function drawTable(doc, rows) {
  if (!rows.length) {
    doc.fillColor(BRAND.muted).fontSize(9).text('Sin datos para el periodo solicitado.');
    return;
  }

  const keys = Object.keys(rows[0]).slice(0, 6);
  const x = 40;
  const width = 515;
  const colWidth = width / keys.length;
  let y = doc.y + 10;

  doc.fillColor('#101828').fontSize(11).font('Helvetica-Bold').text('Detalle', x, y);
  y += 20;

  doc.rect(x, y, width, 22).fill('#E8ECE8');
  keys.forEach((key, index) => {
    doc.fillColor('#101828').fontSize(7).font('Helvetica-Bold').text(key, x + index * colWidth + 6, y + 7, {
      width: colWidth - 10,
    });
  });
  y += 22;

  rows.slice(0, 28).forEach((row, rowIndex) => {
    if (y > 745) {
      doc.addPage();
      y = 50;
    }
    doc.rect(x, y, width, 24).fill(rowIndex % 2 === 0 ? '#FFFFFF' : '#F6F8F6');
    keys.forEach((key, index) => {
      doc.fillColor('#101828').fontSize(7).font('Helvetica').text(formatValue(row[key]), x + index * colWidth + 6, y + 7, {
        width: colWidth - 10,
        ellipsis: true,
      });
    });
    y += 24;
  });

  doc.y = y + 10;
}

function addFooter(doc) {
  const pageRange = doc.bufferedPageRange();
  for (let i = pageRange.start; i < pageRange.start + pageRange.count; i += 1) {
    doc.switchToPage(i);
    doc.fillColor(BRAND.muted).fontSize(7).font('Helvetica')
      .text(`${BRAND.title} - ${BRAND.ranch} | Documento generado automaticamente`, 40, 775, { width: 380 });
    doc.text(`Pagina ${i + 1} de ${pageRange.count}`, 455, 775, { width: 100, align: 'right' });
  }
}

function reportToPdf(reportType, data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawHeader(doc, reportType, data);
    drawSummary(doc, reportType, data);
    drawReportCharts(doc, reportType, data);

    const shouldIncludeRows = ![
      'sanitario-comparativo',
      'perdidas-comparativo',
      'comparativo-fechas',
    ].includes(reportType);

    if (shouldIncludeRows) {
      drawTable(doc, buildRows(reportType, data));
    }

    addFooter(doc);
    doc.end();
  });
}

module.exports = { reportToPdf };
