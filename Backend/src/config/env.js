const { z } = require('zod');

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return value;
}, z.boolean());

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL debe ser una URL válida de PostgreSQL'),
  JWT_SECRET: z.string().min(20, 'JWT_SECRET debe tener al menos 20 caracteres'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ENABLE_CSRF_PROTECTION: booleanFromEnv.default(false),
  CSRF_HEADER_NAME: z.string().default('x-csrf-token'),
  CSRF_TOKEN: z.string().min(20, 'CSRF_TOKEN debe tener al menos 20 caracteres').optional(),
  AUTH_MAX_FAILED_ATTEMPTS: z.coerce.number().int().positive().default(5),
  AUTH_LOCK_MINUTES: z.coerce.number().int().positive().default(30),
  AUTO_BACKUP_ENABLED: booleanFromEnv.default(true),
  BACKUP_INTERVAL_MINUTES: z.coerce.number().int().positive().default(1440),
  BACKUP_MAX_FILES: z.coerce.number().int().positive().default(30),
  BACKUP_DIR: z.string().default('backups'),
  BACKUP_CLOUD_ENABLED: booleanFromEnv.default(false),
  BACKUP_CLOUD_UPLOAD_URL: z.string().url().optional(),
  BACKUP_CLOUD_AUTH_TOKEN: z.string().optional(),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Variables de entorno inválidas:');
  console.error(parseResult.error.format());
  process.exit(1);
}

module.exports = parseResult.data;
