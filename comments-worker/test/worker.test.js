import test from 'node:test';
import assert from 'node:assert/strict';
import worker, {
  ARTICLE_PATTERN,
  normalizeText,
  serializeComment,
  validateComment
} from '../src/index.js';

test('article slugs are deliberately narrow', () => {
  assert.equal(ARTICLE_PATTERN.test('downtown-portland-has-a-journey-problem'), true);
  assert.equal(ARTICLE_PATTERN.test('../admin'), false);
  assert.equal(ARTICLE_PATTERN.test('UPPERCASE'), false);
});

test('text normalization trims and normalizes new lines', () => {
  assert.equal(normalizeText('  hello\r\nworld  '), 'hello\nworld');
  assert.equal(normalizeText(null), '');
});

test('comment validation preserves forceful language without filtering it', () => {
  const result = validateComment({
    articleSlug: 'a-real-argument',
    authorName: 'A reader',
    body: 'I think this argument is bullshit, and here is why.',
    website: ''
  });
  assert.equal(result.body, 'I think this argument is bullshit, and here is why.');
});

test('comment validation blocks reserved author identities and link spam', () => {
  assert.throws(() => validateComment({
    articleSlug: 'a-real-argument',
    authorName: 'Skye Vernon',
    body: 'Pretending to be the author.',
    website: ''
  }), /reserved/);
  assert.throws(() => validateComment({
    articleSlug: 'a-real-argument',
    authorName: 'Spammer',
    body: 'https://a.test https://b.test https://c.test https://d.test',
    website: ''
  }), /at most 3 links/);
});

test('database rows serialize without leaking moderation fields', () => {
  assert.deepEqual(serializeComment({
    id: '123',
    parent_id: null,
    author_name: 'Reader',
    body: 'A thought',
    is_author: 0,
    created_at: '2026-07-30T00:00:00.000Z',
    report_count: 9,
    status: 'approved'
  }), {
    id: '123',
    parentId: null,
    authorName: 'Reader',
    body: 'A thought',
    isAuthor: false,
    createdAt: '2026-07-30T00:00:00.000Z'
  });
});

test('health endpoint is public and does not expose configuration', async () => {
  const response = await worker.fetch(new Request('https://comments.example/health'), {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    service: 'life-of-skye-comments'
  });
});

test('cross-origin writes are rejected before database access', async () => {
  const request = new Request('https://comments.example/comments', {
    method: 'POST',
    headers: {
      Origin: 'https://attacker.example',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  const response = await worker.fetch(request, {
    ALLOWED_ORIGINS: 'https://srxnexus.org'
  });
  assert.equal(response.status, 403);
  assert.match((await response.json()).error, /not allowed/);
});
