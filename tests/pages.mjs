import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../dist/pages/${path}`, import.meta.url), 'utf8');
const home = await read('index.html');
const studio = await read('estudio/index.html');
const article = await read('materia/jojo-toddynho/index.html');
assert.match(home, /O baile das antigas ainda move a pista/);
assert.match(home, /href="\/segue-o-baile-tv\/materia\/jojo-toddynho"/);
assert.match(home, /src="\/segue-o-baile-tv\/logo.png"/);
assert.match(studio, /Chave de publicação do GitHub/);
assert.match(studio, /pages-editor.js/);
assert.doesNotMatch(studio, /Senha de acesso/);
assert.match(article, /youtube-nocookie.com\/embed\/5BkZ09SDxOU/);
assert.ok((await stat(new URL('../dist/pages/logo.png', import.meta.url))).size > 1000);
console.log('GitHub Pages checks passed.');
