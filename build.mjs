import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('.', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const [worker, css, client, data, logo] = await Promise.all([
  read('src/worker.js'),
  read('src/site.css'),
  read('src/site.js'),
  read('src/data.js'),
  readFile(new URL('assets/logo.png', root)),
]);
const output = `const SITE_CSS = ${JSON.stringify(css)};\nconst SITE_JS = ${JSON.stringify(client)};\nconst LOGO_BASE64 = ${JSON.stringify(logo.toString('base64'))};\n${data.replace('export const EXAMPLES', 'const EXAMPLES')}\n${worker}`;
const server = new URL('dist/server/', root);
await mkdir(server, { recursive: true });
await writeFile(new URL('index.js', server), output);
await mkdir(new URL('dist/.openai/', root), { recursive: true });
await writeFile(new URL('dist/.openai/hosting.json', root), await read('.openai/hosting.json'));
console.log(`Built Worker: ${output.length} characters`);
