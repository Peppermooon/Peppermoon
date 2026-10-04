(() => {
  'use strict';
  const grid = document.getElementById('newsGrid');
  if (!grid) return;
  const status = document.getElementById('newsStatus');
  const more = document.getElementById('newsMore');
  const retry = document.getElementById('newsRetry');
  const search = document.getElementById('newsSearch');
  let offset = 0, busy = false, requestVersion = 0, timer;
  const size = 24;
  const icons = {'Gaming':'🎮', 'Movies':'🎬', 'TV Series':'📺', 'Entertainment':'🌙'};
  const tones = {'Gaming':'art-game', 'Movies':'art-movie', 'TV Series':'art-tv', 'Entertainment':'art-feature'};
  const client = window.supabase?.createClient('https://bgzlqvbvmstebdsnzmqv.supabase.co', 'sb_publishable_Vr9Pah1UIb3EjRNTfT5vgg_VPnz3vl-');
  function node(tag, cls, value) {
    const el = document.createElement(tag); el.className = cls;
    if (value !== undefined) el.textContent = value;
    return el;
  }
  function card(item) {
    let url;
    try { url = new URL(item.source_url); } catch { return null; }
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const article = node('a', 'card news-card');
    article.href = 'news.html?id=' + encodeURIComponent(item.id);
    article.setAttribute('aria-label', item.title);
    const art = node('div', 'card-art news-card-image');
    const image = document.createElement('img');
    const type = {'Gaming':'gaming','Movies':'movies','TV Series':'tv'}[item.category] || 'entertainment';
    image.src = 'assets/news-' + type + '.svg';
    image.alt = ''; image.loading = 'lazy'; image.width = 960; image.height = 540;
    art.append(image, node('span', 'tag', item.category));
    const body = node('div', 'card-body');
    const meta = node('div', 'meta', item.source_name);
    if (item.published_at) {
      const date = new Date(item.published_at);
      if (!Number.isNaN(date.valueOf())) {
        const time = node('time', '', date.toLocaleDateString(undefined, {year:'numeric',month:'short',day:'numeric'}));
        time.dateTime = date.toISOString(); meta.append(document.createTextNode(' · '), time);
      }
    }
    const heading = node('h3', '', item.title);
    const link = node('span', 'news-original', 'Read story →');
    body.append(meta, heading);
    if (item.summary) body.append(node('p', '', item.summary));
    body.append(link); article.append(art, body); return article;
  }
  async function load(reset = false) {
    if (busy && !reset) return;
    const version = ++requestVersion;
    busy = true;
    if (reset) { offset = 0; grid.replaceChildren(); }
    status.textContent = 'Loading stories…'; retry.hidden = true; more.disabled = true;
    grid.setAttribute('aria-busy', 'true');
    try {
      if (!client) throw new Error('Client unavailable');
      let query = client.from('news_items')
        .select('id,title,summary,category,source_name,source_url,published_at')
        .eq('status', 'published')
        .order('published_at', {ascending:false, nullsFirst:false})
        .order('id', {ascending:false});
      const term = search.value.trim();
      if (term) query = query.ilike('title', '%' + term.replace(/[\\%_]/g, '\\$&') + '%');
      const {data, error} = await query.range(offset, offset + size - 1);
      if (version !== requestVersion) return;
      if (error) throw error;
      for (const item of data || []) { const el = card(item); if (el) grid.append(el); }
      offset += (data || []).length;
      more.hidden = (data || []).length < size;
      status.textContent = offset ? `${offset} stories shown · Newest first` : (term ? 'No stories match your search.' : 'New stories will appear here soon.');
    } catch {
      if (version !== requestVersion) return;
      status.textContent = 'Stories could not be loaded. Please try again shortly.';
      retry.hidden = false; more.hidden = true;
    } finally {
      if (version === requestVersion) { busy = false; more.disabled = false; grid.setAttribute('aria-busy', 'false'); }
    }
  }
  search.addEventListener('input', () => {
    ++requestVersion; clearTimeout(timer);
    timer = setTimeout(() => load(true), 300);
  });
  document.getElementById('siteSearch')?.addEventListener('input', event => {
    search.value = event.target.value;
    search.dispatchEvent(new Event('input'));
  });
  more.addEventListener('click', () => load());
  retry.addEventListener('click', () => load(offset === 0));
  load(true);
})();

