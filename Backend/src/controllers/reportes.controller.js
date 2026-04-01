const reportesService = require('../services/reportes.service');
const { sendSuccess } = require('../utils/response');

function buildFilename(prefix, extension) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-${stamp}.${extension}`;
}

function sendCsv(res, csvContent, filename) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(csvContent);
}

function sendPdf(res, pdfBuffer, filename) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(pdfBuffer);
}

async function sendReportByFormat(req, res, reportType, report, successMessage) {
  const formato = req.query.formato || 'json';

  if (formato === 'csv') {
    return sendCsv(
      res,
      reportesService.reportToCsv(reportType, report),
      buildFilename(`reporte-${reportType}`, 'csv')
    );
  }

  if (formato === 'pdf') {
    return sendPdf(
      res,
      await reportesService.reportToPdf(reportType, report),
      buildFilename(`reporte-${reportType}`, 'pdf')
    );
  }

  return sendSuccess(res, report, successMessage);
}

async function getSanitario(req, res, next) {
  try {
    const report = await reportesService.getSanitarioReport(req.query);
    return sendReportByFormat(req, res, 'sanitario', report, 'Reporte sanitario generado');
  } catch (error) {
    return next(error);
  }
}

async function getProductivo(req, res, next) {
  try {
    const report = await reportesService.getProductivoReport(req.query);
    return sendReportByFormat(req, res, 'productivo', report, 'Reporte productivo generado');
  } catch (error) {
    return next(error);
  }
}

async function getAdministrativo(req, res, next) {
  try {
    const report = await reportesService.getAdministrativoReport(req.query);
    return sendReportByFormat(req, res, 'administrativo', report, 'Reporte administrativo generado');
  } catch (error) {
    return next(error);
  }
}

async function getComparativo(req, res, next) {
  try {
    const report = await reportesService.getComparativoReport(req.query);
    return sendReportByFormat(req, res, 'comparativo', report, 'Reporte comparativo generado');
  } catch (error) {
    return next(error);
  }
}

module.exports = { getSanitario, getProductivo, getAdministrativo, getComparativo };
