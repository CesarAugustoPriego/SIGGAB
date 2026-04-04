import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const checklistPath = path.join(process.cwd(), 'docs', 'preproduccion-checklist.md');

if (!fs.existsSync(checklistPath)) {
  console.error(`ERROR: no se encontro checklist en ${checklistPath}`);
  process.exit(1);
}

const content = fs.readFileSync(checklistPath, 'utf8');
const match = content.match(/## Gate obligatorio \(bloqueante\)([\s\S]*?)(\n## |\n?$)/i);

if (!match) {
  console.error('ERROR: el checklist no contiene la seccion "Gate obligatorio (bloqueante)".');
  process.exit(1);
}

const gateSection = match[1];
const pendingItems = [...gateSection.matchAll(/^- \[ \] (.+)$/gm)].map((entry) => entry[1].trim());

if (pendingItems.length > 0) {
  console.error('ERROR: gate de preproduccion bloqueado. Hay pendientes en el checklist:\n');
  for (const item of pendingItems) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

const completedItems = [...gateSection.matchAll(/^- \[x\] (.+)$/gim)].length;
if (completedItems === 0) {
  console.error('ERROR: no hay items marcados como completados en el gate de preproduccion.');
  process.exit(1);
}

console.log('OK: checklist de preproduccion sin pendientes bloqueantes.');
