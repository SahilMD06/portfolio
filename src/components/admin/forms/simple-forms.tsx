'use client';

import {
  CheckboxField,
  EntityForm,
  FormSection,
  SelectField,
  TextAreaField,
  TextField,
} from '@/components/admin/form';
import { MediaPicker, type MediaOption } from '@/components/admin/media-picker';
import {
  saveAchievement,
  saveCertification,
  saveEducation,
  saveSkill,
  saveSkillCategory,
  saveSocialLink,
} from '@/lib/actions/admin';
import type {
  Achievement,
  Certification,
  Education,
  Skill,
  SkillCategory,
  SocialLink,
} from '@/lib/db/schema';

/** The smaller entities, each a thin arrangement of the shared field set. */

export function EducationForm({ item }: { item: Education | null }) {
  return (
    <EntityForm
      action={saveEducation}
      id={item?.id}
      cancelHref="/admin/education"
      submitLabel={item ? 'Save changes' : 'Add education'}
    >
      {(errors) => (
        <>
          <FormSection title="Institution">
            <TextField
              name="institution"
              label="Institution"
              required
              defaultValue={item?.institution}
              error={errors.institution}
              maxLength={220}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="degree"
                label="Degree"
                required
                defaultValue={item?.degree}
                error={errors.degree}
                placeholder="B.Tech"
                maxLength={200}
              />
              <TextField
                name="field"
                label="Field of study"
                defaultValue={item?.field}
                error={errors.field}
                placeholder="Computer Science and Engineering"
                maxLength={200}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                name="startDate"
                label="Start"
                required
                defaultValue={item?.startDate}
                error={errors.startDate}
                placeholder="2022"
              />
              <TextField
                name="endDate"
                label="End"
                defaultValue={item?.endDate}
                error={errors.endDate}
                placeholder="2026"
              />
              <TextField
                name="grade"
                label="CGPA / percentage"
                defaultValue={item?.grade}
                error={errors.grade}
                placeholder="CGPA 8.5 / 10"
                maxLength={60}
              />
            </div>
          </FormSection>

          <FormSection title="Details">
            <TextAreaField
              name="description"
              label="Description"
              rows={3}
              defaultValue={item?.description}
              error={errors.description}
              maxLength={4000}
            />
            <TextAreaField
              name="achievements"
              label="Coursework and achievements"
              rows={4}
              defaultValue={item?.achievements.join('\n')}
              error={errors.achievements}
              hint="One per line."
            />
            <TextField
              name="displayOrder"
              label="Display order"
              type="number"
              defaultValue={item?.displayOrder ?? 0}
              error={errors.displayOrder}
            />
          </FormSection>
        </>
      )}
    </EntityForm>
  );
}

export function CertificationForm({
  item,
  file,
}: {
  item: Certification | null;
  file: MediaOption | null;
}) {
  return (
    <EntityForm
      action={saveCertification}
      id={item?.id}
      cancelHref="/admin/certifications"
      submitLabel={item ? 'Save changes' : 'Add certification'}
    >
      {(errors) => (
        <>
          <FormSection title="Certification">
            <TextField
              name="name"
              label="Certification name"
              required
              defaultValue={item?.name}
              error={errors.name}
              maxLength={240}
            />
            <TextField
              name="issuer"
              label="Issuing organisation"
              required
              defaultValue={item?.issuer}
              error={errors.issuer}
              maxLength={200}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="issueDate"
                label="Issue date"
                defaultValue={item?.issueDate}
                error={errors.issueDate}
                placeholder="2024-09"
              />
              <TextField
                name="expiryDate"
                label="Expiry date"
                defaultValue={item?.expiryDate}
                error={errors.expiryDate}
                hint="Leave blank if it does not expire"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="credentialId"
                label="Credential ID"
                defaultValue={item?.credentialId}
                error={errors.credentialId}
                maxLength={200}
              />
              <TextField
                name="credentialUrl"
                label="Credential URL"
                type="url"
                defaultValue={item?.credentialUrl}
                error={errors.credentialUrl}
                placeholder="https://..."
              />
            </div>
          </FormSection>

          <FormSection title="Certificate file">
            <MediaPicker
              name="mediaId"
              label="Certificate"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              hint="PDF up to 10 MB, or an image up to 5 MB."
              initial={file}
            />
            <TextField
              name="displayOrder"
              label="Display order"
              type="number"
              defaultValue={item?.displayOrder ?? 0}
              error={errors.displayOrder}
            />
          </FormSection>
        </>
      )}
    </EntityForm>
  );
}

