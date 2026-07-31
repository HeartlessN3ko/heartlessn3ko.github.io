(() => {
  const API_BASE = 'https://comments.srxnexus.org';
  const roots = document.querySelectorAll('[data-comments-root]');
  if (!roots.length) return;

  const api = async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'The comment service could not complete that request.');
    }
    return payload;
  };

  const loadTurnstile = () => new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }
    const existing = document.querySelector('script[data-turnstile-script]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.turnstile), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = '';
    script.addEventListener('load', () => resolve(window.turnstile), { once: true });
    script.addEventListener('error', () => reject(new Error('The anti-spam check could not load.')), { once: true });
    document.head.append(script);
  });

  const formatDate = (value) => new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));

  const createComment = (comment, repliesByParent, root, articleSlug, state) => {
    const item = document.createElement('li');
    item.className = `comment-item${comment.isAuthor ? ' is-author' : ''}`;
    item.dataset.commentId = comment.id;

    const meta = document.createElement('div');
    meta.className = 'comment-meta';
    const author = document.createElement('span');
    author.className = 'comment-author';
    author.textContent = comment.authorName;
    meta.append(author);

    if (comment.isAuthor) {
      const badge = document.createElement('span');
      badge.className = 'comment-author-badge';
      badge.textContent = 'Author';
      meta.append(badge);
    }

    const date = document.createElement('time');
    date.className = 'comment-date';
    date.dateTime = comment.createdAt;
    date.textContent = formatDate(comment.createdAt);
    meta.append(date);

    const body = document.createElement('p');
    body.className = 'comment-body';
    body.textContent = comment.body;

    const actions = document.createElement('div');
    actions.className = 'comment-actions';
    const reply = document.createElement('button');
    reply.type = 'button';
    reply.textContent = 'Reply';
    reply.addEventListener('click', () => {
      state.parentId = comment.parentId || comment.id;
      state.parentName = comment.authorName;
      renderReplyContext(root, state);
      root.querySelector('#comment-body').focus();
      root.querySelector('.comment-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    actions.append(reply);

    const report = document.createElement('button');
    report.type = 'button';
    report.textContent = 'Report';
    report.addEventListener('click', async () => {
      if (!window.confirm('Report this comment for moderation?')) return;
      report.disabled = true;
      try {
        await api('/reports', {
          method: 'POST',
          body: JSON.stringify({ articleSlug, commentId: comment.id })
        });
        report.textContent = 'Reported';
      } catch (error) {
        report.disabled = false;
        window.alert(error.message);
      }
    });
    actions.append(report);
    item.append(meta, body, actions);

    const replies = repliesByParent.get(comment.id) || [];
    if (replies.length) {
      const list = document.createElement('ol');
      list.className = 'comment-replies';
      replies.forEach((child) => list.append(
        createComment(child, repliesByParent, root, articleSlug, state)
      ));
      item.append(list);
    }
    return item;
  };

  const renderComments = (root, articleSlug, state) => {
    const container = root.querySelector('[data-comment-list]');
    const count = root.querySelector('[data-comment-count]');
    const total = state.comments.length;
    count.textContent = `${total} comment${total === 1 ? '' : 's'}`;
    container.replaceChildren();

    if (!total) {
      const empty = document.createElement('p');
      empty.className = 'comments-empty';
      empty.textContent = 'No comments yet. You can be the first person to push the conversation forward.';
      container.append(empty);
      return;
    }

    const repliesByParent = new Map();
    state.comments.forEach((comment) => {
      if (!comment.parentId) return;
      const replies = repliesByParent.get(comment.parentId) || [];
      replies.push(comment);
      repliesByParent.set(comment.parentId, replies);
    });

    const list = document.createElement('ol');
    list.className = 'comment-list';
    state.comments
      .filter((comment) => !comment.parentId)
      .forEach((comment) => list.append(
        createComment(comment, repliesByParent, root, articleSlug, state)
      ));
    container.append(list);
  };

  const renderReplyContext = (root, state) => {
    const context = root.querySelector('[data-reply-context]');
    if (!state.parentId) {
      context.hidden = true;
      context.replaceChildren();
      return;
    }
    const text = document.createElement('span');
    text.textContent = `Replying to ${state.parentName}`;
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Cancel reply';
    cancel.addEventListener('click', () => {
      state.parentId = null;
      state.parentName = '';
      renderReplyContext(root, state);
    });
    context.replaceChildren(text, cancel);
    context.hidden = false;
  };

  const mountForm = async (root, articleSlug, state) => {
    const app = root.querySelector('[data-comments-app]');
    app.innerHTML = [
      '<form class="comment-form" data-comment-form>',
      '  <div class="comment-reply-context" data-reply-context hidden></div>',
      '  <label>Display name<input id="comment-name" name="authorName" maxlength="50" autocomplete="nickname" required></label>',
      '  <label>Your comment<textarea id="comment-body" name="body" maxlength="2000" required></textarea></label>',
      '  <label class="comment-honeypot" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>',
      '  <div class="comment-form-row">',
      '    <div><div data-turnstile></div><p class="comment-form-meta">No account or email required. Comments publish immediately and may be moderated.</p><details class="comment-privacy"><summary>Privacy and anti-spam</summary><p>Comments are public. The site stores your display name and comment, plus a daily one-way network fingerprint for rate limiting and report deduplication. It does not store your raw IP address.</p></details></div>',
      '    <button class="comment-submit" type="submit">Post comment</button>',
      '  </div>',
      '  <p class="comment-form-status" data-form-status role="status" aria-live="polite"></p>',
      '</form>',
      '<div data-comment-list></div>'
    ].join('');
    app.hidden = false;

    const form = app.querySelector('[data-comment-form]');
    const status = app.querySelector('[data-form-status]');
    const submit = form.querySelector('.comment-submit');
    let widgetId = null;

    try {
      const turnstile = await loadTurnstile();
      widgetId = turnstile.render(form.querySelector('[data-turnstile]'), {
        sitekey: state.config.turnstileSiteKey,
        theme: document.documentElement.dataset.theme === 'day' ? 'light' : 'dark',
        action: 'post_comment'
      });
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = error.message;
      submit.disabled = true;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      status.textContent = '';
      status.dataset.state = '';
      submit.disabled = true;
      submit.textContent = 'Posting...';

      const data = new FormData(form);
      const turnstileToken = widgetId === null ? '' : window.turnstile.getResponse(widgetId);
      if (!turnstileToken) {
        status.dataset.state = 'error';
        status.textContent = 'Please complete the anti-spam check.';
        submit.disabled = false;
        submit.textContent = 'Post comment';
        return;
      }

      try {
        const payload = await api('/comments', {
          method: 'POST',
          body: JSON.stringify({
            articleSlug,
            parentId: state.parentId,
            authorName: data.get('authorName'),
            body: data.get('body'),
            website: data.get('website'),
            turnstileToken
          })
        });
        state.comments.push(payload.comment);
        form.querySelector('[name="body"]').value = '';
        state.parentId = null;
        state.parentName = '';
        renderReplyContext(root, state);
        renderComments(root, articleSlug, state);
        status.dataset.state = 'success';
        status.textContent = 'Your comment is live.';
        window.turnstile.reset(widgetId);
      } catch (error) {
        status.dataset.state = 'error';
        status.textContent = error.message;
        if (widgetId !== null) window.turnstile.reset(widgetId);
      } finally {
        submit.disabled = false;
        submit.textContent = 'Post comment';
      }
    });
  };

  const init = async (root) => {
    const articleSlug = root.dataset.articleSlug;
    const loading = root.querySelector('[data-comments-loading]');
    const app = root.querySelector('[data-comments-app]');
    const state = { config: null, comments: [], parentId: null, parentName: '' };
    try {
      const [config, comments] = await Promise.all([
        api('/config'),
        api(`/comments?article=${encodeURIComponent(articleSlug)}`)
      ]);
      state.config = config;
      state.comments = comments.comments;
      loading.remove();
      await mountForm(root, articleSlug, state);
      renderComments(root, articleSlug, state);
    } catch (error) {
      loading.className = 'comments-error';
      loading.textContent = `${error.message} Please try again later.`;
      app.hidden = true;
      const count = root.querySelector('[data-comment-count]');
      if (count) count.textContent = 'Unavailable';
    }
  };

  roots.forEach(init);
})();
