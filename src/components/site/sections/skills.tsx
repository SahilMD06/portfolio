import { Card, Section, SectionHeading } from '@/components/ui';
import { getSkillGroups } from '@/lib/services/content';

export async function Skills() {
  const groups = await getSkillGroups();
  if (groups.length === 0) return null;

  return (
    <Section id="skills" className="reveal">
      <SectionHeading
        eyebrow="Skills"
        title="Tools I work with"
        description="Grouped by where they sit in the stack."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.id} className="p-5">
            <h3 className="text-sm font-semibold">{group.name}</h3>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {group.skills.map((skill) => (
                <li
                  key={skill.id}
                  className="rounded-md border border-border bg-surface-2 px-2.5 py-1 text-[0.8rem] text-fg-muted"
                >
                  {skill.name}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </Section>
  );
}
