const ARTICLE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COMMENT_ID_PATTERN = /^[0-9a-f-]{36}$/i;
const MAX_NAME_LENGTH = 50;
const MAX_BODY_LENGTH = 2000;
const MAX_LINKS = 3;
const RATE_LIMIT = 6;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const json = (payload, status = 200, headers = {}) => new Response(JSON.stringify(payload), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers
  }
});

const errorResponse = (message, status, headers = {}) => json({ error: message }, status, headers);

const allowedOrigins = (env) => (env.ALLOWED_ORIGINS || 'https://srxnexus.org')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (request, env) => {
  const origin = request.headers.get('Origin');
  return Boolean(origin && allowedOrigins(env).includes(origin));
};

const corsHeaders = (request, env) => {
  const origin = request.headers.get('Origin');
  if (!origin || !allowedOrigins(env).includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
};

const withCors = (response, request, env) => {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(request, env)).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, { status: response.status, headers });
};

const normalizeText = (value) => typeof value === 'string'
  ? value.replace(/\r\n?/g, '\n').trim()
  : '';

const serializeComment = (row) => ({
  id: row.id,
  parentId: row.parent_id || null,
  authorName: row.author_name,
  body: row.body,
  isAuthor: Boolean(row.is_author),
  createdAt: row.created_at
});

const readJson = async (request) => {
  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > 12_000) throw new HttpError('That request is too large.', 413);
  try {
    return await request.json();
  } catch {
    throw new HttpError('Send the comment as valid JSON.', 400);
  }
};

class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const sha256 = async (value) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const fingerprint = async (request, env) => {
  const address = request.headers.get('CF-Connecting-IP') || 'unknown';
  const day = new Date().toISOString().slice(0, 10);
  return sha256(`${env.RATE_LIMIT_SALT}:${day}:${address}`);
};

const checkRateLimit = async (request, env, action) => {
  const identity = await fingerprint(request, env);
  const bucket = String(Math.floor(Date.now() / 600_000));
  const result = await env.DB.prepare(`
    INSERT INTO rate_limits (fingerprint, action, bucket, attempts)
    VALUES (?1, ?2, ?3, 1)
    ON CONFLICT(fingerprint, action, bucket)
    DO UPDATE SET attempts = attempts + 1
    RETURNING attempts
  `).bind(identity, action, bucket).first();
  if (result.attempts > RATE_LIMIT) {
    throw new HttpError('Too many attempts. Give it a few minutes and try again.', 429);
  }
  return identity;
};

const verifyTurnstile = async (request, env, token) => {
  if (!token) throw new HttpError('Complete the anti-spam check first.', 400);
  const form = new FormData();
  form.set('secret', env.TURNSTILE_SECRET);
  form.set('response', token);
  const address = request.headers.get('CF-Connecting-IP');
  if (address) form.set('remoteip', address);
  const response = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body: form });
  const result = await response.json();
  if (!result.success || (result.action && result.action !== 'post_comment')) {
    throw new HttpError('The anti-spam check expired or failed. Please try it again.', 403);
  }
};

