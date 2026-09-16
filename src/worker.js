const CATEGORIES = ['Tudo', 'Entrevistas', 'Música', 'Coberturas', 'Histórias'];
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const encoder = new TextEncoder();

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function slugify(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
}
function dateLabel(value) {
  if (!value) return 'Acervo do canal';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(new Date(value));
}
function youtubeId(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(parsed.hostname)) {
      const id = parsed.pathname.startsWith('/shorts/') ? parsed.pathname.split('/')[2] : parsed.searchParams.get('v');
      return /^[\w-]{11}$/.test(id || '') ? id : '';
    }
    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.slice(1);
      return /^[\w-]{11}$/.test(id) ? id : '';
    }
  } catch { /* invalid URL */ }
  return '';
}
function imageFor(post) {
  return post.imageUrl || (post.youtubeId ? `https://i.ytimg.com/vi/${post.youtubeId}/hqdefault.jpg` : '');
}
function mediaFor(post, large = false) {
  const image = imageFor(post);
  if (image) return `<img src="${esc(image)}" alt="" loading="${large ? 'eager' : 'lazy'}">`;
  if (post.videoUrl) return '<div class="video-visual"><span>▶</span><small>Vídeo</small></div>';
  return '<div class="media-fallback"><span>SEGUE<br>O BAILE</span><b>TV</b></div>';
}
function response(body, type = 'text/html; charset=utf-8', status = 200, headers = {}) {
  return new Response(body, { status, headers: { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers } });
}
function json(data, status = 200, headers = {}) {
  return response(JSON.stringify(data), 'application/json; charset=utf-8', status, headers);
}
function document(title, content, options = {}) {
  const studio = options.studio ? ' studio-page' : '';
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#0b1116"><meta name="description" content="Segue o Baile TV: entrevistas, música, histórias e coberturas de quem vive a cena."><title>${esc(title)} | Segue o Baile TV</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="stylesheet" href="/site.css"></head><body class="${studio}"><div class="site-noise"></div>${content}<script src="/site.js" defer></script></body></html>`;
}
function header(active = '') {
  return `<header class="site-header"><div class="header-inner"><a class="brand" href="/" aria-label="Segue o Baile TV, início"><img src="/logo.png" alt="Segue o Baile TV"></a><nav class="main-nav" aria-label="Navegação principal"><a href="/" ${active === 'home' ? 'aria-current="page"' : ''}>Início</a><a href="/#materias">Matérias</a><a href="/#videos">Vídeos</a></nav><div class="header-actions"><a class="youtube-link" href="https://www.youtube.com/@SegueoBaileTV/videos" target="_blank" rel="noopener noreferrer"><span>▶</span> YouTube</a><a class="studio-link" href="/estudio">Estúdio <span>↗</span></a></div></div></header>`;
}
function footer() {
  return `<footer class="site-footer"><div class="footer-top"><img src="/logo.png" alt="Segue o Baile TV"><p>Entrevistas, música e histórias de quem faz a cena acontecer.</p><a href="https://www.youtube.com/@SegueoBaileTV/videos" target="_blank" rel="noopener noreferrer">Acompanhe no YouTube ↗</a></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Segue o Baile TV</span><span>Feito para seguir a cultura de perto.</span></div></footer>`;
}
function card(post, index = 0) {
  return `<article class="story-card" data-category="${esc(post.category)}" data-search="${esc(`${post.title} ${post.summary} ${post.category}`.toLowerCase())}"><a class="story-image" href="/materia/${encodeURIComponent(post.id)}">${mediaFor(post)}<span class="image-corner">0${index + 1}</span></a><div class="story-copy"><div class="card-meta"><span>${esc(post.category)}</span><span>${dateLabel(post.publishedAt)}</span></div><h3><a href="/materia/${encodeURIComponent(post.id)}">${esc(post.title)}</a></h3><p>${esc(post.summary)}</p><a class="text-link" href="/materia/${encodeURIComponent(post.id)}">Ler matéria <span>↗</span></a></div></article>`;
}
function home(posts) {
  const featured = posts[0] || EXAMPLES[0];
  const rest = posts.filter((post) => post.id !== featured.id);
  const hero = `<section class="hero"><div class="hero-copy"><div class="eyebrow"><span class="eyebrow-square"></span> CULTURA • MÚSICA • GENTE</div><h1>A cena não<br>para. <em>O baile</em><br>também não.</h1><p>O lugar das conversas, sons e histórias que movimentam a cultura — dentro e fora da pista.</p><div class="hero-actions"><a class="button-primary" href="#materias">Explorar matérias <span>↗</span></a><a class="button-outline" href="https://www.youtube.com/@SegueoBaileTV/videos" target="_blank" rel="noopener noreferrer">Ver o canal <span>▶</span></a></div><div class="hero-stamp"><b>TV</b><span>NA RUA<br>NA CENA<br>NO BAILE</span></div></div><a class="hero-feature" href="/materia/${encodeURIComponent(featured.id)}"><div class="feature-media">${mediaFor(featured, true)}</div><div class="feature-overlay"><span class="feature-label">EM DESTAQUE <i>●</i> ${esc(featured.category)}</span><h2>${esc(featured.title)}</h2><span class="feature-cta">Confira a matéria <b>↗</b></span></div></a></section>`;
  const filters = CATEGORIES.map((category, index) => `<button type="button" class="filter-chip ${index === 0 ? 'active' : ''}" data-filter="${esc(category)}" aria-pressed="${index === 0}">${esc(category)}</button>`).join('');
  return document('Cultura em movimento', `${header('home')}<main>${hero}<section class="ticker" aria-hidden="true"><div>SEGUE O BAILE <span>✳</span> CULTURA EM MOVIMENTO <span>✳</span> SEGUE O BAILE <span>✳</span> CULTURA EM MOVIMENTO <span>✳</span></div></section><section class="editorial-section" id="materias"><div class="section-heading"><div><span class="section-kicker">01 / O QUE ESTÁ ROLANDO</span><h2>Matérias<span class="accent-dot">.</span></h2></div><p>Direto do canal para você mergulhar nas histórias.</p></div><div class="browse-row"><div class="filter-list" role="group" aria-label="Filtrar matérias">${filters}</div><label class="search-box"><span aria-hidden="true">⌕</span><input id="story-search" type="search" placeholder="Buscar matéria" aria-label="Buscar matéria"></label></div><div class="story-grid" id="story-grid">${rest.map(card).join('')}</div><p class="no-results" id="no-results" hidden>Nenhuma matéria encontrada. Tente outra busca.</p></section><section class="channel-section" id="videos"><div class="channel-copy"><span class="section-kicker">02 / DÊ O PLAY</span><h2>O melhor da cena,<br><em>sem cortes.</em></h2><p>Entrevistas, coberturas e encontros completos no canal oficial.</p><a class="button-primary" href="https://www.youtube.com/@SegueoBaileTV/videos" target="_blank" rel="noopener noreferrer">Assistir no YouTube <span>↗</span></a></div><div class="channel-screen"><img src="https://i.ytimg.com/vi/5BkZ09SDxOU/hqdefault.jpg" alt="Miniatura do vídeo com Jojo Toddynho"><a href="https://www.youtube.com/watch?v=5BkZ09SDxOU" target="_blank" rel="noopener noreferrer" aria-label="Assistir entrevista com Jojo Toddynho">▶</a><span>SEGUE O BAILE TV / ENTREVISTAS</span></div></section></main>${footer()}`);
}
function article(post, posts) {
  const related = posts.filter((item) => item.id !== post.id).slice(0, 3);
  const media = post.youtubeId ? `<div class="article-video"><iframe src="https://www.youtube-nocookie.com/embed/${esc(post.youtubeId)}" title="Vídeo: ${esc(post.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>` : post.videoUrl ? `<video class="article-upload-video" src="${esc(post.videoUrl)}" controls preload="metadata"></video>` : post.imageUrl ? `<img class="article-cover" src="${esc(post.imageUrl)}" alt="Imagem da matéria ${esc(post.title)}">` : '';
  const paragraphs = String(post.body || '').split(/\n\s*\n/).filter(Boolean).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  return document(post.title, `${header()}<main class="article-main"><div class="article-top"><a class="back-link" href="/">← Voltar ao portal</a><div class="article-topline"><span>${esc(post.category)}</span><span>${dateLabel(post.publishedAt)}</span></div><h1>${esc(post.title)}</h1><p class="article-deck">${esc(post.summary)}</p><div class="byline"><span class="byline-mark">SB</span><span>Por <strong>${esc(post.author || 'Redação Segue o Baile TV')}</strong></span></div></div><div class="article-media">${media}</div><div class="article-layout"><div class="article-body">${paragraphs}${post.youtubeId ? `<a class="article-watch" href="https://www.youtube.com/watch?v=${esc(post.youtubeId)}" target="_blank" rel="noopener noreferrer">Assistir ao vídeo no YouTube ↗</a>` : ''}</div><aside class="article-aside"><span>COMPARTILHE ESTA HISTÓRIA</span><button type="button" class="share-button" data-share="${esc(post.title)}">Copiar link ↗</button><div class="aside-line"></div><span>CONTINUE NO BAILE</span><a href="/">Explorar outras matérias ↗</a></aside></div><section class="related-section"><div class="section-heading"><div><span class="section-kicker">MAIS PARA VOCÊ</span><h2>O baile continua<span class="accent-dot">.</span></h2></div></div><div class="story-grid">${related.map(card).join('')}</div></section></main>${footer()}`);
}
function studioLogin() {
  return document('Entrar no estúdio', `${header()}<main class="login-wrap"><div class="login-art"><span>ESTÚDIO<br>SEGUE O<br>BAILE<span class="accent-dot">.</span></span><p>Crie uma matéria. O design acompanha.</p></div><form id="login-form" class="login-card"><span class="section-kicker">ÁREA DE PUBLICAÇÃO</span><h1>Boas-vindas<br>ao estúdio.</h1><p>Digite a senha editorial para continuar.</p><label for="password">Senha de acesso</label><input id="password" name="password" type="password" autocomplete="current-password" required><button class="button-primary" type="submit">Entrar no estúdio <span>↗</span></button><p id="login-message" class="form-message" role="status"></p></form></main>${footer()}`, { studio: true });
}
function studio(posts) {
  const rows = posts.filter((p) => !EXAMPLES.some((e) => e.id === p.id)).map((p) => `<a href="/materia/${encodeURIComponent(p.id)}"><strong>${esc(p.title)}</strong><span>${esc(p.category)} · ${dateLabel(p.publishedAt)} ↗</span></a>`).join('') || '<p class="empty-posts">As próximas matérias publicadas aparecem aqui.</p>';
  return document('Estúdio de publicação', `${header()}<main class="studio-main"><div class="studio-heading"><div><span class="section-kicker">ÁREA DE PUBLICAÇÃO</span><h1>Nova matéria<span class="accent-dot">.</span></h1><p>Preencha, confira o resultado e publique. A identidade visual é aplicada automaticamente.</p></div><button id="logout" class="logout-button" type="button">Sair do estúdio</button></div><div class="studio-layout"><form id="post-form" class="editor-form"><div class="form-section"><div class="form-section-head"><span>01</span><h2>O conteúdo</h2></div><div class="field-row"><label>Categoria<select name="category" id="post-category"><option>Entrevistas</option><option>Música</option><option>Coberturas</option><option>Histórias</option></select></label><label>Autoria<input name="author" id="post-author" value="Redação Segue o Baile TV" maxlength="80" required></label></div><label>Título da matéria<input name="title" id="post-title" placeholder="Qual é a história?" maxlength="110" required></label><label>Resumo<input name="summary" id="post-summary" placeholder="Uma chamada curta para o portal" maxlength="220" required></label><label>Texto da matéria<textarea name="body" id="post-body" rows="9" placeholder="Conte a história aqui. Separe os parágrafos com uma linha em branco." maxlength="12000" required></textarea></label></div><div class="form-section"><div class="form-section-head"><span>02</span><h2>Imagem ou vídeo</h2></div><p class="form-help">Escolha uma opção. Para vídeos grandes, use o link do YouTube.</p><div class="media-tabs" role="radiogroup" aria-label="Tipo de mídia"><label><input type="radio" name="mediaType" value="youtube" checked><span>Link do YouTube</span></label><label><input type="radio" name="mediaType" value="image"><span>Enviar imagem</span></label><label><input type="radio" name="mediaType" value="video"><span>Enviar vídeo</span></label></div><div id="youtube-field" class="media-field"><label>Link do vídeo<input name="youtubeUrl" id="post-youtube" type="url" placeholder="https://www.youtube.com/watch?v=..."></label></div><div id="file-field" class="media-field" hidden><label>Arquivo<input name="media" id="post-file" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"></label><small>JPG, PNG, WebP, MP4 ou WebM · até 25 MB</small></div></div><div class="form-actions"><button class="button-primary" id="publish-button" type="submit">Publicar matéria <span>↗</span></button><span id="publish-message" role="status"></span></div></form><aside class="studio-side"><div class="preview-panel"><div class="preview-heading"><span>PRÉVIA EM TEMPO REAL</span><i>●</i></div><div class="preview-card"><div class="preview-image" id="preview-image"><span>IMAGEM OU VÍDEO</span></div><div class="preview-copy"><span id="preview-category">ENTREVISTAS</span><h3 id="preview-title">Seu título aparece aqui</h3><p id="preview-summary">O resumo da matéria aparece aqui, já no padrão visual do portal.</p><small>SEGUE O BAILE TV</small></div></div><p>É assim que a matéria vai aparecer no portal. O texto completo usa a mesma tipografia e espaçamento.</p></div><div class="published-panel"><h2>Publicadas por você</h2><div id="published-list">${rows}</div></div></aside></div></main>${footer()}`, { studio: true });
}
async function storedPosts(env) {
  if (!env.BUCKET) return [];
  const entries = await env.BUCKET.list({ prefix: 'posts/' });
  const objects = await Promise.all(entries.objects.slice(0, 100).map((item) => env.BUCKET.get(item.key)));
  const posts = await Promise.all(objects.filter(Boolean).map((object) => object.json()));
  return posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}
