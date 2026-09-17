import { Container } from '@/components/ui';
import { ArrowRightIcon, ArrowUpRightIcon, DownloadIcon, SocialIcon } from '@/components/ui/icons';
import { ContactForm } from '@/components/site/contact-form';
import { OutboundLink } from '@/components/site/outbound-link';
import {
  getProfile,
  getResumeMedia,
  getSiteSettings,
  getSocialLinks,
} from '@/lib/services/content';
import { mediaUrl } from '@/lib/services/media';
import { displayUrl } from '@/lib/portfolio';

/**
 * The closing call to action. A single framed panel — the page's one large
 * "stage" apart from the hero — with email as the primary action, the other
 * channels as quiet rows, and the contact form alongside.
 */
export async function Contact({ index }: { index: string }) {
  const [profile, settings, links, resume] = await Promise.all([
    getProfile(),
    getSiteSettings(),
    getSocialLinks(),
    getResumeMedia(),
  ]);

  const resumeHref = mediaUrl(resume);
  const channels = links.filter((link) => !/^mailto:/i.test(link.url));
  const emailHref = profile.email
    ? `mailto:${profile.email}`
    : links.find((link) => /^mailto:/i.test(link.url))?.url;

  return (
    <section id="contact" className="scroll-mt-20 py-[clamp(4.5rem,3rem+6vw,8rem)]">
      <Container>
        <div
          data-spotlight-group=""
          data-spotlight=""
          data-reveal=""
          className="surface spotlight relative isolate overflow-hidden"
        >
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <div className="grid-backdrop opacity-70" />
            <div className="grid-backdrop grid-backdrop-lit" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(50% 60% at 0% 0%, var(--color-accent-subtle), transparent 70%)',
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-12 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16 lg:p-14">
            <div className="flex flex-col">
              <p className="t-label mb-5 flex items-center gap-3">
                <span className="text-accent">{index}</span>
                <span className="h-px w-8 bg-border-strong" aria-hidden="true" />
                <span>Contact</span>
              </p>
              <h2 className="t-title max-w-lg">
                Have a project, opportunity, or an interesting problem?
              </h2>
              <p className="t-lead mt-5 max-w-md">The quickest way to reach me is email.</p>

              {emailHref ? (
                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <OutboundLink href={emailHref} className="btn btn-primary h-12 px-6 text-[0.95rem]">
                    Email me
                    <ArrowRightIcon width="16" height="16" className="arrow-nudge" />
                  </OutboundLink>
                  {profile.email ? (
                    <span className="font-mono text-sm break-all text-fg-muted">{profile.email}</span>
                  ) : null}
                </div>
              ) : null}

              {channels.length > 0 || resumeHref ? (
                <ul className="mt-10 border-t border-border lg:mt-auto">
                  {channels.map((link) => (
                    <li key={link.id} className="border-b border-border">
                      <OutboundLink
                        href={link.url}
                        wrapperClassName="flex w-full"
                        className="group flex w-full items-center gap-4 py-4 text-fg-muted transition-colors hover:text-fg"
                      >
                        <SocialIcon platform={link.platform} width="16" height="16" />
                        <span className="text-[0.95rem] text-fg">{link.label}</span>
                        <span className="ml-auto hidden truncate font-mono text-xs text-fg-subtle sm:block">
                          {displayUrl(link.url)}
                        </span>
                        <ArrowUpRightIcon
                          width="15"
                          height="15"
                          className="arrow-nudge arrow-nudge-diag ml-auto shrink-0 sm:ml-0"
                        />
                      </OutboundLink>
                    </li>
                  ))}
                  {resumeHref ? (
                    <li className="border-b border-border">
                      <a
                        href={resumeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex w-full items-center gap-4 py-4 text-fg-muted transition-colors hover:text-fg"
                      >
                        <DownloadIcon width="16" height="16" />
                        <span className="text-[0.95rem] text-fg">Resume</span>
                        <span className="ml-auto hidden font-mono text-xs text-fg-subtle sm:block">PDF</span>
                        <ArrowUpRightIcon
                          width="15"
                          height="15"
                          className="arrow-nudge arrow-nudge-diag ml-auto shrink-0 sm:ml-0"
                        />
                      </a>
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </div>

            {settings.contactFormEnabled ? (
              <div className="rounded-2xl border border-border bg-bg/50 p-5 backdrop-blur-sm sm:p-7">
                <p className="t-label mb-5">Or send a message</p>
                <ContactForm />
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
