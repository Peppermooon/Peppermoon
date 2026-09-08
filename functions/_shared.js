
export function esc(value=''){
  return String(value).replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

export function sharePage({title,description,image,canonical,destination,kind='article'}){
  const t=esc(title || 'Peppermoon');
  const d=esc(description || 'Discover gaming, movies, TV and community discussions on Peppermoon.');
  const i=esc(image || '');
  const c=esc(canonical);
  const dest=JSON.stringify(destination);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">

<title>${t} | Peppermoon</title>
<meta name="description" content="${d}">
<link rel="canonical" href="${c}">

<meta property="og:type" content="${kind}">
<meta property="og:site_name" content="Peppermoon">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${c}">
${i ? `<meta property="og:image" content="${i}">
<meta property="og:image:secure_url" content="${i}">
<meta property="og:image:alt" content="${t}">` : ''}

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
${i ? `<meta name="twitter:image" content="${i}">` : ''}

<script>
(function(){
  var ua=navigator.userAgent||'';
  var bot=/facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Discordbot|TelegramBot|Slackbot|Pinterest|Googlebot/i.test(ua);
  if(!bot){ location.replace(${dest}); }
})();
</script>
</head>
<body>
  <p>Opening Peppermoon…</p>
  <noscript><p><a href="${esc(destination)}">Open this on Peppermoon</a></p></noscript>
</body>
</html>`;
}
