import type { CSSProperties } from 'react';

import { Section, SectionHeading } from '@/components/ui';
import { CategoryIcon } from '@/components/ui/icons';
import { getSkillGroups } from '@/lib/services/content';
import { pad2 } from '@/lib/portfolio';

/**
 * Skills as grouped clusters rather than one flat wall of badges. Each group is
 * a card with its own glyph and count; individual technologies highlight on
 * hover. Groups and order come from the database.
 */
export async function Skills({ index }: { index: string }) {
  const groups = await getSkillGroups();
  if (groups.length === 0) return null;

  return (
    <Section id="skills" spotlight>
      <SectionHeading
        index={index}
        eyebrow="Skills"
        title="Tools of the trade."
        description="Grouped by where they sit in the stack."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group, i) => (
          <div
            key={group.id}
            data-spotlight=""
            data-reveal=""
            style={{ '--i': i } as CSSProperties}
            className="surface spotlight group flex flex-col p-6"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface-2 text-fg-muted transition-[color,transform,border-color] duration-300 group-hover:-translate-y-0.5 group-hover:border-accent-line group-hover:text-accent">
                  <CategoryIcon name={group.name} width="16" height="16" />
                </span>
                <h3 className="text-[0.975rem] tracking-tight">{group.name}</h3>
              </div>
              <span className="font-mono text-xs text-fg-subtle tabular-nums">
                {pad2(group.skills.length)}
              </span>
            </div>

            <ul className="flex flex-wrap gap-1.5">
              {group.skills.map((skill) => (
                <li
                  key={skill.id}
                  className="chip hover:border-accent-line hover:bg-accent-subtle hover:text-fg"
                >
                  {skill.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
