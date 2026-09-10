'use client';

import {
  CheckboxField,
  EntityForm,
  FormSection,
  TextAreaField,
  TextField,
} from '@/components/admin/form';
import { MediaPicker, type MediaOption } from '@/components/admin/media-picker';
import { saveProject } from '@/lib/actions/admin';
import type { Project } from '@/lib/db/schema';

export function ProjectForm({
  project,
  image,
}: {
  project: Project | null;
  image: MediaOption | null;
}) {
  return (
    <EntityForm
      action={saveProject}
      id={project?.id}
      cancelHref="/admin/projects"
      submitLabel={project ? 'Save changes' : 'Create project'}
    >
      {(errors) => (
        <>
          <FormSection title="Basics">
            <TextField
              name="title"
              label="Project name"
              required
              defaultValue={project?.title}
              error={errors.title}
              maxLength={200}
            />
            <TextField
              name="slug"
              label="Slug"
              required
              defaultValue={project?.slug}
              error={errors.slug}
              hint="Used in the URL: /projects/your-slug. Lowercase letters, numbers and hyphens."
              maxLength={220}
            />
            <TextAreaField
              name="summary"
              label="Short description"
              rows={2}
              defaultValue={project?.summary}
              error={errors.summary}
              hint="Shown on project cards. Keep it to one or two sentences."
              maxLength={400}
            />
            <TextAreaField
              name="description"
              label="Full description"
              rows={10}
              defaultValue={project?.description}
              error={errors.description}
              hint="Shown on the project page. Separate paragraphs with a blank line."
              maxLength={20000}
            />
          </FormSection>

          <FormSection title="Details">
            <TextField
              name="category"
              label="Category"
              defaultValue={project?.category}
              error={errors.category}
              hint="e.g. Full-Stack, Backend, Data / ML"
              maxLength={120}
            />
            <TextAreaField
              name="technologies"
              label="Technologies"
              rows={2}
              defaultValue={project?.technologies.join(', ')}
              error={errors.technologies}
              hint="Comma separated, e.g. Next.js, TypeScript, PostgreSQL"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="startDate"
                label="Start date"
                defaultValue={project?.startDate}
                error={errors.startDate}
                hint="YYYY or YYYY-MM"
                placeholder="2025-01"
              />
              <TextField
                name="endDate"
                label="End date"
                defaultValue={project?.endDate}
                error={errors.endDate}
                hint="Leave blank if ongoing"
                placeholder="2025-06"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="githubUrl"
                label="GitHub URL"
                type="url"
                defaultValue={project?.githubUrl}
                error={errors.githubUrl}
                placeholder="https://github.com/..."
              />
              <TextField
                name="demoUrl"
                label="Live demo URL"
                type="url"
                defaultValue={project?.demoUrl}
                error={errors.demoUrl}
                placeholder="https://..."
              />
            </div>
          </FormSection>

          <FormSection title="Image">
            <MediaPicker
              name="imageMediaId"
              label="Main image"
              accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
              hint="Shown on the project card and as the social preview. Max 5 MB. 16:9 works best."
              initial={image}
            />
          </FormSection>

          <FormSection title="Visibility">
            <CheckboxField
              name="published"
              label="Published"
              hint="Unpublished projects are hidden from the public site."
              defaultChecked={project?.published ?? true}
            />
            <CheckboxField
              name="featured"
              label="Featured"
              hint="Featured projects appear in the Selected work section on the homepage."
              defaultChecked={project?.featured ?? false}
            />
            <TextField
              name="displayOrder"
              label="Display order"
              type="number"
              defaultValue={project?.displayOrder ?? 0}
              error={errors.displayOrder}
              hint="Lower numbers appear first. You can also reorder from the list."
            />
          </FormSection>
        </>
      )}
    </EntityForm>
  );
}
