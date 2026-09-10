import { Container } from '@/components/ui';
import { SocialIcon } from '@/components/ui/icons';
import { getProfile, getSiteSettings, getSocialLinks } from '@/lib/services/content';

export async function SiteFooter() {
  const [profile, settings, links] = await Promise.all([
    getProfile(),
    getSiteSettings(),
    getSocialLinks(),
  ]);

  return (
    <footer className="mt-8 border-t border-border py-10">
      <Container className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">{profile.fullName}</p>
          {settings.footerText ? (
            <p className="mt-1 text-sm text-fg-subtle">{settings.footerText}</p>
          ) : null}
          <p className="mt-1 text-sm text-fg-subtle">
            &copy; {new Date().getFullYear()} {profile.fullName}. All rights reserved.
          </p>
        </div>

        {links.length > 0 ? (
          <ul className="flex items-center gap-1.5">
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  title={link.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-fg-muted transition-colors duration-150 hover:text-fg"
                >
                  <SocialIcon platform={link.platform} width="17" height="17" />
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </Container>
    </footer>
  );
}
