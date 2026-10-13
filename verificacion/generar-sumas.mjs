// Regenera SHA256SUMS.txt al cerrar una versión nueva.
// Uso, desde la raíz del repositorio:  npm run sumas
//
// Recorre el repositorio y escribe la suma SHA-256 de cada archivo, en orden
// alfabético. Deja fuera la propia lista de sumas, el MD5SUMS.txt antiguo y
// las carpetas de trabajo (.git, node_modules, resultados). Las mismas sumas
// sirven para comprobar que GitHub y el depósito de OSF tienen archivos
// idénticos: basta con correr "sha256sum -c SHA256SUMS.txt" sobre lo
// descargado de OSF.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const raiz = process.cwd();
const fuera = new Set(['.git', 'node_modules', 'resultados', 'SHA256SUMS.txt', 'MD5SUMS.txt', '.DS_Store']);
const archivos = [];
(function recorrer(dir) {
  for (const n of readdirSync(dir)) {
    if (fuera.has(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) recorrer(p); else archivos.push(relative(raiz, p).split(sep).join('/'));
  }
})(raiz);
archivos.sort();
const lineas = archivos.map(f => `${createHash('sha256').update(readFileSync(join(raiz, f))).digest('hex')}  ${f}`);
writeFileSync('SHA256SUMS.txt', lineas.join('\n') + '\n');
console.log(`SHA256SUMS.txt regenerado con ${archivos.length} archivos.`);
