(() => {
  const $ = (selector) => document.querySelector(selector);
  const form = $('#post-form');
  if (!form) return;
  const file = $('#post-file');
  const youtube = $('#post-youtube');
  const preview = $('#preview-image');
  const placeholder = preview.innerHTML;
  let objectUrl = '';
  function videoId(value) {
    try {
      const url = new URL(value);
      if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname)) return '';
      const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.pathname.startsWith('/shorts/') ? url.pathname.split('/')[2] : url.searchParams.get('v');
      return /^[\w-]{11}$/.test(id || '') ? id : '';
    } catch { return ''; }
  }
  function refresh() {
    $('#preview-title').textContent = $('#post-title').value.trim() || 'Seu título aparece aqui';
    $('#preview-summary').textContent = $('#post-summary').value.trim() || 'O resumo da matéria aparece aqui, já no padrão visual do portal.';
    $('#preview-category').textContent = $('#post-category').value;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = '';
    preview.replaceChildren();
    const mode = form.querySelector('input[name="mediaType"]:checked').value;
    const selected = file.files?.[0];
    let source = '';
    if (mode === 'youtube') {
      const id = videoId(youtube.value);
      if (id) source = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    } else if (selected) source = objectUrl = URL.createObjectURL(selected);
    if (source) {
      const media = document.createElement(mode === 'video' ? 'video' : 'img');
      media.src = source;
      if (mode === 'video') media.muted = true;
      media.alt = '';
      preview.append(media);
    } else preview.innerHTML = placeholder;
  }
  for (const input of [$('#post-title'), $('#post-summary'), $('#post-category'), youtube, file]) input.addEventListener(input === file || input.id === 'post-category' ? 'change' : 'input', refresh);
  for (const radio of document.querySelectorAll('input[name="mediaType"]')) radio.addEventListener('change', () => {
    const mode = form.querySelector('input[name="mediaType"]:checked').value;
    $('#youtube-field').hidden = mode !== 'youtube';
    $('#file-field').hidden = mode === 'youtube';
    youtube.required = mode === 'youtube';
    file.required = mode !== 'youtube';
    file.accept = mode === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp';
    file.value = '';
    refresh();
  });
  youtube.required = true;

  function base64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
  }
  async function githubPut(path, bytes, token, message) {
    const response = await fetch(`https://api.github.com/repos/canneli/segue-o-baile-tv/contents/${path}`, {
      method: 'PUT',
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, content: base64(bytes), branch: 'main' }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(response.status === 401 || response.status === 403 ? 'Chave recusada. Confira se ela tem acesso a este repositório e permissão Contents: Read and write.' : data.message || `Falha ao salvar no GitHub (${response.status}).`);
    }
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = $('#publish-button');
    const message = $('#publish-message');
    const token = $('#github-token').value.trim();
    const mode = form.querySelector('input[name="mediaType"]:checked').value;
    const selected = file.files?.[0];
    if (!token) { message.textContent = 'Cole sua chave de publicação.'; return; }
    if (mode === 'youtube' && !videoId(youtube.value)) { message.textContent = 'Cole um link válido do YouTube.'; return; }
    if (mode !== 'youtube' && (!selected || selected.size > 25 * 1024 * 1024)) { message.textContent = 'Escolha um arquivo de até 25 MB.'; return; }
    const types = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm' };
    if (mode !== 'youtube' && (!types[selected.type] || (mode === 'video') !== selected.type.startsWith('video/'))) { message.textContent = 'Formato de arquivo não aceito.'; return; }
    const title = $('#post-title').value.trim();
    const slug = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'materia';
    const id = `${slug}-${crypto.randomUUID().slice(0, 6)}`;
    const post = {
      id, title, summary: $('#post-summary').value.trim(), body: $('#post-body').value.trim(),
      author: $('#post-author').value.trim(), category: $('#post-category').value,
      publishedAt: new Date().toISOString(),
    };
    button.disabled = true;
    button.textContent = 'Publicando…';
    try {
      if (mode === 'youtube') post.youtubeId = videoId(youtube.value);
      else {
        const path = `media/${id}.${types[selected.type]}`;
        message.textContent = 'Enviando mídia ao GitHub…';
        await githubPut(path, new Uint8Array(await selected.arrayBuffer()), token, `Adiciona mídia para ${title}`);
        post[mode === 'image' ? 'imageUrl' : 'videoUrl'] = `/${path}`;
      }
      message.textContent = 'Salvando matéria e atualizando o portal…';
      await githubPut(`posts/${id}.json`, new TextEncoder().encode(`${JSON.stringify(post, null, 2)}\n`), token, `Publica matéria: ${title}`);
      const link = document.createElement('a');
      link.href = `/segue-o-baile-tv/materia/${id}/`;
      link.textContent = 'Abrir matéria ↗';
      message.replaceChildren('Matéria enviada! Aguarde alguns minutos para a atualização. ', link);
      form.reset();
      refresh();
    } catch (error) { message.textContent = error.message; }
    finally { button.disabled = false; button.innerHTML = 'Publicar matéria <span>↗</span>'; }
  });
})();
