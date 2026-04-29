const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SIGGAB API',
      version: '2.1.0',
      description: [
        'Sistema Gestor de Ganado Bovino (SIGGAB) - API REST.',
        '',
        'Todos los endpoints (excepto login y refresh) requieren Bearer token.',
        'Respuesta estandar: { success, data, message, errors }.',
      ].join('\n'),
      contact: {
        name: 'SIGGAB Dev Team',
      },
    },
    servers: [
      { url: 'http://localhost:3000/api', description: 'Desarrollo local' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido en POST /auth/login',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object', nullable: true },
            message: { type: 'string', example: 'Operacion exitosa' },
            errors: { type: 'object', nullable: true },
          },
          required: ['success', 'data', 'message', 'errors'],
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            data: { type: 'object', nullable: true, example: null },
            message: { type: 'string', example: 'Error de validacion' },
            errors: {
              type: 'array',
              items: { type: 'object' },
              nullable: true,
            },
          },
          required: ['success', 'data', 'message', 'errors'],
        },

        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', minLength: 3, example: 'admin' },
            password: { type: 'string', minLength: 6, example: 'SiggabAdmin2026!' },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            usuario: {
              type: 'object',
              properties: {
                idUsuario: { type: 'integer', example: 2 },
                nombreCompleto: { type: 'string', example: 'Administrador SIGGAB' },
                username: { type: 'string', example: 'admin' },
                rol: { type: 'string', example: 'Administrador' },
              },
            },
          },
        },

        Rol: {
          type: 'object',
          properties: {
            idRol: { type: 'integer', example: 2 },
            nombreRol: { type: 'string', example: 'Administrador' },
            descripcion: { type: 'string', nullable: true },
          },
        },
        Usuario: {
          type: 'object',
          properties: {
            idUsuario: { type: 'integer', example: 1 },
            nombreCompleto: { type: 'string', example: 'Juan Perez' },
            username: { type: 'string', example: 'jperez' },
            idRol: { type: 'integer', example: 3 },
            activo: { type: 'boolean', example: true },
            intentosFallidos: { type: 'integer', example: 0 },
            bloqueadoHasta: { type: 'string', format: 'date-time', nullable: true },
            fechaCreacion: { type: 'string', format: 'date-time' },
            rol: { $ref: '#/components/schemas/Rol' },
          },
        },
        CreateUsuarioRequest: {
          type: 'object',
          required: ['nombreCompleto', 'username', 'password', 'idRol'],
          properties: {
            nombreCompleto: { type: 'string', minLength: 3, maxLength: 100 },
            username: { type: 'string', minLength: 3, maxLength: 50 },
            password: { type: 'string', minLength: 8, maxLength: 128 },
            idRol: { type: 'integer', minimum: 1 },
          },
        },

        Raza: {
          type: 'object',
          properties: {
            idRaza: { type: 'integer', example: 1 },
            nombreRaza: { type: 'string', example: 'Holstein' },
            activo: { type: 'boolean', example: true },
          },
        },
        Animal: {
          type: 'object',
          properties: {
            idAnimal: { type: 'integer', example: 1 },
            numeroArete: { type: 'string', example: 'MX-001-2026' },
            fechaIngreso: { type: 'string', format: 'date' },
            pesoInicial: { type: 'number', example: 350.2 },
            idRaza: { type: 'integer', example: 1 },
            procedencia: { type: 'string', example: 'Rancho Norte' },
            edadEstimada: { type: 'integer', example: 18 },
            estadoSanitarioInicial: { type: 'string', example: 'Sano' },
            estadoActual: {
              type: 'string',
              enum: ['ACTIVO', 'VENDIDO', 'MUERTO', 'TRANSFERIDO'],
              example: 'ACTIVO',
            },
            motivoBaja: { type: 'string', nullable: true },
            fechaBaja: { type: 'string', format: 'date', nullable: true },
            raza: { $ref: '#/components/schemas/Raza' },
          },
        },
        CreateAnimalRequest: {
          type: 'object',
          required: [
            'numeroArete',
            'fechaIngreso',
            'pesoInicial',
            'idRaza',
            'procedencia',
            'edadEstimada',
            'estadoSanitarioInicial',
          ],
          properties: {
            numeroArete: { type: 'string' },
            fechaIngreso: { type: 'string', format: 'date' },
            pesoInicial: { type: 'number' },
            idRaza: { type: 'integer' },
            procedencia: { type: 'string' },
            edadEstimada: { type: 'integer' },
            estadoSanitarioInicial: { type: 'string' },
          },
        },
        BajaAnimalRequest: {
          type: 'object',
          required: ['estadoActual', 'motivoBaja', 'fechaBaja'],
          properties: {
            estadoActual: {
              type: 'string',
              enum: ['VENDIDO', 'MUERTO', 'TRANSFERIDO'],
            },
            motivoBaja: { type: 'string', minLength: 5 },
            fechaBaja: { type: 'string', format: 'date' },
          },
        },

        TipoInsumo: {
          type: 'object',
          properties: {
            idTipoInsumo: { type: 'integer' },
            nombreTipo: { type: 'string' },
            descripcion: { type: 'string', nullable: true },
            activo: { type: 'boolean' },
          },
        },
        Insumo: {
          type: 'object',
          properties: {
            idInsumo: { type: 'integer' },
            nombreInsumo: { type: 'string' },
            idTipoInsumo: { type: 'integer' },
            unidadMedida: { type: 'string' },
            descripcion: { type: 'string', nullable: true },
            stockActual: { type: 'number' },
            activo: { type: 'boolean' },
            tipoInsumo: { $ref: '#/components/schemas/TipoInsumo' },
          },
        },

        DetalleSolicitud: {
          type: 'object',
          properties: {
            idInsumo: { type: 'integer' },
            cantidad: { type: 'number' },
            precioEstimado: { type: 'number' },
            subtotalEstimado: { type: 'number' },
            insumo: { $ref: '#/components/schemas/Insumo' },
          },
        },
        SolicitudCompra: {
          type: 'object',
          properties: {
            idSolicitud: { type: 'integer' },
            fechaSolicitud: { type: 'string', format: 'date' },
            estadoSolicitud: {
              type: 'string',
              enum: ['PENDIENTE', 'APROBADA', 'RECHAZADA'],
            },
            observaciones: { type: 'string', nullable: true },
            detalles: {
              type: 'array',
              items: { $ref: '#/components/schemas/DetalleSolicitud' },
            },
          },
        },

        DashboardResumen: {
          type: 'object',
          properties: {
            totalAnimalesActivos: { type: 'integer', example: 120 },
            vacunacionesMes: { type: 'integer', example: 15 },
            pesosPendientesValidar: { type: 'integer', example: 8 },
            alertasProximas7Dias: { type: 'integer', example: 3 },
            solicitudesCompraPendientes: { type: 'integer', example: 2 },
            insumosStockAgotado: { type: 'integer', example: 1 },
            inventarioTotalItems: { type: 'integer', example: 75 },
            inventarioTotalUnidades: { type: 'number', example: 1540.5 },
            gananciaPromedioKg: { type: 'number', example: 12.4 },
            natalidadPorcentaje: { type: 'number', example: 18.5 },
            mortalidadPorcentaje: { type: 'number', example: 2.1 },
            generadoEn: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
