# Peppermoon news inbox and two-stage approval

## Activate AI drafting

1. Create an OpenAI API project with billing and a project API key.
2. In Vercel, select the **peppermoon** project, then **Settings → Environment Variables**.
3. Add `OPENAI_API_KEY` for **Production**, with the API key as its value. Keep it out of source code, screenshots and chat.
4. Optional: set `OPENAI_NEWS_MODEL`. The default is `gpt-6-luna`.
5. Redeploy the current production deployment so the server receives the environment variable.
6. Sign into `/admin.html` using your existing admin account.

No additional Supabase table or service-role key is needed. The APIs verify the signed-in user's `profiles.role` and use that user's existing article permissions. The API key stays server-side. Without the API key, the inbox works but generation is disabled.

## Editorial workflow

- The News inbox reads recent source feeds when Admin opens and refreshes every 15 minutes while it is visible. It is not a permanent archive or a background task that writes articles.
- The initial sources are IGN, GameSpot and Variety. Unavailable or empty feeds show a warning; the other sources continue. Publisher availability can vary. You can adjust `SOURCES` and the source hostname allowlist in `lib/news-utils.mjs` together.
- Read the original article, select **Generate draft**, check the category, optionally add verified source facts, and explicitly approve AI generation.
- Generation fetches readable source text where available. If blocked, it falls back to the source excerpt plus your notes. If there is too little material, it stops before contacting AI and asks for additional facts. It does not bypass paywalls.
- The model creates an original short draft from the supplied material, including a source link. The draft is saved to the existing Articles list with `status=draft`, no image, no homepage visibility, and no publication date.
- Review and edit the result. Add your own cover image. Use the existing **Publish Article** button for your second approval. AI drafts without an uploaded/existing image cannot be published through Admin. Normal manual article creation remains available.
- **Dismiss** hides an inbox item on that browser only. **Restore dismissed** brings those items back. Drafts are stored in Supabase and remain available from Articles even if the source disappears from its feed.

## Costs and limits

Inbox loading, source reading and refreshing never call OpenAI. A generation request makes one AI call only after admin authorization, explicit approval, and a usable source check. Existing articles with the same generated source slug are reopened instead of regenerated. The UI prevents double-clicks; a per-instance lock also rejects overlapping requests for the same source. This is not a global billing cap across server instances.

Generation requests disable reasoning, cap source material at 14,500 characters and total output at 1,800 tokens, and do not use paid web-search tools or image generation. Actual usage is shown after generation. These controls bound individual requests; the earlier $0.24/month figure was an illustrative estimate, not a fixed bill or guaranteed cap. Set appropriate API billing controls and inspect actual usage during a three-story test.

No live AI calls were made during implementation. Authentication, approval gates, source restrictions, draft-only persistence, output escaping, error handling, and image-before-publish behaviour were tested with mocked API responses. Test model access and writing quality after configuring your own key.
