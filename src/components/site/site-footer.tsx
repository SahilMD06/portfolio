import { Container } from '@/components/ui';
import { ArrowUpIcon, SocialIcon } from '@/components/ui/icons';
import { OutboundLink } from '@/components/site/outbound-link';
import { getProfile, getSiteSettings, getSocialLinks } from '@/lib/services/content';

export async function SiteFooter() {
  const [profile, settings, links] = await Promise.all([
    getProfile(),
    getSiteSettings(),
    getSocialLinks(),
  ]);

  return (
    <footer className="border-t border-border">
      <Container className="flex flex-col gap-8 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="font-medium tracking-tight">{profile.fullName}</p>
          {profile.headline ? <p className="text-sm text-fg-muted">{profile.headline}</p> : null}
          <p className="t-label pt-2">
            © {new Date().getFullYear()}
            {settings.footerText ? ` · ${settings.footerText}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {links.map((link) => (
            <OutboundLink
              key={link.id}
              href={link.url}
              aria-label={link.label}
              title={link.label}
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-fg-muted transition-[color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:text-fg"
            >
              <SocialIcon platform={link.platform} width="16" height="16" />
            </OutboundLink>
          ))}
          <a
            href="#main"
            aria-label="Back to top"
            title="Back to top"
            className="group ml-2 grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-fg-muted transition-[color,border-color] duration-200 hover:border-accent-line hover:text-accent"
          >
            <ArrowUpIcon
              width="16"
              height="16"
              className="transition-transform duration-200 group-hover:-translate-y-0.5"
            />
          </a>
        </div>
      </Container>
    </footer>
  );
}