const validateComment = (payload) => {
  const articleSlug = normalizeText(payload.articleSlug);
  const parentId = normalizeText(payload.parentId) || null;
  const authorName = normalizeText(payload.authorName);
  const body = normalizeText(payload.body);
  const website = normalizeText(payload.website);

  if (!ARTICLE_PATTERN.test(articleSlug)) throw new HttpError('That article identifier is invalid.');
  if (parentId && !COMMENT_ID_PATTERN.test(parentId)) throw new HttpError('That reply target is invalid.');
  if (!authorName || authorName.length > MAX_NAME_LENGTH) {
    throw new HttpError(`Use a display name between 1 and ${MAX_NAME_LENGTH} characters.`);
  }
  if (/^(skye|skye vernon|author)$/i.test(authorName)) {
    throw new HttpError('That display name is reserved for the author.');
  }
  if (!body || body.length > MAX_BODY_LENGTH) {
    throw new HttpError(`Comments must be between 1 and ${MAX_BODY_LENGTH} characters.`);
  }
  if ((body.match(/https?:\/\//gi) || []).length > MAX_LINKS) {
    throw new HttpError(`Comments can contain at most ${MAX_LINKS} links.`);
  }
  if (website) throw new HttpError('The anti-spam check rejected that submission.', 400);

  return { articleSlug, parentId, authorName, body };
};

const getConfig = (env) => json({
  turnstileSiteKey: env.TURNSTILE_SITE_KEY,
  commentsPublishImmediately: true,
  accountRequired: false
});

const listComments = async (request, env) => {
  const articleSlug = new URL(request.url).searchParams.get('article') || '';
  if (!ARTICLE_PATTERN.test(articleSlug)) throw new HttpError('Choose a valid article.', 400);
  const result = await env.DB.prepare(`
    SELECT id, parent_id, author_name, body, is_author, created_at
    FROM comments AS comment
    WHERE comment.article_slug = ?1
      AND comment.status = 'approved'
      AND (
        comment.parent_id IS NULL
        OR EXISTS (
          SELECT 1 FROM comments AS parent
          WHERE parent.id = comment.parent_id AND parent.status = 'approved'
        )
      )
    ORDER BY comment.created_at ASC
    LIMIT 250
  `).bind(articleSlug).all();
  return json({ comments: (result.results || []).map(serializeComment) });
};

const createComment = async (request, env) => {
  if (!isAllowedOrigin(request, env)) throw new HttpError('This site is not allowed to submit comments.', 403);
  const payload = await readJson(request);
  const comment = validateComment(payload);
  await verifyTurnstile(request, env, normalizeText(payload.turnstileToken));
  await checkRateLimit(request, env, 'comment');

  if (comment.parentId) {
    const parent = await env.DB.prepare(`
      SELECT id FROM comments
      WHERE id = ?1 AND article_slug = ?2 AND status = 'approved'
    `).bind(comment.parentId, comment.articleSlug).first();
    if (!parent) throw new HttpError('That comment is no longer available to reply to.', 404);
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO comments
      (id, article_slug, parent_id, author_name, body, status, is_author, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5, 'approved', 0, ?6)
  `).bind(
    id,
    comment.articleSlug,
    comment.parentId,
    comment.authorName,
    comment.body,
    createdAt
  ).run();

  return json({
    comment: serializeComment({
      id,
      parent_id: comment.parentId,
      author_name: comment.authorName,
      body: comment.body,
      is_author: 0,
      created_at: createdAt
    })
  }, 201);
};

const reportComment = async (request, env) => {
  if (!isAllowedOrigin(request, env)) throw new HttpError('This site is not allowed to submit reports.', 403);
  const payload = await readJson(request);
  const articleSlug = normalizeText(payload.articleSlug);
  const commentId = normalizeText(payload.commentId);
  if (!ARTICLE_PATTERN.test(articleSlug) || !COMMENT_ID_PATTERN.test(commentId)) {
    throw new HttpError('That report is invalid.');
  }
  const identity = await checkRateLimit(request, env, 'report');
  const existing = await env.DB.prepare(`
    SELECT id FROM comments
    WHERE id = ?1 AND article_slug = ?2 AND status = 'approved'
  `).bind(commentId, articleSlug).first();
  if (!existing) throw new HttpError('That comment is no longer available.', 404);

  const result = await env.DB.prepare(`
    INSERT OR IGNORE INTO reports (comment_id, fingerprint, created_at)
    VALUES (?1, ?2, ?3)
  `).bind(commentId, identity, new Date().toISOString()).run();
  if (result.meta?.changes) {
    await env.DB.prepare(`
      UPDATE comments SET report_count = report_count + 1 WHERE id = ?1
    `).bind(commentId).run();
  }
  return json({ reported: true });
};

const timingSafeEqual = async (left, right) => {
  const leftDigest = await sha256(left);
  const rightDigest = await sha256(right);
  let difference = leftDigest.length ^ rightDigest.length;
  for (let index = 0; index < Math.min(leftDigest.length, rightDigest.length); index += 1) {
    difference |= leftDigest.charCodeAt(index) ^ rightDigest.charCodeAt(index);
  }
  return difference === 0;
};

const requireAdmin = async (request, env) => {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !env.ADMIN_TOKEN || !(await timingSafeEqual(token, env.ADMIN_TOKEN))) {
    throw new HttpError('The moderation key is invalid.', 401);
  }
};

const listAdminComments = async (request, env) => {
  await requireAdmin(request, env);
  const params = new URL(request.url).searchParams;
  const status = params.get('status') || 'all';
  if (!['all', 'approved', 'hidden', 'spam', 'reported'].includes(status)) {
    throw new HttpError('That moderation filter is invalid.');
  }
  let where = '';
  if (status === 'reported') where = 'WHERE report_count > 0';
  else if (status !== 'all') where = 'WHERE status = ?1';
  const statement = env.DB.prepare(`
    SELECT id, article_slug, parent_id, author_name, body, status,
           is_author, report_count, created_at
    FROM comments
    ${where}
    ORDER BY created_at DESC
    LIMIT 300
  `);
  const result = status !== 'all' && status !== 'reported'
    ? await statement.bind(status).all()
    : await statement.all();
  return json({ comments: result.results || [] });
};

const moderateComment = async (request, env, commentId) => {
  await requireAdmin(request, env);
  if (!COMMENT_ID_PATTERN.test(commentId)) throw new HttpError('That comment is invalid.');
  const payload = await readJson(request);
  const status = normalizeText(payload.status);
  if (!['approved', 'hidden', 'spam'].includes(status)) {
    throw new HttpError('Choose approved, hidden, or spam.');
  }
  const result = await env.DB.prepare(`
    UPDATE comments SET status = ?1, moderated_at = ?2 WHERE id = ?3
  `).bind(status, new Date().toISOString(), commentId).run();
  if (!result.meta?.changes) throw new HttpError('That comment was not found.', 404);
  return json({ updated: true, status });
};

const createAuthorReply = async (request, env) => {
  await requireAdmin(request, env);
  const payload = await readJson(request);
  const articleSlug = normalizeText(payload.articleSlug);
  const parentId = normalizeText(payload.parentId) || null;
  const body = normalizeText(payload.body);
  if (!ARTICLE_PATTERN.test(articleSlug)) throw new HttpError('That article is invalid.');
  if (parentId && !COMMENT_ID_PATTERN.test(parentId)) throw new HttpError('That reply target is invalid.');
  if (!body || body.length > MAX_BODY_LENGTH) {
    throw new HttpError(`Replies must be between 1 and ${MAX_BODY_LENGTH} characters.`);
  }
  if (parentId) {
    const parent = await env.DB.prepare(`
      SELECT id FROM comments WHERE id = ?1 AND article_slug = ?2
    `).bind(parentId, articleSlug).first();
    if (!parent) throw new HttpError('That comment was not found.', 404);
  }
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO comments
      (id, article_slug, parent_id, author_name, body, status, is_author, created_at)
    VALUES (?1, ?2, ?3, 'Skye Vernon', ?4, 'approved', 1, ?5)
  `).bind(id, articleSlug, parentId, body, createdAt).run();
  return json({ created: true, id }, 201);
};

const moderateHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Life of Skye comment moderation</title>
  <style>
    :root{color-scheme:dark;font:15px/1.5 Inter,system-ui,sans-serif;background:#100c14;color:#f3e9ee}
    *{box-sizing:border-box}body{width:min(100% - 32px,900px);margin:40px auto}
    h1{margin-bottom:4px}.muted{color:#ad9fa7}input,select,textarea,button{font:inherit}
    input,select,textarea{width:100%;padding:10px;border:1px solid #443943;border-radius:8px;background:#1c1620;color:#f3e9ee}
    textarea{min-height:90px;resize:vertical}button{padding:8px 12px;border:0;border-radius:999px;background:#e592b8;color:#21131a;font-weight:700;cursor:pointer}
    .bar{display:grid;grid-template-columns:1fr auto;gap:10px;margin:24px 0}.card{margin:12px 0;padding:18px;border:1px solid #443943;border-radius:12px;background:#1c1620}
    .meta,.actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.meta{color:#ad9fa7;font-size:12px}.body{white-space:pre-wrap}.actions button{background:#332833;color:#f3e9ee}
    .reply{display:grid;grid-template-columns:1fr auto;gap:10px;margin-top:12px}.reports{color:#d8b06b;font-weight:700}
    @media(max-width:600px){.bar,.reply{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <h1>Comment moderation</h1>
  <p class="muted">The key stays in this browser on this device.</p>
  <form id="login" class="bar"><input id="key" type="password" placeholder="Moderation key" autocomplete="current-password" required><button>Unlock</button></form>
  <section id="panel" hidden>
    <div class="bar"><select id="filter"><option value="all">All comments</option><option value="reported">Reported</option><option value="approved">Approved</option><option value="hidden">Hidden</option><option value="spam">Spam</option></select><button id="refresh" type="button">Refresh</button></div>
    <p id="status" class="muted"></p><div id="comments"></div>
  </section>
  <script src="/moderate.js" defer></script>
</body>
</html>`;

const moderateJs = `(() => {
  const login = document.querySelector('#login');
  const panel = document.querySelector('#panel');
  const list = document.querySelector('#comments');
  const status = document.querySelector('#status');
  const keyInput = document.querySelector('#key');
  const filter = document.querySelector('#filter');
  let token = localStorage.getItem('life-of-skye-moderation-key') || '';

  const request = async (path, options = {}) => {
    const response = await fetch(path, {
      ...options,
      headers: {
        Authorization: 'Bearer ' + token,
        ...(options.body ? {'Content-Type': 'application/json'} : {})
      }
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Request failed.');
    return payload;
  };

  const addText = (parent, tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    parent.append(node);
  };

  const load = async () => {
    status.textContent = 'Loading...';
    list.replaceChildren();
    try {
      const payload = await request('/admin/comments?status=' + encodeURIComponent(filter.value));
      status.textContent = payload.comments.length + ' comment' + (payload.comments.length === 1 ? '' : 's');
      payload.comments.forEach((comment) => {
        const card = document.createElement('article');
        card.className = 'card';
        const meta = document.createElement('div');
        meta.className = 'meta';
        addText(meta, 'strong', '', comment.author_name + (comment.is_author ? ' (Author)' : ''));
        addText(meta, 'span', '', comment.article_slug);
        addText(meta, 'span', '', comment.status);
        if (comment.report_count) addText(meta, 'span', 'reports', comment.report_count + ' report(s)');
        addText(meta, 'time', '', new Date(comment.created_at).toLocaleString());
        const body = document.createElement('p');
        body.className = 'body';
        body.textContent = comment.body;
        const actions = document.createElement('div');
        actions.className = 'actions';
        ['approved', 'hidden', 'spam'].forEach((nextStatus) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = nextStatus === 'approved' ? 'Approve/restore' : nextStatus === 'hidden' ? 'Hide' : 'Mark spam';
          button.addEventListener('click', async () => {
            await request('/admin/comments/' + comment.id, {method:'POST', body:JSON.stringify({status:nextStatus})});
            await load();
          });
          actions.append(button);
        });
        const reply = document.createElement('form');
        reply.className = 'reply';
        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Reply as Skye Vernon';
        textarea.required = true;
        const submit = document.createElement('button');
        submit.textContent = 'Reply as author';
        reply.append(textarea, submit);
        reply.addEventListener('submit', async (event) => {
          event.preventDefault();
          await request('/admin/replies', {method:'POST', body:JSON.stringify({articleSlug:comment.article_slug,parentId:comment.parent_id || comment.id,body:textarea.value})});
          textarea.value = '';
          status.textContent = 'Author reply published.';
        });
        card.append(meta, body, actions, reply);
        list.append(card);
      });
    } catch (error) {
      status.textContent = error.message;
      if (/key/i.test(error.message)) {
        token = '';
        localStorage.removeItem('life-of-skye-moderation-key');
        panel.hidden = true;
        login.hidden = false;
      }
    }
  };

  login.addEventListener('submit', async (event) => {
    event.preventDefault();
    token = keyInput.value;
    localStorage.setItem('life-of-skye-moderation-key', token);
    login.hidden = true;
    panel.hidden = false;
    await load();
  });
  filter.addEventListener('change', load);
  document.querySelector('#refresh').addEventListener('click', load);
  if (token) {
    login.hidden = true;
    panel.hidden = false;
    load();
  }
})();`;

const staticResponse = (body, contentType) => new Response(body, {
  headers: {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  }
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      if (!isAllowedOrigin(request, env)) return errorResponse('Origin not allowed.', 403);
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    try {
      let response;
      if (request.method === 'GET' && url.pathname === '/health') {
        response = json({ ok: true, service: 'life-of-skye-comments' });
      } else if (request.method === 'GET' && url.pathname === '/config') {
        response = getConfig(env);
      } else if (request.method === 'GET' && url.pathname === '/comments') {
        response = await listComments(request, env);
      } else if (request.method === 'POST' && url.pathname === '/comments') {
        response = await createComment(request, env);
      } else if (request.method === 'POST' && url.pathname === '/reports') {
        response = await reportComment(request, env);
      } else if (request.method === 'GET' && url.pathname === '/moderate') {
        return staticResponse(moderateHtml, 'text/html; charset=utf-8');
      } else if (request.method === 'GET' && url.pathname === '/moderate.js') {
        return staticResponse(moderateJs, 'text/javascript; charset=utf-8');
      } else if (request.method === 'GET' && url.pathname === '/admin/comments') {
        response = await listAdminComments(request, env);
      } else if (request.method === 'POST' && /^\/admin\/comments\/[0-9a-f-]{36}$/i.test(url.pathname)) {
        response = await moderateComment(request, env, url.pathname.split('/').pop());
      } else if (request.method === 'POST' && url.pathname === '/admin/replies') {
        response = await createAuthorReply(request, env);
      } else {
        response = errorResponse('Not found.', 404);
      }
      return withCors(response, request, env);
    } catch (error) {
      if (error instanceof HttpError) {
        return withCors(errorResponse(error.message, error.status), request, env);
      }
      console.error(error);
      return withCors(errorResponse('The comment service hit an unexpected error.', 500), request, env);
    }
  }
};

export {
  ARTICLE_PATTERN,
  COMMENT_ID_PATTERN,
  normalizeText,
  serializeComment,
  validateComment
};
