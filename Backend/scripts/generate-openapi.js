const fs = require('fs');
const path = require('path');

const swaggerSpec = require('../src/config/swagger');

const outputPath = path.join(__dirname, '..', 'docs', 'openapi-final.json');

fs.writeFileSync(outputPath, `${JSON.stringify(swaggerSpec, null, 2)}\n`, 'utf8');

const pathCount = Object.keys(swaggerSpec.paths || {}).length;
console.log(`OpenAPI exportado en: ${outputPath}`);
console.log(`Total de paths: ${pathCount}`);
