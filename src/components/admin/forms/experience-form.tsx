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
import { saveExperience } from '@/lib/actions/admin';
import type { Experience } from '@/lib/db/schema';

const EMPLOYMENT_TYPES = [
  'Internship',
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Apprenticeship',
  'Volunteer',
].map((value) => ({ value, label: value }));

export function ExperienceForm({
  experience,
  logo,
  document,
}: {
  experience: Experience | null;
  logo: MediaOption | null;
  document: MediaOption | null;
}) {
  return (
    <EntityForm
      action={saveExperience}
      id={experience?.id}
      cancelHref="/admin/experience"
      submitLabel={experience ? 'Save changes' : 'Add experience'}
    >
      {(errors) => (
        <>
          <FormSection title="Role">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="company"
                label="Company"
                required
                defaultValue={experience?.company}
                error={errors.company}
                maxLength={200}
              />
              <TextField
                name="role"
                label="Role"
                required
                defaultValue={experience?.role}
                error={errors.role}
                maxLength={200}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                name="employmentType"
                label="Employment type"
                defaultValue={experience?.employmentType ?? 'Internship'}
                options={EMPLOYMENT_TYPES}
                error={errors.employmentType}
              />
              <TextField
                name="location"
                label="Location"
                defaultValue={experience?.location}
                error={errors.location}
                placeholder="Remote, Bengaluru, Hybrid…"
                maxLength={160}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="startDate"
                label="Start date"
                required
                defaultValue={experience?.startDate}
                error={errors.startDate}
                hint="YYYY or YYYY-MM"
                placeholder="2025-05"
              />
              <TextField
                name="endDate"
                label="End date"
                defaultValue={experience?.endDate}
                error={errors.endDate}
                hint="Ignored if 'Currently working here' is ticked"
                placeholder="2025-07"
              />
            </div>
            <CheckboxField
              name="isCurrent"
              label="Currently working here"
              hint="Shows a Current badge and 'Present' instead of an end date."
              defaultChecked={experience?.isCurrent ?? false}
            />
          </FormSection>

          <FormSection title="What you did">
            <TextAreaField
              name="description"
              label="Description"
              rows={4}
              defaultValue={experience?.description}
              error={errors.description}
              hint="A short summary of the role. Separate paragraphs with a blank line."
              maxLength={6000}
            />
            <TextAreaField
              name="responsibilities"
              label="Responsibilities"
              rows={4}
              defaultValue={experience?.responsibilities.join('\n')}
              error={errors.responsibilities}
              hint="One per line. Rendered as a bulleted list."
            />
            <TextAreaField
              name="achievements"
              label="Achievements"
              rows={3}
              defaultValue={experience?.achievements.join('\n')}
              error={errors.achievements}
              hint="One per line. Highlighted separately — put measurable impact here."
            />
            <TextAreaField
              name="technologies"
              label="Technologies"
              rows={2}
              defaultValue={experience?.technologies.join(', ')}
              error={errors.technologies}
              hint="Comma separated."
            />
          </FormSection>

          <FormSection title="Files">
            <MediaPicker
              name="logoMediaId"
              label="Company logo"
              accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
              hint="Square works best. Max 5 MB."
              initial={logo}
            />
            <MediaPicker
              name="documentMediaId"
              label="Certificate or offer letter"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              hint="PDF up to 10 MB, or an image up to 5 MB."
              initial={document}
            />
          </FormSection>

          <FormSection title="Visibility">
            <CheckboxField
              name="published"
              label="Published"
              hint="Unpublished entries are hidden from the public site."
              defaultChecked={experience?.published ?? true}
            />
            <TextField
              name="displayOrder"
              label="Display order"
              type="number"
              defaultValue={experience?.displayOrder ?? 0}
              error={errors.displayOrder}
              hint="Lower numbers appear first."
            />
          </FormSection>
        </>
      )}
    </EntityForm>
  );
}
