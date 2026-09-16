import assert from 'node:assert/strict';
import site from '../dist/server/index.js';

const objects = new Map();
const bucket = {
  async list({ prefix }) { return { objects: [...objects.keys()].filter((key) => key.startsWith(prefix)).map((key) => ({ key })) }; },
  async get(key) { const item = objects.get(key); return item && { json: async () => JSON.parse(item.body), body: item.body, httpMetadata: item.httpMetadata }; },
  async put(key, body, options = {}) {
    const value = typeof body === 'string' ? body : await new Response(body).text();
    objects.set(key, { body: value, httpMetadata: options.httpMetadata });
  },
};
const env = { BUCKET: bucket, EDITOR_PASSWORD: 'temporary-test-secret' };
const get = (path, cookie) => site.fetch(new Request(`https://example.com${path}`, { headers: cookie ? { cookie } : {} }), env);
const home = await get('/');
assert.equal(home.status, 200);
assert.match(await home.text(), /O baile das antigas ainda move a pista/);
const article = await get('/materia/jojo-toddynho');
assert.equal(article.status, 200);
assert.match(await article.text(), /5BkZ09SDxOU/);
const locked = await get('/estudio');
assert.match(await locked.text(), /Senha de acesso/);
const login = await site.fetch(new Request('https://example.com/api/login', { method: 'POST', headers: { origin: 'https://example.com', 'content-type': 'application/json' }, body: JSON.stringify({ password: 'temporary-test-secret' }) }), env);
assert.equal(login.status, 200);
const cookie = login.headers.get('set-cookie').split(';')[0];
const studio = await get('/estudio', cookie);
assert.match(await studio.text(), /Nova matéria/);
const form = new FormData();
for (const [key, value] of Object.entries({ title: 'Uma nova entrevista', summary: 'Uma conversa no canal.', body: 'Um primeiro parágrafo.\n\nUm segundo parágrafo.', author: 'Daniel', category: 'Entrevistas', mediaType: 'youtube', youtubeUrl: 'https://www.youtube.com/watch?v=AEpIlBYMN34' })) form.set(key, value);
const created = await site.fetch(new Request('https://example.com/api/posts', { method: 'POST', headers: { origin: 'https://example.com', cookie }, body: form }), env);
assert.equal(created.status, 201);
const { url } = await created.json();
const published = await get(url);
assert.match(await published.text(), /Uma nova entrevista/);
console.log('Smoke checks passed.');
