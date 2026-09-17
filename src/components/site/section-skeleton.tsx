import { Container, Skeleton } from '@/components/ui';

/**
 * Suspense fallback for a streamed section, sized like the real thing so the
 * page does not jump as each section resolves.
 */
export function SectionSkeleton({ rows = 2, cards = false }: { rows?: number; cards?: boolean }) {
  return (
    <div className="py-[clamp(4.5rem,3rem+6vw,8rem)]" aria-hidden="true">
      <Container>
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-5 h-10 w-72 max-w-full" />
        <div
          className={cards ? 'mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'mt-14 space-y-4'}
        >
          {Array.from({ length: rows }).map((_, index) => (
            <Skeleton
              key={index}
              className={cards ? 'h-56 w-full rounded-card' : 'h-28 w-full rounded-card'}
            />
          ))}
        </div>
      </Container>
    </div>
  );
}
