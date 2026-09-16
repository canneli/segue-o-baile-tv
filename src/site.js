(() => {
  const $ = (selector) => document.querySelector(selector);
  const all = (selector) => [...document.querySelectorAll(selector)];

  const filters = all('[data-filter]');
  const search = $('#story-search');
  function filterStories() {
    const active = filters.find((button) => button.classList.contains('active'))?.dataset.filter || 'Tudo';
    const term = (search?.value || '').toLocaleLowerCase('pt-BR').trim();
    let shown = 0;
    all('#story-grid .story-card').forEach((card) => {
      const match = (active === 'Tudo' || card.dataset.category === active) && (!term || card.dataset.search.includes(term));
      card.hidden = !match;
      if (match) shown++;
    });
    const empty = $('#no-results');
    if (empty) empty.hidden = shown > 0;
  }
  filters.forEach((button) => button.addEventListener('click', () => {
    filters.forEach((item) => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
    filterStories();
  }));
  search?.addEventListener('input', filterStories);

  all('[data-share]').forEach((button) => button.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href); button.textContent = 'Link copiado ✓'; }
    catch { button.textContent = 'Copie o endereço do navegador'; }
  }));

  const login = $('#login-form');
  login?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = login.querySelector('button');
    const message = $('#login-message');
    button.disabled = true;
    message.textContent = 'Entrando…';
    try {
      const result = await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: $('#password').value }) });
      const data = await result.json();
      if (!result.ok) throw new Error(data.error || 'Não foi possível entrar.');
      location.href = '/estudio';
    } catch (error) { message.textContent = error.message; button.disabled = false; }
  });

  $('#logout')?.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    location.href = '/estudio';
  });

  const postForm = $('#post-form');
  if (!postForm) return;
  let objectUrl = '';
  const title = $('#post-title');
  const summary = $('#post-summary');
  const category = $('#post-category');
  const youtube = $('#post-youtube');
  const file = $('#post-file');
  const previewImage = $('#preview-image');
  const imagePlaceholder = previewImage.innerHTML;
  function youtubeId(value) {
    try {
      const url = new URL(value);
      const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.pathname.startsWith('/shorts/') ? url.pathname.split('/')[2] : url.searchParams.get('v');
      return /^[\w-]{11}$/.test(id || '') ? id : '';
    } catch { return ''; }
  }
  function updatePreview() {
    $('#preview-title').textContent = title.value.trim() || 'Seu título aparece aqui';
    $('#preview-summary').textContent = summary.value.trim() || 'O resumo da matéria aparece aqui, já no padrão visual do portal.';
    $('#preview-category').textContent = category.value;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = '';
    previewImage.replaceChildren();
    const mode = postForm.querySelector('input[name="mediaType"]:checked')?.value;
    const selected = file.files?.[0];
    let imageSource = '';
    if (mode === 'youtube') {
      const id = youtubeId(youtube.value);
      if (id) imageSource = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    } else if (selected) {
      objectUrl = URL.createObjectURL(selected);
      imageSource = objectUrl;
    }
    if (imageSource) {
      const media = mode === 'video' ? document.createElement('video') : document.createElement('img');
      media.src = imageSource;
      if (mode === 'video') media.muted = true;
      media.alt = '';
      previewImage.append(media);
    } else previewImage.innerHTML = imagePlaceholder;
  }
  [title, summary, category, youtube, file].forEach((input) => input.addEventListener(input === category || input === file ? 'change' : 'input', updatePreview));
  all('input[name="mediaType"]').forEach((radio) => radio.addEventListener('change', () => {
    const isLink = radio.value === 'youtube';
    $('#youtube-field').hidden = !isLink;
    $('#file-field').hidden = isLink;
    youtube.required = isLink;
    file.required = !isLink;
    file.accept = radio.value === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp';
    file.value = '';
    updatePreview();
  }));
  youtube.required = true;

  postForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = $('#publish-button');
    const message = $('#publish-message');
    if (file.files?.[0]?.size > 25 * 1024 * 1024) { message.textContent = 'O arquivo precisa ter até 25 MB.'; return; }
    button.disabled = true;
    button.textContent = 'Publicando…';
    message.textContent = 'Enviando sua matéria';
    try {
      const result = await fetch('/api/posts', { method: 'POST', body: new FormData(postForm) });
      const data = await result.json();
      if (!result.ok) throw new Error(data.error || 'Não foi possível publicar.');
      message.textContent = 'Matéria publicada!';
      location.href = data.url;
    } catch (error) {
      message.textContent = error.message;
      button.disabled = false;
      button.innerHTML = 'Publicar matéria <span>↗</span>';
    }
  });
})();
