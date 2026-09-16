import { readFile, readdir, mkdir, writeFile, cp } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import site from './dist/server/index.js';
import { EXAMPLES } from './src/data.js';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, 'dist', 'pages');
const base = '/segue-o-baile-tv';
const postsDir = join(root, 'posts');
const entries = await readdir(postsDir).catch(() => []);
const posts = await Promise.all(entries.filter((name) => name.endsWith('.json')).map(async (name) => {
  const post = JSON.parse(await readFile(join(postsDir, name), 'utf8'));
  if (!post.id || !post.title || !post.summary || !post.body || !post.category) throw new Error(`Matéria incompleta: ${name}`);
  return post;
}));
const bucket = {
  async list() { return { objects: posts.map((post) => ({ key: `posts/${post.id}.json` })) }; },
  async get(key) {
    const post = posts.find((item) => `posts/${item.id}.json` === key);
    return post && { json: async () => post };
  },
};
const env = { BUCKET: bucket, EDITOR_PASSWORD: 'build-only-not-deployed' };
const request = (path, cookie) => site.fetch(new Request(`https://example.com${path}`, { headers: cookie ? { cookie } : {} }), env);
const login = await site.fetch(new Request('https://example.com/api/login', {
  method: 'POST',
  headers: { origin: 'https://example.com', 'content-type': 'application/json' },
  body: JSON.stringify({ password: env.EDITOR_PASSWORD }),
}), env);
const cookie = login.headers.get('set-cookie').split(';')[0];
const rewrite = (html) => html.replace(/(href|src)="\/(?!\/)/g, `$1="${base}/`);
async function save(path, contents) {
  const target = join(out, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, contents);
}
async function page(route, path, loginCookie) {
  const result = await request(route, loginCookie);
  if (!result.ok) throw new Error(`Falha ao gerar ${route}: ${result.status}`);
  await save(path, rewrite(await result.text()));
}
await page('/', 'index.html');
for (const post of [...posts, ...EXAMPLES]) await page(`/materia/${post.id}`, `materia/${post.id}/index.html`);
let editor = await (await request('/estudio', cookie)).text();
editor = editor
  .replace('Preencha, confira o resultado e publique. A identidade visual é aplicada automaticamente.', 'Preencha, confira e publique pelo GitHub. O portal será atualizado automaticamente após o envio.')
  .replace('<button id="logout" class="logout-button" type="button">Sair do estúdio</button>', '<a class="logout-button" href="https://github.com/canneli/segue-o-baile-tv/actions" target="_blank" rel="noopener noreferrer">Ver atualização do site ↗</a>')
  .replace('<div class="form-actions"><button class="button-primary" id="publish-button" type="submit">Publicar matéria', '<div class="form-section"><label>Chave de publicação do GitHub<input id="github-token" type="password" autocomplete="off" placeholder="Cole o token com acesso de escrita a este repositório" required></label><p class="form-help">A chave é usada apenas nesta aba, não fica salva no site. Compartilhe-a somente com quem pode publicar.</p></div><div class="form-actions"><button class="button-primary" id="publish-button" type="submit">Publicar matéria')
  .replace('<script src="/site.js" defer></script>', '<script src="/pages-editor.js" defer></script>');
await save('estudio/index.html', rewrite(editor));
await save('site.css', await readFile(join(root, 'src', 'site.css')));
await save('site.js', await readFile(join(root, 'src', 'site.js')));
await save('pages-editor.js', await readFile(join(root, 'src', 'pages-editor.js')));
await save('logo.png', await readFile(join(root, 'assets', 'logo.png')));
const favicon = await request('/favicon.svg');
await save('favicon.svg', await favicon.text());
await save('.nojekyll', '');
await save('404.html', rewrite(await (await request('/nao-existe')).text()));
await cp(join(root, 'media'), join(out, 'media'), { recursive: true, force: true }).catch((error) => { if (error.code !== 'ENOENT') throw error; });
console.log(`GitHub Pages: ${posts.length + EXAMPLES.length} matérias geradas em dist/pages`);
