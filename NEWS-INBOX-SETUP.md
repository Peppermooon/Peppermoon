# Peppermoon news inbox and two-stage approval

## Activate AI drafting

1. Create an OpenAI API project with billing and a project API key.
2. In Vercel, select the **peppermoon** project, then **Settings → Environment Variables**.
3. Add `OPENAI_API_KEY` for **Production**, with the API key as its value. Keep it out of source code, screenshots and chat.
4. No limits SQL setup is required. Draft generation uses `gpt-6-luna` at standard service tier.
5. Redeploy the current production deployment so the server receives the environment variable.
6. Sign into `/admin.html` using your existing admin account.

No additional database setup or service-role key is needed. Any previously created news-limit counters are unused and may be left in place. The APIs verify the signed-in user's `profiles.role` and use that user's existing article permissions. The API key stays server-side. Without the API key, the inbox works but generation is disabled.

## Editorial workflow

- The News inbox reads recent source feeds when Admin opens and refreshes every 15 minutes while it is visible. It is not a permanent archive or a background task that writes articles.
- The initial sources are IGN, GameSpot and Variety. Unavailable or empty feeds show a warning; the other sources continue. Publisher availability can vary. You can adjust `SOURCES` and the source hostname allowlist in `lib/news-utils.mjs` together.
- Read the original article, select **Generate draft**, check the category, optionally add verified source facts, and explicitly approve AI generation.
- Generation fetches readable source text where available. If blocked, it falls back to the source excerpt plus your notes. If there is too little material, it stops before contacting AI and asks for additional facts. It does not bypass paywalls.
- The model creates an original short draft from the supplied material, including a source link. The draft is saved to the existing Articles list with `status=draft`, no image, no homepage visibility, and no publication date.
- Review and edit the result. Add your own cover image. Use the existing **Publish Article** button for your second approval. AI drafts without an uploaded/existing image cannot be published through Admin. Normal manual article creation remains available.
- **Dismiss** hides an inbox item on that browser only. **Restore dismissed** brings those items back. Drafts are stored in Supabase and remain available from Articles even if the source disappears from its feed.

## Costs and usage

There are no Peppermoon daily or monthly generation quotas. Loading and refreshing the inbox never call OpenAI. Only an explicitly approved, authenticated admin generation makes a paid request. Existing drafts are reused, overlapping requests in the same server instance are rejected, and automatic retries are disabled.

After generation, the Admin editor message shows the actual input/output token counts returned by OpenAI and an **estimated USD cost**. Standard gpt-6-luna rates checked on 2026-10-16 are $0.10/million uncached input, $0.01/million cached input and $0.50/million output tokens. The estimate includes cached-token discounts, excludes taxes/card fees/other API use, and must be updated when rates change. It is not the invoice. OpenAI Usage is authoritative. The estimate is shown for the current generation, not stored as a permanent article billing record. If the provider supplies usage but saving fails, the error also includes its estimated cost. A timeout without usage cannot report a cost reliably.

Source material remains capped at 14,500 characters, output at 1,800 tokens, with no paid search or image generation. These keep individual articles short; there is no daily/monthly allowance. `NEWS_AI_DISABLED=true` can still pause generation after redeployment. Keep automatic recharge off if you only want manual credit purchases.

No paid AI calls were made during implementation. Tests use mocked responses to check authorization, approval, private drafts, cost calculation and generation without quota database access. Test actual model access and writing quality with one story after adding your API key and credits.
