import { SiteHeaderClient, type NavItem } from './site-header-client';
import { getExperiences, getProfile } from '@/lib/services/content';
import { isResearch } from '@/lib/portfolio';

/**
 * Server wrapper: resolves the owner's name and which sections exist, so the
 * navigation never links to a section the database has no content for.
 */
export async function SiteHeader() {
  const [profile, experiences] = await Promise.all([getProfile(), getExperiences()]);
  const hasResearch = experiences.some(isResearch);

  const items: NavItem[] = [
    { id: 'about', label: 'About' },
    { id: 'experience', label: 'Experience' },
    ...(hasResearch ? [{ id: 'research', label: 'Research' }] : []),
    { id: 'projects', label: 'Projects' },
    { id: 'skills', label: 'Skills' },
    { id: 'credentials', label: 'Credentials' },
    { id: 'contact', label: 'Contact' },
  ];

  return <SiteHeaderClient name={profile.fullName} items={items} />;
}
