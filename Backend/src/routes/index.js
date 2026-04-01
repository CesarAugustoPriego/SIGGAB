const { Router } = require('express');

// Fase 1
const authRoutes = require('./auth.routes');
const usuariosRoutes = require('./usuarios.routes');
const animalesRoutes = require('./animales.routes');
const razasRoutes = require('./razas.routes');
const eventosSanitariosRoutes = require('./eventos-sanitarios.routes');
const calendarioSanitarioRoutes = require('./calendario-sanitario.routes');

// Fase 2
const insumosRoutes = require('./insumos.routes');
const solicitudesCompraRoutes = require('./solicitudes-compra.routes');
const comprasRealizadasRoutes = require('./compras-realizadas.routes');
const lotesProductivosRoutes = require('./lotes-productivos.routes');
const registrosPesoRoutes = require('./registros-peso.routes');
const produccionLecheRoutes = require('./produccion-leche.routes');
const eventosReproductivosRoutes = require('./eventos-reproductivos.routes');
const dashboardRoutes = require('./dashboard.routes');

// Fase 3
const reportesRoutes = require('./reportes.routes');
const respaldosRoutes = require('./respaldos.routes');

const router = Router();

// Rutas publicas
router.use('/auth', authRoutes);

// Fase 1: Modulos core
router.use('/usuarios', usuariosRoutes);
router.use('/animales', animalesRoutes);
router.use('/razas', razasRoutes);
router.use('/eventos-sanitarios', eventosSanitariosRoutes);
router.use('/calendario-sanitario', calendarioSanitarioRoutes);

// Fase 2: Inventario
router.use('/insumos', insumosRoutes);
router.use('/solicitudes-compra', solicitudesCompraRoutes);
router.use('/compras-realizadas', comprasRealizadasRoutes);

// Fase 2: Productivo
router.use('/lotes-productivos', lotesProductivosRoutes);
router.use('/registros-peso', registrosPesoRoutes);
router.use('/produccion-leche', produccionLecheRoutes);
router.use('/eventos-reproductivos', eventosReproductivosRoutes);

// Fase 2: Dashboard
router.use('/dashboard', dashboardRoutes);

// Fase 3: Reportes y respaldos
router.use('/reportes', reportesRoutes);
router.use('/respaldos', respaldosRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'SIGGAB API funcionando correctamente', timestamp: new Date().toISOString() });
});

module.exports = router;