import { ResumeManager } from '@/components/admin/resume-manager';
import { requireAdminPage } from '@/lib/auth/guard';
import { getProfile } from '@/lib/services/content';
import { toMediaOption } from '@/lib/services/media';

export const metadata = { title: 'Resume' };

export default async function AdminResumePage() {
  await requireAdminPage();
  const profile = await getProfile();
  const resume = await toMediaOption(profile.resumeMediaId);

  return (
    <>
      <header className="mb-6">
        <h1 className="text-xl font-semibold">Resume</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Upload a PDF. The View and Download buttons appear on your portfolio automatically.
        </p>
      </header>

      <ResumeManager resume={resume} />
    </>
  );
}