export function AchievementForm({
  item,
  file,
}: {
  item: Achievement | null;
  file: MediaOption | null;
}) {
  return (
    <EntityForm
      action={saveAchievement}
      id={item?.id}
      cancelHref="/admin/achievements"
      submitLabel={item ? 'Save changes' : 'Add achievement'}
    >
      {(errors) => (
        <>
          <FormSection title="Achievement">
            <TextField
              name="title"
              label="Title"
              required
              defaultValue={item?.title}
              error={errors.title}
              maxLength={240}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="organization"
                label="Organisation"
                defaultValue={item?.organization}
                error={errors.organization}
                maxLength={200}
              />
              <TextField
                name="date"
                label="Date"
                defaultValue={item?.date}
                error={errors.date}
                placeholder="2024-10"
              />
            </div>
            <TextAreaField
              name="description"
              label="Description"
              rows={4}
              defaultValue={item?.description}
              error={errors.description}
              maxLength={4000}
            />
            <TextField
              name="url"
              label="Link"
              type="url"
              defaultValue={item?.url}
              error={errors.url}
              placeholder="https://..."
            />
          </FormSection>

          <FormSection title="Supporting document">
            <MediaPicker
              name="mediaId"
              label="Document or image"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              initial={file}
            />
            <TextField
              name="displayOrder"
              label="Display order"
              type="number"
              defaultValue={item?.displayOrder ?? 0}
              error={errors.displayOrder}
            />
          </FormSection>
        </>
      )}
    </EntityForm>
  );
}

export function SkillForm({
  item,
  categories,
}: {
  item: Skill | null;
  categories: SkillCategory[];
}) {
  return (
    <EntityForm
      action={saveSkill}
      id={item?.id}
      cancelHref="/admin/skills"
      submitLabel={item ? 'Save changes' : 'Add skill'}
    >
      {(errors) => (
        <FormSection title="Skill">
          <TextField
            name="name"
            label="Skill name"
            required
            defaultValue={item?.name}
            error={errors.name}
            maxLength={120}
          />
          <SelectField
            name="categoryId"
            label="Category"
            required
            defaultValue={item?.categoryId ?? categories[0]?.id}
            error={errors.categoryId}
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
          />
          <CheckboxField
            name="visible"
            label="Visible"
            hint="Hidden skills stay in the database but are not shown publicly."
            defaultChecked={item?.visible ?? true}
          />
          <CheckboxField
            name="featured"
            label="Featured"
            defaultChecked={item?.featured ?? false}
          />
          <TextField
            name="displayOrder"
            label="Display order"
            type="number"
            defaultValue={item?.displayOrder ?? 0}
            error={errors.displayOrder}
          />
        </FormSection>
      )}
    </EntityForm>
  );
}

export function SkillCategoryForm({ item }: { item: SkillCategory | null }) {
  return (
    <EntityForm
      action={saveSkillCategory}
      id={item?.id}
      cancelHref="/admin/skills"
      submitLabel={item ? 'Save changes' : 'Add category'}
    >
      {(errors) => (
        <FormSection
          title="Category"
          description="Categories group skills on the public site, e.g. Programming or Data / ML."
        >
          <TextField
            name="name"
            label="Category name"
            required
            defaultValue={item?.name}
            error={errors.name}
            maxLength={120}
          />
          <TextField
            name="slug"
            label="Slug"
            required
            defaultValue={item?.slug}
            error={errors.slug}
            hint="Lowercase letters, numbers and hyphens."
            maxLength={140}
          />
          <TextField
            name="displayOrder"
            label="Display order"
            type="number"
            defaultValue={item?.displayOrder ?? 0}
            error={errors.displayOrder}
          />
        </FormSection>
      )}
    </EntityForm>
  );
}

const PLATFORMS = [
  { value: 'github', label: 'GitHub' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'mail', label: 'Email' },
  { value: 'link', label: 'Other link' },
];

export function SocialLinkForm({ item }: { item: SocialLink | null }) {
  return (
    <EntityForm
      action={saveSocialLink}
      id={item?.id}
      cancelHref="/admin/social-links"
      submitLabel={item ? 'Save changes' : 'Add link'}
    >
      {(errors) => (
        <FormSection title="Link">
          <TextField
            name="label"
            label="Label"
            required
            defaultValue={item?.label}
            error={errors.label}
            placeholder="GitHub"
            maxLength={80}
          />
          <SelectField
            name="platform"
            label="Platform"
            defaultValue={item?.platform ?? 'link'}
            options={PLATFORMS}
            error={errors.platform}
            hint="Determines which icon is shown."
          />
          <TextField
            name="url"
            label="URL"
            required
            defaultValue={item?.url}
            error={errors.url}
            placeholder="https://github.com/yourname"
            hint="Use mailto:you@example.com for email."
          />
          <CheckboxField
            name="visible"
            label="Visible"
            defaultChecked={item?.visible ?? true}
          />
          <TextField
            name="displayOrder"
            label="Display order"
            type="number"
            defaultValue={item?.displayOrder ?? 0}
            error={errors.displayOrder}
          />
        </FormSection>
      )}
    </EntityForm>
  );
}
