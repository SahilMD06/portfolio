import { Container, Skeleton } from '@/components/ui';

/**
 * Suspense fallback for a streamed section. Its height roughly matches the real
 * content so the page does not jump as each section resolves (CLS).
 */
export function SectionSkeleton({ rows = 2, cards = false }: { rows?: number; cards?: boolean }) {
  return (
    <div className="py-14 sm:py-20" aria-hidden="true">
      <Container>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-7 w-56" />
        <div className={cards ? 'mt-8 grid gap-5 sm:grid-cols-2' : 'mt-8 space-y-4'}>
          {Array.from({ length: rows }).map((_, index) => (
            <Skeleton key={index} className={cards ? 'h-56 w-full' : 'h-24 w-full'} />
          ))}
        </div>
      </Container>
    </div>
  );
}
