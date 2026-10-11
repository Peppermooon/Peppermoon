# Peppermoon manual article publishing

Home now reads your existing `articles` table. Only rows with `status = published` and `show_on_homepage = true` appear, newest first. Imported `news_items` are no longer displayed on Home. The scheduled RSS collector workflow has been removed.

## Publish an article

1. Open `/admin.html` on your website and log in with your existing admin account.
2. Click **New Article**.
3. Enter the title, category, author and short summary. The URL slug is generated automatically.
4. Choose a **Cover image** from your computer. Images are uploaded to the existing Supabase `article-images` bucket.
5. Write or paste the full article in the editor. Use the formatting toolbar and Image button for images inside the article.
6. Leave **Show on Home** checked (the default for new articles).
7. Click **Preview**, then **Publish Article**. Use **Save Draft** to save without publishing.

Open Home to see the card. Clicking it opens the full article at `article.html?slug=...`. Existing published articles marked for Home remain visible. If there are no matching articles, Home displays **New stories coming soon.**

## Edit articles

Use the dashboard's Edit button, then save a draft or publish. Editing an already published article preserves its original publication date. Uncheck Show on Home to remove it from the homepage without deleting the article.

## Requirements

The existing Supabase `articles` table, admin profile role and `article-images` storage permissions are used. No new table or SQL migration is needed for this change. If image upload fails, check the storage bucket and policies for your admin account. Database and storage policies must authorize the admin; the editor's login check is not a replacement for server-side permissions.

The backend secret stays in GitHub secrets and is never placed in the website. An API authoring integration can be added later by writing drafts to the same articles table; there is no automatic article generation in this version.

