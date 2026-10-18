# Peppermoon Guides Admin

Open `/admin.html` → **Manage Guides**, or `/admin-guides.html` directly. Use the existing Peppermoon admin account.

## One-time activation

1. In Manage Guides choose **Copy setup SQL**.
2. In the same Supabase project, open **SQL Editor → New query**, paste the SQL and choose **Run**.
3. Return to Manage Guides and choose **I ran it — recheck**.

The SQL creates `pepper_guides` with row-level security and imports the existing 17 guides as published. Running the setup again preserves existing guides and edits. Only profiles with `role = 'admin'` may insert or update; public visitors can read published guides only. No service key or new environment variable is required.

## Editing

- Choose **Edit** on a guide, or **New franchise** to add one.
- Set the franchise name, guide title, card summary, collection and card position.
- Upload a card image or paste an HTTPS image URL. Uploads use the existing `article-images` bucket and its admin permissions; JPEG, PNG and WebP are accepted, up to 10 MB, and are resized before upload.
- Use the Release order and Story order editor tabs. Each order can contain separate sections for different continuities. Each entry has a position, title, release year, Movie/TV series/Game type and notes. Separate entries may use the same position to show overlapping stories. Add remake details to notes.
- Save a draft to keep it private or unpublish a guide; choose **Publish guide** to show it publicly. Existing URL names stay fixed when a guide is edited.

New published franchises appear automatically in `/guides` and in the sitemap, with individual `/guides/<url-name>` pages. Their images and metadata are rendered on the server for article link previews. Movies/TV filters and release/story selectors continue to work.

Until the table is set up, the public site uses its existing guide data and Admin shows the setup notice. Once the table exists, the database is authoritative: drafts and unpublished guides never fall back to the old static copy. Older HTML guide links redirect to their current clean URL.

## Verification

Run `node --test tests/guides.mjs`. Database policies and image permissions require the one-time Supabase setup and a real admin session to verify live.
