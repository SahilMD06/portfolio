import assert from 'node:assert/strict';
import test from 'node:test';

import { hashPassword, verifyPassword } from '../lib/auth/password';
import { MAX_IMAGE_BYTES, UploadError, validateUpload } from '../lib/storage/policy';
import {
  contactMessageSchema,
  projectSchema,
  slugSchema,
  stringListSchema,
} from '../lib/validation/schemas';

test('password hashing round-trips and rejects wrong passwords', async () => {
  const digest = await hashPassword('correct horse battery staple');
  assert.match(digest, /^scrypt\$16384\$8\$1\$/);
  assert.ok(!digest.includes('correct horse'), 'digest must not contain the password');
  assert.equal(await verifyPassword('correct horse battery staple', digest), true);
  assert.equal(await verifyPassword('Correct horse battery staple', digest), false);
  assert.equal(await verifyPassword('', digest), false);
});

test('each hash uses a fresh salt', async () => {
  const [a, b] = await Promise.all([hashPassword('same-password'), hashPassword('same-password')]);
  assert.notEqual(a, b, 'identical passwords must not produce identical digests');
});

test('verifyPassword rejects malformed digests instead of throwing', async () => {
  for (const bad of ['', 'not-a-digest', 'scrypt$1$2$3', 'bcrypt$16384$8$1$aaaa$bbbb', 'scrypt$16384$8$1$$']) {
    assert.equal(await verifyPassword('x', bad), false, `should reject: ${bad}`);
  }
});

test('upload policy rejects dangerous types and oversized files', () => {
  assert.throws(() => validateUpload({ type: 'text/html', size: 10 }), UploadError);
  assert.throws(() => validateUpload({ type: 'application/x-msdownload', size: 10 }), UploadError);
  // SVG can carry inline script and is served from our own origin.
  assert.throws(() => validateUpload({ type: 'image/svg+xml', size: 10 }), UploadError);
  assert.throws(() => validateUpload({ type: '', size: 10 }), UploadError);
  assert.throws(() => validateUpload({ type: 'image/png', size: 0 }), UploadError);
  assert.throws(() => validateUpload({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 }), UploadError);
});

test('upload keys ignore the client filename and stay inside the year folder', () => {
  const { key } = validateUpload({ type: 'image/png', size: 1024 });
  assert.match(key, /^\d{4}\/[0-9a-f-]{36}\.png$/);
  assert.ok(!key.includes('..'));
});

test('slug validation blocks path and script characters', () => {
  assert.equal(slugSchema.safeParse('my-project-1').success, true);
  for (const bad of ['../etc', 'My Project', 'a--b', '-lead', 'trail-', 'a/b', '<script>']) {
    assert.equal(slugSchema.safeParse(bad).success, false, `should reject: ${bad}`);
  }
});

test('technology lists accept comma or newline input and drop blanks', () => {
  assert.deepEqual(stringListSchema.parse('React, Next.js , , TypeScript'), [
    'React',
    'Next.js',
    'TypeScript',
  ]);
  assert.deepEqual(stringListSchema.parse('A\nB\n'), ['A', 'B']);
  assert.deepEqual(stringListSchema.parse(''), []);
  assert.deepEqual(stringListSchema.parse(undefined), []);
});

test('project schema requires a title and a valid slug, and normalises checkboxes', () => {
  const bad = projectSchema.safeParse({ title: '   ', slug: 'Bad Slug' });
  assert.equal(bad.success, false);

  const ok = projectSchema.safeParse({
    title: 'Task API',
    slug: 'task-api',
    technologies: 'Node.js, PostgreSQL',
    featured: 'on',
    published: undefined,
    githubUrl: '',
    displayOrder: '',
  });
  assert.equal(ok.success, true);
  assert.equal(ok.data?.featured, true);
  assert.equal(ok.data?.published, false);
  assert.equal(ok.data?.githubUrl, undefined, 'empty URL should clear, not fail');
  assert.equal(ok.data?.displayOrder, 0);
  assert.deepEqual(ok.data?.technologies, ['Node.js', 'PostgreSQL']);
});

test('project schema rejects a non-URL github link', () => {
  const result = projectSchema.safeParse({
    title: 'X',
    slug: 'x',
    githubUrl: 'javascript:alert(1)',
  });
  assert.equal(result.success, false);
});

test('contact form honeypot rejects bot submissions', () => {
  const human = contactMessageSchema.safeParse({
    name: 'Neel',
    email: 'neel@example.com',
    message: 'Hello, I would like to get in touch about a role.',
    website: '',
  });
  assert.equal(human.success, true);

  const bot = contactMessageSchema.safeParse({
    name: 'Bot',
    email: 'bot@example.com',
    message: 'Buy cheap things at example.com right now',
    website: 'http://spam.example',
  });
  assert.equal(bot.success, false);
});

test('contact form validates email and minimum message length', () => {
  assert.equal(
    contactMessageSchema.safeParse({ name: 'A B', email: 'nope', message: 'long enough message' })
      .success,
    false,
  );
  assert.equal(
    contactMessageSchema.safeParse({ name: 'A B', email: 'a@b.co', message: 'short' }).success,
    false,
  );
});
