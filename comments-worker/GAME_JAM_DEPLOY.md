# AI Team Game Jam deployment

The splash page lives at `realm/game-jam/`, served publicly as `/game-jam/`.
The existing homepage gains one section linking to it; all previous content remains.

Deploy the signup backend before publishing the frontend:

1. In this directory, run `npm ci` with the existing lockfile.
2. Authenticate Wrangler to the existing Cloudflare account.
3. Run `npx wrangler d1 execute life-of-skye-comments --remote --file=game-jam-schema.sql`.
4. Run `npm run check`, then `npm run deploy`.
5. Verify `https://comments.srxnexus.org/game-jam/config` returns `ready: true`.
6. Publish the website commit using the existing Railway deployment, then check `/game-jam/` on mobile and desktop and submit an authorized test signup.

Existing `TURNSTILE_SECRET`, `TURNSTILE_SITE_KEY`, `RATE_LIMIT_SALT`, and `ADMIN_TOKEN` are reused. No credential belongs in the static page or repository. Existing comments and moderation endpoints retain their behavior.

Notification records are in the separate D1 `game_jam_signups` table. The existing admin bearer token authorizes `GET /admin/game-jam/signups`, returning private JSON for the organizer. No public endpoint lists subscribers. Duplicate normalized addresses return the same success response without overwriting prior details.

This feature collects consent for an opening notification. It does not send email or schedule a campaign. An organizer sends the opening announcement when dates and applications are ready.
