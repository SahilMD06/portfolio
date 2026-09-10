'use client';

import { EntityForm, FormSection, TextAreaField, TextField } from '@/components/admin/form';
import { MediaPicker } from '@/components/admin/media-picker';
import { saveProfile, saveSiteSettings } from '@/lib/actions/admin';
import type { Profile, SiteSettings } from '@/lib/db/schema';
import type { MediaOption } from '@/types';

export function ProfileForm({
  profile,
  avatar,
}: {
  profile: Profile;
  avatar: MediaOption | null;
}) {
  return (
    <EntityForm action={saveProfile} cancelHref={undefined} redirectOnSuccess={false}>
      {(errors) => (
        <>
          <FormSection title="Identity">
            <TextField
              name="fullName"
              label="Full name"
              required
              defaultValue={profile.fullName}
              error={errors.fullName}
              maxLength={160}
            />
            <TextField
              name="headline"
              label="Headline"
              required
              defaultValue={profile.headline}
              error={errors.headline}
              hint="Shown directly under your name, e.g. Software Engineer · Full-Stack & Data"
              maxLength={240}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="email"
                label="Contact email"
                type="email"
                defaultValue={profile.email}
                error={errors.email}
                hint="Shown publicly in the Contact section."
                maxLength={255}
              />
              <TextField
                name="location"
                label="Location"
                defaultValue={profile.location}
                error={errors.location}
                maxLength={160}
              />
            </div>
          </FormSection>

          <FormSection title="Bio">
            <TextAreaField
              name="shortBio"
              label="Short bio"
              rows={3}
              defaultValue={profile.shortBio}
              error={errors.shortBio}
              hint="One or two sentences, shown in the hero."
              maxLength={1000}
            />
            <TextAreaField
              name="about"
              label="About"
              rows={8}
              defaultValue={profile.about}
              error={errors.about}
              hint="The longer About section. Separate paragraphs with a blank line."
              maxLength={6000}
            />
          </FormSection>

          <FormSection title="Interests" description="Shown as a summary card beside your About text.">
            <TextAreaField
              name="currentFocus"
              label="Current focus"
              rows={2}
              defaultValue={profile.currentFocus}
              error={errors.currentFocus}
              maxLength={2000}
            />
            <TextAreaField
              name="careerInterests"
              label="Career interests"
              rows={2}
              defaultValue={profile.careerInterests}
              error={errors.careerInterests}
              maxLength={2000}
            />
            <TextAreaField
              name="technicalInterests"
              label="Technical interests"
              rows={2}
              defaultValue={profile.technicalInterests}
              error={errors.technicalInterests}
              maxLength={2000}
            />
          </FormSection>

          <FormSection title="Photo">
            <MediaPicker
              name="avatarMediaId"
              label="Profile image"
              accept="image/png,image/jpeg,image/webp,image/avif"
              hint="Optional. Max 5 MB."
              initial={avatar}
            />
            {/* Preserve the resume link, which is managed on the Resume page. */}
            <input type="hidden" name="resumeMediaId" value={profile.resumeMediaId ?? ''} />
          </FormSection>
        </>
      )}
    </EntityForm>
  );
}

export function SiteSettingsForm({
  settings,
  ogImage,
}: {
  settings: SiteSettings;
  ogImage: MediaOption | null;
}) {
  return (
    <EntityForm action={saveSiteSettings} cancelHref={undefined} redirectOnSuccess={false}>
      {(errors) => (
        <>
          <FormSection
            title="Search engine listing"
            description="Leave blank to fall back to your name, headline and short bio."
          >
            <TextField
              name="seoTitle"
              label="SEO title"
              defaultValue={settings.seoTitle}
              error={errors.seoTitle}
              hint="Around 60 characters works best."
              maxLength={200}
            />
            <TextAreaField
              name="seoDescription"
              label="SEO description"
              rows={3}
              defaultValue={settings.seoDescription}
              error={errors.seoDescription}
              hint="Around 155 characters works best."
              maxLength={400}
            />
            <MediaPicker
              name="ogImageMediaId"
              label="Social preview image"
              accept="image/png,image/jpeg,image/webp"
              hint="Shown when your link is shared. 1200 × 630 works best."
              initial={ogImage}
            />
          </FormSection>

          <FormSection title="Site">
            <TextField
              name="footerText"
              label="Footer text"
              defaultValue={settings.footerText}
              error={errors.footerText}
              maxLength={300}
            />
            <div className="space-y-3">
              <label className="flex items-start gap-2.5">
                <input type="hidden" name="contactFormEnabled" value="false" />
                <input
                  type="checkbox"
                  name="contactFormEnabled"
                  value="true"
                  defaultChecked={settings.contactFormEnabled}
                  className="mt-0.5 h-4 w-4 rounded border-border-strong accent-accent"
                />
                <span>
                  <span className="text-sm font-medium">Enable contact form</span>
                  <span className="block text-xs text-fg-subtle">
                    When off, only your email address and links are shown.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5">
                <input type="hidden" name="analyticsEnabled" value="false" />
                <input
                  type="checkbox"
                  name="analyticsEnabled"
                  value="true"
                  defaultChecked={settings.analyticsEnabled}
                  className="mt-0.5 h-4 w-4 rounded border-border-strong accent-accent"
                />
                <span>
                  <span className="text-sm font-medium">Enable analytics</span>
                  <span className="block text-xs text-fg-subtle">
                    Loads Vercel Web Analytics only when deployed with it enabled.
                  </span>
                </span>
              </label>
            </div>
          </FormSection>
        </>
      )}
    </EntityForm>
  );
}
