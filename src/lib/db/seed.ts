/**
 * Seeds the database with the initial admin user and starter portfolio content.
 *
 *   npm run db:seed
 *
 * Safe to re-run: it skips any table that already has rows, so it will never
 * overwrite content edited through the admin dashboard.
 */
import './load-env';

import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import path from 'node:path';

import { sql } from 'drizzle-orm';

import * as schema from './schema';
import { resolvePgliteDataDir } from './pglite-path';

const scrypt = promisify(scryptCallback) as (
  p: string | Buffer,
  s: string | Buffer,
  k: number,
) => Promise<Buffer>;

/** Mirrors src/lib/auth/password.ts (kept standalone so the seed has no server-only imports). */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize('NFKC'), salt, 64);
  return ['scrypt', 16384, 8, 1, salt.toString('base64'), derived.toString('base64')].join('$');
}

/** Marker so generated content is obvious in the admin UI. */
const SAMPLE = '[Sample content — edit or delete in /admin]';

async function connect() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const postgres = (await import('postgres')).default;
    const client = postgres(databaseUrl, { max: 1 });
    return { db: drizzle(client, { schema }), close: () => client.end() };
  }
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const client = new PGlite(resolvePgliteDataDir());
  await client.waitReady;
  return { db: drizzle(client, { schema }), close: () => client.close() };
}

async function isEmpty(db: Awaited<ReturnType<typeof connect>>['db'], table: string) {
  const result = await db.execute(sql.raw(`select count(*)::int as c from ${table}`));
  const rows = result as unknown as { c: number }[];
  return (rows[0]?.c ?? 0) === 0;
}