async function allPosts(env) {
  return [...await storedPosts(env), ...EXAMPLES];
}
async function sign(value, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
async function authorized(request, env) {
  if (!env.EDITOR_PASSWORD) return false;
  const cookie = request.headers.get('cookie')?.match(/(?:^|;\s*)sb_session=([^;]+)/)?.[1];
  if (!cookie) return false;
  const [expiry, signature] = cookie.split('.');
  if (!expiry || !signature || Number(expiry) < Date.now()) return false;
  return signature === await sign(expiry, env.EDITOR_PASSWORD);
}
function sameOrigin(request) {
  const origin = request.headers.get('origin');
  return !!origin && origin === new URL(request.url).origin;
}
async function publish(request, env) {
  if (!await authorized(request, env)) return json({ error: 'Entre novamente no estúdio.' }, 401);
  if (!sameOrigin(request)) return json({ error: 'Origem não autorizada.' }, 403);
  if (!env.BUCKET) return json({ error: 'O armazenamento ainda não está disponível.' }, 503);
  const form = await request.formData();
  const title = String(form.get('title') || '').trim();
  const summary = String(form.get('summary') || '').trim();
  const body = String(form.get('body') || '').trim();
  const author = String(form.get('author') || '').trim();
  const category = String(form.get('category') || 'Entrevistas');
  const mediaType = String(form.get('mediaType') || 'youtube');
  const url = String(form.get('youtubeUrl') || '').trim();
  if (!title || title.length > 110 || !summary || summary.length > 220 || !body || body.length > 12000 || !author || author.length > 80 || !CATEGORIES.includes(category) || category === 'Tudo') return json({ error: 'Revise título, resumo, texto, autoria e categoria.' }, 400);
  const post = { id: `${slugify(title) || 'materia'}-${crypto.randomUUID().slice(0, 6)}`, title, summary, body, author, category, publishedAt: new Date().toISOString() };
  if (mediaType === 'youtube') {
    post.youtubeId = youtubeId(url);
    if (!post.youtubeId) return json({ error: 'Cole um link válido de vídeo do YouTube.' }, 400);
  } else if (['image', 'video'].includes(mediaType)) {
    const file = form.get('media');
    if (!(file instanceof File) || !file.size || file.size > MAX_FILE_BYTES) return json({ error: 'Escolha um arquivo de até 25 MB.' }, 400);
    const types = mediaType === 'image' ? ['image/jpeg', 'image/png', 'image/webp'] : ['video/mp4', 'video/webm'];
    if (!types.includes(file.type)) return json({ error: 'Formato de arquivo não aceito.' }, 400);
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm' }[file.type];
    const key = `media/${crypto.randomUUID()}.${ext}`;
    await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
    post[mediaType === 'image' ? 'imageUrl' : 'videoUrl'] = `/${key}`;
  } else return json({ error: 'Escolha uma imagem ou vídeo.' }, 400);
  await env.BUCKET.put(`posts/${post.id}.json`, JSON.stringify(post), { httpMetadata: { contentType: 'application/json' } });
  return json({ ok: true, url: `/materia/${post.id}`, title: post.title }, 201);
}
async function route(request, env) {
  const url = new URL(request.url);
  const path = decodeURIComponent(url.pathname);
  if (path === '/site.css') return response(SITE_CSS, 'text/css; charset=utf-8', 200, { 'cache-control': 'public, max-age=3600' });
  if (path === '/site.js') return response(SITE_JS, 'text/javascript; charset=utf-8', 200, { 'cache-control': 'public, max-age=3600' });
  if (path === '/logo.png') {
    const bytes = Uint8Array.from(atob(LOGO_BASE64), (char) => char.charCodeAt(0));
    return response(bytes, 'image/png', 200, { 'cache-control': 'public, max-age=604800' });
  }
  if (path === '/favicon.svg') return response('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#0b1116"/><path d="M14 18h26c9 0 13 5 13 11 0 4-3 7-7 8 6 1 9 5 9 10 0 7-6 11-15 11H14V18zm11 10v7h14c3 0 4-2 4-4s-1-3-4-3H25zm0 16v6h15c3 0 5-1 5-3s-2-3-5-3H25z" fill="#ff6b1b"/><circle cx="51" cy="14" r="6" fill="#20b7d6"/></svg>', 'image/svg+xml', 200, { 'cache-control': 'public, max-age=604800' });
  if (path.startsWith('/media/')) {
    if (!/^\/media\/[\w-]+\.(jpg|png|webp|mp4|webm)$/.test(path)) return response('Não encontrado', 'text/plain', 404);
    const object = await env.BUCKET?.get(path.slice(1));
    if (!object) return response('Não encontrado', 'text/plain', 404);
    return response(object.body, object.httpMetadata?.contentType || 'application/octet-stream', 200, { 'cache-control': 'public, max-age=604800' });
  }
  if (path === '/api/login' && request.method === 'POST') {
    if (!sameOrigin(request)) return json({ error: 'Origem não autorizada.' }, 403);
    const input = await request.json();
    if (!env.EDITOR_PASSWORD || input.password !== env.EDITOR_PASSWORD) return json({ error: 'Senha incorreta.' }, 401);
    const expiry = String(Date.now() + 7 * 86400000);
    const signature = await sign(expiry, env.EDITOR_PASSWORD);
    return json({ ok: true }, 200, { 'set-cookie': `sb_session=${expiry}.${signature}; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Strict` });
  }
  if (path === '/api/logout' && request.method === 'POST') return json({ ok: true }, 200, { 'set-cookie': 'sb_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict' });
  if (path === '/api/posts' && request.method === 'POST') return publish(request, env);
  if (request.method !== 'GET') return response('Método não permitido', 'text/plain', 405);
  if (path === '/estudio') {
    if (!await authorized(request, env)) return response(studioLogin(), 'text/html; charset=utf-8', 200, { 'x-robots-tag': 'noindex' });
    return response(studio(await allPosts(env)), 'text/html; charset=utf-8', 200, { 'x-robots-tag': 'noindex' });
  }
  if (path === '/') return response(home(await allPosts(env)));
  if (path.startsWith('/materia/')) {
    const posts = await allPosts(env);
    const post = posts.find((item) => item.id === path.slice('/materia/'.length));
    return post ? response(article(post, posts)) : response(document('Matéria não encontrada', `${header()}<main class="not-found"><h1>Essa matéria não está no baile.</h1><a class="button-primary" href="/">Voltar ao portal ↗</a></main>${footer()}`), 'text/html; charset=utf-8', 404);
  }
  return response(document('Página não encontrada', `${header()}<main class="not-found"><h1>Página não encontrada.</h1><a class="button-primary" href="/">Voltar ao portal ↗</a></main>${footer()}`), 'text/html; charset=utf-8', 404);
}

export default {
  async fetch(request, env) {
    try { return await route(request, env); }
    catch (error) { console.error('Site request failed', error); return response('O portal está temporariamente indisponível. Tente novamente em instantes.', 'text/plain; charset=utf-8', 503); }
  },
};
