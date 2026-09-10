import { Container, LinkButton } from '@/components/ui';
import { ArrowRightIcon, DownloadIcon, SocialIcon } from '@/components/ui/icons';
import { getProfile, getResumeMedia, getSocialLinks } from '@/lib/services/content';
import { mediaUrl } from '@/lib/services/media';

/**
 * The only section rendered eagerly — it is the first viewport, so it must not
 * sit behind a Suspense boundary. Everything below it streams in.
 */
export async function Hero() {
  const [profile, links, resume] = await Promise.all([
    getProfile(),
    getSocialLinks(),
    getResumeMedia(),
  ]);

  const resumeHref = mediaUrl(resume);

  return (
    <section className="border-b border-border bg-surface/40">
      <Container className="py-16 sm:py-24">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-fg-muted">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-success"
            aria-hidden="true"
          />
          Open to Software Engineering &amp; Internship roles
        </p>

        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          {profile.fullName}
        </h1>

        <p className="mt-3 max-w-2xl text-lg text-accent sm:text-xl">{profile.headline}</p>

        {profile.shortBio ? (
          <p className="mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-fg-muted">
            {profile.shortBio}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <LinkButton href="#projects" size="lg">
            View my work
            <ArrowRightIcon width="16" height="16" />
          </LinkButton>

          {resumeHref ? (
            <LinkButton href={resumeHref} variant="secondary" size="lg" external>
              <DownloadIcon width="16" height="16" />
              Resume
            </LinkButton>
          ) : null}

          <LinkButton href="#contact" variant="ghost" size="lg">
            Get in touch
          </LinkButton>
        </div>

        {links.length > 0 ? (
          <ul className="mt-8 flex flex-wrap items-center gap-2">
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-fg-muted transition-colors duration-150 hover:text-fg"
                >
                  <SocialIcon platform={link.platform} width="15" height="15" />
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        {profile.location ? (
          <p className="mt-6 text-sm text-fg-subtle">Based in {profile.location}</p>
        ) : null}
      </Container>
    </section>
  );
}
