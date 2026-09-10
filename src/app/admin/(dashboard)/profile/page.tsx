import { ProfileForm } from '@/components/admin/forms/profile-form';
import { requireAdminPage } from '@/lib/auth/guard';
import { getProfile } from '@/lib/services/content';
import { toMediaOption } from '@/lib/services/media';

export const metadata = { title: 'Profile' };

export default async function AdminProfilePage() {
  await requireAdminPage();
  const profile = await getProfile();
  const avatar = await toMediaOption(profile.avatarMediaId);

  return (
    <>
      <header className="mb-6">
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Your name, headline and bio, shown in the hero and About sections.
        </p>
      </header>

      <ProfileForm profile={profile} avatar={avatar} />
    </>
  );
}
