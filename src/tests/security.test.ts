import assert from 'node:assert/strict';
import test from 'node:test';

import { hashPassword, verifyPassword } from '../lib/auth/password';
import { MAX_IMAGE_BYTES, UploadError, validateUpload } from '../lib/storage/policy';
import {
  bulletListSchema,
  contactMessageSchema,
  experienceSchema,
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

test('bullet lists keep commas inside sentences and split only on newlines', () => {
  const input =
    'Built a RAG pipeline using FAISS, Sentence Transformers and FastAPI, deployed on Docker.\n' +
    '• Performed EDA, feature engineering, and model training.\n\n';
  assert.deepEqual(bulletListSchema.parse(input), [
    'Built a RAG pipeline using FAISS, Sentence Transformers and FastAPI, deployed on Docker.',
    'Performed EDA, feature engineering, and model training.',
  ]);
});

test('experience form round-trips a long resume bullet without truncation or splitting', () => {
  const bullet =
    'Developed and deployed AI/ML solutions including an LLM-based conversational assistant and predictive models, taking them from prototype to working web applications.';
  const parsed = experienceSchema.parse({
    company: 'Labmentix',
    role: 'AI/ML Intern',
    startDate: '2026-06',
    // The admin form joins responsibilities with newlines and technologies with commas.
    responsibilities: [bullet, 'Second bullet, with a comma.'].join('\n'),
    technologies: 'Python, FastAPI',
  });
  assert.deepEqual(parsed.responsibilities, [bullet, 'Second bullet, with a comma.']);
  assert.deepEqual(parsed.technologies, ['Python', 'FastAPI']);
});

test('mailto links become a Gmail compose URL with the recipient in To', async () => {
  const { gmailComposeUrl } = await import('../lib/utils');
  const url = new URL(gmailComposeUrl('mailto:sahilmohammed062004@gmail.com'));
  assert.equal(url.origin + url.pathname, 'https://mail.google.com/mail/');
  assert.equal(url.searchParams.get('view'), 'cm');
  assert.equal(url.searchParams.get('to'), 'sahilmohammed062004@gmail.com');

  const withSubject = new URL(gmailComposeUrl('mailto:a@b.co?subject=Hello%20there&cc=c@d.co'));
  assert.equal(withSubject.searchParams.get('su'), 'Hello there');
  assert.equal(withSubject.searchParams.get('cc'), 'c@d.co');
});
