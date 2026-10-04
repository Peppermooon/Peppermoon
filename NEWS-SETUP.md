# Peppermoon automatic news setup

This package changes the desktop and mobile navigation to Home, Community and About. The homepage displays automatically imported stories with source attribution, short RSS excerpts and links to the original publisher. Existing category/article URLs and the community remain available. Imported news is separate from your existing `articles` table and editor; existing editorial articles are no longer loaded into the homepage.

## 1. Create the news table

Open your existing Supabase project (the one already used by Peppermoon). Go to **SQL Editor → New query**, paste the entire contents of `SUPABASE-NEWS-SETUP.sql`, and click **Run**. This creates `news_items` and permits visitors to read published stories, while only the backend collector can insert them.

## 2. Upload the website files

Extract this ZIP. Upload the contents of `Peppermoon-main` into the root of your existing GitHub repository, replacing the matching files. Do not upload the ZIP itself or place the files inside an extra nested folder.

Include `assets/news-feed.js`, `news-sources.json`, `scripts/collect_news.py`, and `.github/workflows/collect-news.yml`. The `.github` folder may be hidden by your file manager. If it is omitted by the browser upload, use GitHub **Add file → Create new file**, enter `.github/workflows/collect-news.yml` as the filename, and paste the included workflow.

Keep your existing GitHub Pages deployment settings. Commit the workflow to the repository's default branch; scheduled workflows run from that branch.

## 3. Add two GitHub Actions secrets

In GitHub, open **Settings → Secrets and variables → Actions → New repository secret**.

| Secret name | Value |
| --- | --- |
| `SUPABASE_URL` | Your project URL. For the project already configured in this site: `https://bgzlqvbvmstebdsnzmqv.supabase.co` |
| `SUPABASE_SECRET_KEY` | A backend secret key from your Supabase project's API Keys settings. A legacy service-role key is also supported. |

Do not use the browser's publishable/anon key for the collector. Do not paste the secret key into HTML, commit it to GitHub, or send it in chat. The homepage continues to use your existing public key. If using a different Supabase project, update the public URL and publishable key in `assets/news-feed.js` as well.

## 4. Run the first import

Open your repository's **Actions** tab. Enable Actions if GitHub asks. Select **Collect entertainment news → Run workflow → Run workflow**. After it succeeds, open Supabase **Table Editor → news_items** to see the imported rows. Open the homepage and refresh with Ctrl+F5.

The first import brings in up to 60 current entries per enabled source. Future runs insert unseen article URLs, ignoring previously imported entries. The workflow runs at minutes 17 and 47 of each hour (UTC). GitHub may delay scheduled jobs; public repositories can have schedules disabled after 60 days without repository activity. Re-enable the workflow from Actions if needed. The homepage fetches stories when opened; reload to see newer imports.

## Sources and content

`news-sources.json` includes GamesRadar+, GameSpot and Variety, which returned valid RSS during preparation. IGN is included but disabled because it returned an unavailable page in this environment. Feed availability can change; check a successful dry run before enabling or changing one.

Each source has `name`, `feed_url`, `enabled`, `article_hosts`, `category`, and `summary_chars`. Set `enabled` to false to stop future imports. Set `category` to `Gaming`, `Movies`, or `TV Series` for a dedicated feed, or `auto` to infer it from feed categories and headline keywords. Ambiguous entries use `Entertainment`; mixed feeds can include other entertainment coverage. You can correct categories in Supabase.

RSS excerpts are capped at 180 characters, converted to plain text, and attributed. No article pages are scraped, no full articles are copied, and publisher images are not downloaded. Check publisher feed/reuse terms for your intended use; feed availability alone does not grant republication rights. Use `summary_chars: 0` for title-and-link-only entries (new imports). Category artwork is provided by the site's own styling.

Publication is automatic. To hide a story, edit its `status` to `hidden` in Supabase Table Editor. Future imports preserve that choice. Deleting a row may cause it to be imported again while it remains in its source feed.

## Troubleshooting

- **Stories could not be loaded:** Run the SQL, check the project URL/public key, and check that the script was uploaded under `assets/`. Errors have a retry button.
- **No stories yet:** Run the workflow manually and inspect its log and `news_items` table.
- **Workflow fails with HTTP 401/403:** Check both Actions secrets; the collector needs the backend secret key.
- **Workflow fails with HTTP 404:** Confirm the table was created in the same Supabase project.
- **One source fails:** Other successful sources are still imported; the run is marked failed so the broken source is visible. Disable or repair that source in `news-sources.json`.
- **Old tabs still visible:** Upload all updated HTML files, wait for Pages deployment, then hard-refresh.

## Local verification

No Python dependencies are required (Python 3.12 recommended):

```sh
python scripts/collect_news.py --dry-run
python -m unittest discover -s scripts -p 'test_*.py'
```

A dry run validates live feeds without writing to Supabase. Database insertion and your deployment can only be verified after you complete the setup above.

Reference documentation:
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
- https://supabase.com/docs/guides/api/api-keys
- https://supabase.com/docs/guides/database/postgres/row-level-security
