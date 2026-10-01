import type { CSSProperties } from 'react';

import { Section, SectionHeading } from '@/components/ui';
import { CategoryIcon } from '@/components/ui/icons';
import { getSkillGroups } from '@/lib/services/content';
import { pad2 } from '@/lib/portfolio';

/**
 * Skills as a typographic index rather than a wall of logos: one row per
 * group, the category set large and light on the left with its technologies
 * running as text beside it. Hovering or focusing a row brings it forward.
 *
 * Everything stays visible at rest, so nothing is hidden behind a hover.
 */
export async function Skills({ index }: { index: string }) {
  const groups = await getSkillGroups();
  if (groups.length === 0) return null;

  return (
    <Section id="skills" spotlight>
      <SectionHeading
        index={index}
        eyebrow="Skills"
        title={
          <>
            Tools of the <span className="t-em">trade</span>.
          </>
        }
        description="Grouped by where they sit in the stack."
      />

      <ul className="border-t border-border">
        {groups.map((group, i) => (
          <li
            key={group.id}
            data-reveal=""
            style={{ '--i': i } as CSSProperties}
            className="group border-b border-border"
          >
            <div className="grid grid-cols-1 items-baseline gap-x-12 gap-y-5 py-8 transition-[padding,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-surface/40 sm:py-10 lg:grid-cols-12 lg:group-hover:pl-4">
              <div className="flex items-center gap-4 lg:col-span-4">
                <span className="font-mono text-[0.7rem] text-accent tabular-nums">
                  {pad2(i + 1)}
                </span>
                <h3 className="flex items-center gap-3 text-[clamp(1.3rem,1.1rem+0.8vw,1.85rem)] leading-none font-light tracking-[-0.03em] text-fg">
                  {group.name}
                </h3>
                <CategoryIcon
                  name={group.name}
                  width="15"
                  height="15"
                  className="text-fg-subtle transition-colors duration-500 group-hover:text-accent"
                  aria-hidden="true"
                />
              </div>

              <ul className="flex flex-wrap gap-x-6 gap-y-2.5 lg:col-span-7">
                {group.skills.map((skill) => (
                  <li
                    key={skill.id}
                    className="text-[0.88rem] font-light text-fg-subtle transition-colors duration-500 group-hover:text-fg-muted"
                  >
                    {skill.name}
                  </li>
                ))}
              </ul>

              <span className="hidden font-mono text-[0.7rem] text-fg-subtle tabular-nums lg:col-span-1 lg:block lg:text-right">
                {pad2(group.skills.length)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
