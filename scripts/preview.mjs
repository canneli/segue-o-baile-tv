import { createServer } from 'node:http';
import site from '../dist/server/index.js';

const env = {
  EDITOR_PASSWORD: process.env.EDITOR_PASSWORD || '',
  BUCKET: {
    async list() { return { objects: [] }; },
    async get() { return null; },
  },
};

createServer(async (incoming, outgoing) => {
  const request = new Request(`http://127.0.0.1:4173${incoming.url}`, { method: incoming.method, headers: incoming.headers });
  const response = await site.fetch(request, env);
  outgoing.writeHead(response.status, Object.fromEntries(response.headers));
  outgoing.end(Buffer.from(await response.arrayBuffer()));
}).listen(4173, '127.0.0.1', () => console.log('Preview at http://127.0.0.1:4173'));
