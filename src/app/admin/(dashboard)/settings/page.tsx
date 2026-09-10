import { SiteSettingsForm } from '@/components/admin/forms/profile-form';
import { requireAdminPage } from '@/lib/auth/guard';
import { getSiteSettings } from '@/lib/services/content';
import { toMediaOption } from '@/lib/services/media';

export const metadata = { title: 'Site settings' };

export default async function AdminSettingsPage() {
  await requireAdminPage();
  const settings = await getSiteSettings();
  const ogImage = await toMediaOption(settings.ogImageMediaId);

  return (
    <>
      <header className="mb-6">
        <h1 className="text-xl font-semibold">Site settings</h1>
        <p className="mt-1 text-sm text-fg-muted">
          SEO metadata, social preview and site-wide options.
        </p>
      </header>

      <SiteSettingsForm settings={settings} ogImage={ogImage} />
    </>
  );
}