async function main() {
  const { db, close } = await connect();

  /* --- Admin user -------------------------------------------------------- */
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (await isEmpty(db, 'users')) {
    if (!adminPassword) {
      throw new Error(
        'ADMIN_PASSWORD is not set. Add it to .env.local before seeding so the admin account has a real password.',
      );
    }
    if (adminPassword.length < 10) {
      throw new Error('ADMIN_PASSWORD must be at least 10 characters.');
    }
    await db.insert(schema.users).values({
      email: adminEmail.toLowerCase(),
      passwordHash: await hashPassword(adminPassword),
      name: 'Neel Khandelwal',
      role: 'admin',
    });
    console.warn(`Created admin user: ${adminEmail}`);
  } else {
    console.warn('Users already exist — skipping admin creation.');
  }

  /* --- Profile ----------------------------------------------------------- */
  if (await isEmpty(db, 'profile')) {
    await db.insert(schema.profile).values({
      id: 1,
      fullName: 'Neel Khandelwal',
      headline: 'Software Engineer · Full-Stack & Data',
      shortBio:
        'I build fast, reliable web applications end to end — from database schema and APIs through to accessible, performant interfaces.',
      about: `${SAMPLE} I am a software engineer who enjoys working across the whole stack: designing a clean relational model, exposing it through well-shaped APIs, and finishing with an interface that feels quick and obvious to use.

Recently I have been splitting my time between full-stack product work in TypeScript and exploratory data analysis in Python — and I like problems where those two overlap.`,
      currentFocus:
        `${SAMPLE} Building production TypeScript applications with Next.js, and deepening my statistical foundations for data-heavy work.`,
      careerInterests:
        'Software Engineering · Full-Stack Development · Backend Engineering · Data and Machine Learning',
      technicalInterests:
        'Distributed systems, API design, query performance, applied statistics, and developer tooling.',
      location: 'India',
      email: 'neel.khandelwal@example.com',
    });
  }

  /* --- Site settings ----------------------------------------------------- */
  if (await isEmpty(db, 'site_settings')) {
    await db.insert(schema.siteSettings).values({
      id: 1,
      seoTitle: 'Neel Khandelwal — Software Engineer',
      seoDescription:
        'Portfolio of Neel Khandelwal, a software engineer working across full-stack web development and data. Projects, experience, and contact details.',
      footerText: 'Built with Next.js, TypeScript and PostgreSQL.',
      contactFormEnabled: true,
      analyticsEnabled: true,
    });
  }

  /* --- Skills ------------------------------------------------------------ */
  if (await isEmpty(db, 'skill_categories')) {
    const categories = [
      {
        name: 'Programming',
        slug: 'programming',
        items: ['C++', 'Python', 'JavaScript', 'TypeScript', 'SQL'],
      },
      {
        name: 'Web Development',
        slug: 'web-development',
        items: ['HTML', 'CSS', 'React', 'Next.js', 'Node.js', 'REST APIs'],
      },
      {
        name: 'Data / ML',
        slug: 'data-ml',
        items: [
          'Pandas',
          'NumPy',
          'SciPy',
          'Scikit-learn',
          'EDA',
          'Statistical Hypothesis Testing',
        ],
      },
      { name: 'Tools', slug: 'tools', items: ['Git', 'GitHub', 'Docker', 'Tableau'] },
    ];

    for (const [categoryIndex, category] of categories.entries()) {
      const inserted = await db
        .insert(schema.skillCategories)
        .values({ name: category.name, slug: category.slug, displayOrder: categoryIndex })
        .returning();
      const categoryId = inserted[0]!.id;
      await db.insert(schema.skills).values(
        category.items.map((name, index) => ({
          categoryId,
          name,
          displayOrder: index,
          featured: index < 3,
          visible: true,
        })),
      );
    }
  }

  /* --- Projects ---------------------------------------------------------- */
  if (await isEmpty(db, 'projects')) {
    await db.insert(schema.projects).values([
      {
        title: 'Portfolio CMS',
        slug: 'portfolio-cms',
        summary:
          'A database-backed personal portfolio with a private admin dashboard for managing every section without touching code.',
        description: `${SAMPLE}

A full-stack content management system built on Next.js App Router and PostgreSQL. The public site renders entirely from the database and streams each section independently, so the hero is interactive long before the rest of the content resolves.

The admin dashboard provides complete CRUD for projects, experience, skills, education, certifications and achievements, with server-side authorisation on every mutation and tag-based cache invalidation so published changes appear immediately.`,
        category: 'Full-Stack',
        technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Drizzle ORM', 'Tailwind CSS'],
        featured: true,
        published: true,
        startDate: '2025-01',
        displayOrder: 0,
      },
      {
        title: 'Retail Sales Analysis',
        slug: 'retail-sales-analysis',
        summary:
          'Exploratory analysis of a multi-year retail dataset, testing whether promotional periods produced a statistically significant lift.',
        description: `${SAMPLE}

An end-to-end analysis in Python: cleaning and reconciling several years of transaction records, engineering seasonal features, and visualising category-level trends.

The central question was whether promotional windows produced a real lift or simply pulled demand forward. Two-sample hypothesis testing on matched periods, with the results summarised in an interactive Tableau dashboard.`,
        category: 'Data / ML',
        technologies: ['Python', 'Pandas', 'NumPy', 'SciPy', 'Tableau'],
        featured: true,
        published: true,
        startDate: '2024-08',
        endDate: '2024-11',
        displayOrder: 1,
      },
      {
        title: 'Task API',
        slug: 'task-api',
        summary:
          'A REST API for task management with token authentication, role-based access control and containerised deployment.',
        description: `${SAMPLE}

A backend service exposing a REST API for projects, tasks and assignments. Includes token-based authentication, role-based authorisation, request validation, pagination and structured error responses.

Packaged with Docker and covered by an integration test suite that runs against a real database rather than mocks.`,
        category: 'Backend',
        technologies: ['Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'REST APIs'],
        featured: false,
        published: true,
        startDate: '2024-03',
        endDate: '2024-06',
        displayOrder: 2,
      },
    ]);
  }

  /* --- Experience -------------------------------------------------------- */
  if (await isEmpty(db, 'experiences')) {
    await db.insert(schema.experiences).values([
      {
        company: 'Example Technologies',
        role: 'Software Engineering Intern',
        employmentType: 'Internship',
        location: 'Remote',
        startDate: '2025-05',
        endDate: '2025-07',
        isCurrent: false,
        description: `${SAMPLE} Worked with the platform team on internal tooling used by the engineering organisation.`,
        responsibilities: [
          'Built and shipped features across a React and Node.js codebase.',
          'Wrote integration tests covering critical API paths.',
          'Participated in code review and sprint planning.',
        ],
        achievements: [
          'Reduced a key dashboard endpoint from ~1.8s to ~300ms by removing N+1 queries and adding covering indexes.',
        ],
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Git'],
        published: true,
        displayOrder: 0,
      },
      {
        company: 'Example Analytics',
        role: 'Data Analyst Intern',
        employmentType: 'Internship',
        location: 'Hybrid',
        startDate: '2024-06',
        endDate: '2024-08',
        isCurrent: false,
        description: `${SAMPLE} Supported the analytics team with reporting and exploratory analysis.`,
        responsibilities: [
          'Cleaned and consolidated datasets from several upstream sources.',
          'Produced recurring reports and Tableau dashboards for stakeholders.',
        ],
        achievements: ['Automated a weekly report that previously took roughly four hours by hand.'],
        technologies: ['Python', 'Pandas', 'SQL', 'Tableau'],
        published: true,
        displayOrder: 1,
      },
    ]);
  }

  /* --- Education --------------------------------------------------------- */
  if (await isEmpty(db, 'education')) {
    await db.insert(schema.education).values([
      {
        institution: 'Example University',
        degree: 'B.Tech',
        field: 'Computer Science and Engineering',
        startDate: '2022',
        endDate: '2026',
        grade: 'CGPA 8.5 / 10',
        description: `${SAMPLE} Replace with your institution, degree and results.`,
        achievements: ['Coursework: Data Structures, Algorithms, DBMS, Operating Systems, Statistics'],
        displayOrder: 0,
      },
    ]);
  }

  /* --- Certifications ---------------------------------------------------- */
  if (await isEmpty(db, 'certifications')) {
    await db.insert(schema.certifications).values([
      {
        name: 'Sample Certification — Data Analysis with Python',
        issuer: 'Example Learning Platform',
        issueDate: '2024-09',
        credentialId: 'SAMPLE-1234',
        displayOrder: 0,
      },
    ]);
  }

  /* --- Achievements ------------------------------------------------------ */
  if (await isEmpty(db, 'achievements')) {
    await db.insert(schema.achievements).values([
      {
        title: 'Sample Achievement — Hackathon Finalist',
        organization: 'Example Hackathon',
        description: `${SAMPLE} Replace with a real achievement, or delete this entry.`,
        date: '2024-10',
        displayOrder: 0,
      },
    ]);
  }

  /* --- Social links ------------------------------------------------------ */
  if (await isEmpty(db, 'social_links')) {
    await db.insert(schema.socialLinks).values([
      {
        label: 'GitHub',
        platform: 'github',
        url: 'https://github.com/example',
        displayOrder: 0,
      },
      {
        label: 'LinkedIn',
        platform: 'linkedin',
        url: 'https://www.linkedin.com/in/example',
        displayOrder: 1,
      },
      {
        label: 'Email',
        platform: 'mail',
        url: 'mailto:neel.khandelwal@example.com',
        displayOrder: 2,
      },
    ]);
  }

  console.warn('Seed complete.');
  console.warn(`Database: ${process.env.DATABASE_URL ? 'PostgreSQL server' : path.join(process.cwd(), '.data', 'pgdata')}`);
  await close();
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
