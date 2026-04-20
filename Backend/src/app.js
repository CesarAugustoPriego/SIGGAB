const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');
const sanitizeMiddleware = require('./middlewares/sanitize.middleware');
const csrfMiddleware = require('./middlewares/csrf.middleware');

const app = express();

// ─── Middlewares globales ───
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeMiddleware);
app.use(csrfMiddleware);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Logging de requests (solo en development)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── Swagger UI ───
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'SIGGAB API Docs',
  customCss: `
    .swagger-ui .topbar { background-color: #1a472a; }
    .swagger-ui .topbar-wrapper img { display: none; }
    .swagger-ui .topbar-wrapper::before {
      content: '🐄 SIGGAB API'; color: white; font-size: 1.4rem; font-weight: bold;
    }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
  },
}));

// JSON spec disponible en /api/docs.json
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

// ─── Rutas ───
app.use('/api', routes);

// ─── Ruta raíz ───
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SIGGAB API — Sistema Gestor de Ganado Bovino',
    version: '2.0.0',
    docs: 'http://localhost:3000/api/docs',
    health: 'http://localhost:3000/api/health',
  });
});

// ─── 404 ───
app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    errors: null,
  });
});

// ─── Error handler global ───
app.use(errorMiddleware);

module.exports = app;
