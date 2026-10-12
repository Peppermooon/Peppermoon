# Pepper Ratings

## Activate once

1. Open the Peppermoon Supabase project → SQL Editor → New query.
2. Copy the entire `SUPABASE-RATINGS-SETUP.sql` file into the editor and click Run.
3. Open `/admin.html` and choose **Manage Pepper Ratings**, or open `/admin-ratings.html` directly.

The same admin account and `profiles.role = admin` permission are used. No new keys or Vercel environment variables are required. Ratings use the existing `article-images` upload bucket.

## Publish a review

Choose **New rating**, enter the title and category, give a Pepper Score from 0 to 10, add your review and a cover, then choose **Publish Rating**. **Save Draft / Unpublish** keeps the review private. New reviews are not mixed into Home articles.

## Curate Top 10

Assign a position from 1–10 in the editor. Each category has its own all-time list. A published position can contain only one review. To move a different review into an occupied position, first clear that position on the current review and save it, then assign the new review. Leaving the position empty keeps the review in the ratings catalogue without listing it in the Top 10.

Scores and Top 10 order are editorial opinions, not public votes. No sample scores are published. Community voting is reserved for a later version.

## Access and links

- Public catalogue: `/ratings.html`
- Review: `/rating.html?slug=...`
- Admin editor: `/admin-ratings.html`
- Drafts are protected by Supabase row-level security, not just hidden by the interface.
- Review links have server-generated sharing metadata on Vercel. GitHub Pages can serve the UI but cannot run the preview function.
