(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const id = new URLSearchParams(location.search).get('id');
  const status = get('storyStatus'), retry = get('storyRetry');
  const client = window.supabase?.createClient('https://bgzlqvbvmstebdsnzmqv.supabase.co', 'sb_publishable_Vr9Pah1UIb3EjRNTfT5vgg_VPnz3vl-');
  async function load() {
    retry.hidden = true; status.hidden = false; status.textContent = 'Loading story…';
    if (!id || !/^\d{1,20}$/.test(id)) { status.textContent = 'This story link is invalid. Return to the homepage to choose a story.'; return; }
    try {
      if (!client) throw new Error('Unavailable');
      const {data, error} = await client.from('news_items').select('id,title,summary,category,source_name,source_url,published_at').eq('id', id).eq('status','published').maybeSingle();
      if (error) throw error;
      if (!data) { status.textContent = 'This story is no longer available. Explore the latest stories on the homepage.'; return; }
      const url = new URL(data.source_url);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid source');
      document.title = data.title + ' | Peppermoon';
      get('storyTitle').textContent = data.title;
      get('storyCategory').textContent = data.category;
      let meta = 'Source: ' + data.source_name;
      const date = new Date(data.published_at);
      if (data.published_at && !Number.isNaN(date.valueOf())) meta += ' · ' + date.toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});
      get('storyMeta').textContent = meta;
      get('storySummary').textContent = data.summary || 'Read the original publisher’s story for the full report.';
      get('storyCredit').textContent = 'An excerpt from ' + data.source_name + '. Read the complete report at the original publisher.';
      get('storyOriginal').href = url.href;
      get('storyOriginal').textContent = 'Read full story on ' + data.source_name + ' ↗';
      const type = {'Gaming':'gaming','Movies':'movies','TV Series':'tv'}[data.category] || 'entertainment';
      get('storyImage').src = 'assets/news-' + type + '.svg';
      get('storyContent').hidden = false; status.hidden = true;
    } catch { status.textContent = 'Unable to load this story right now. Please try again.'; retry.hidden = false; }
  }
  retry.addEventListener('click',load); load();
})();
