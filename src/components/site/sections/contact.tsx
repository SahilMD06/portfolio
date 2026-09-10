import { Card, LinkButton, Section, SectionHeading } from '@/components/ui';
import { DownloadIcon, SocialIcon } from '@/components/ui/icons';
import { ContactForm } from '@/components/site/contact-form';
import {
  getProfile,
  getResumeMedia,
  getSiteSettings,
  getSocialLinks,
} from '@/lib/services/content';
import { mediaUrl } from '@/lib/services/media';

export async function Contact() {
  const [profile, settings, links, resume] = await Promise.all([
    getProfile(),
    getSiteSettings(),
    getSocialLinks(),
    getResumeMedia(),
  ]);

  const resumeHref = mediaUrl(resume);

  return (
    <Section id="contact" className="reveal">
      <SectionHeading
        eyebrow="Contact"
        title="Get in touch"
        description="I'm open to software engineering roles and internships. The quickest way to reach me is email."
      />

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="space-y-4">
          {profile.email ? (
            <Card className="p-5">
              <p className="text-xs font-semibold tracking-[0.1em] text-fg-subtle uppercase">
                Email
              </p>
              <a
                href={`mailto:${profile.email}`}
                className="mt-1.5 block break-all text-[0.95rem] text-accent hover:underline"
              >
                {profile.email}
              </a>
            </Card>
          ) : null}

          {links.length > 0 ? (
            <Card className="p-5">
              <p className="text-xs font-semibold tracking-[0.1em] text-fg-subtle uppercase">
                Elsewhere
              </p>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 text-sm text-fg-muted hover:text-fg"
                    >
                      <SocialIcon platform={link.platform} width="15" height="15" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {resumeHref ? (
            <Card className="p-5">
              <p className="text-xs font-semibold tracking-[0.1em] text-fg-subtle uppercase">
                Resume
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <LinkButton href={resumeHref} variant="secondary" size="sm" external>
                  View
                </LinkButton>
                <LinkButton
                  href={`${resumeHref}?download=1`}
                  variant="secondary"
                  size="sm"
                  external
                  download
                >
                  <DownloadIcon width="15" height="15" />
                  Download
                </LinkButton>
              </div>
            </Card>
          ) : null}
        </div>

        {settings.contactFormEnabled ? (
          <Card className="p-5 sm:p-6">
            <ContactForm />
          </Card>
        ) : null}
      </div>
    </Section>
  );
}
