import { Container, Skeleton } from '@/components/ui';

/**
 * Route-level loading state, shaped like the hero. Widths are capped with
 * max-w-full so the placeholder can never be wider than a 320px screen.
 */
export default function Loading() {
  return (
    <div
      className="pt-[clamp(4rem,2.5rem+6vw,8rem)] pb-16"
      aria-busy="true"
      aria-label="Loading"
    >
      <Container>
        <Skeleton className="h-7 w-72 max-w-full rounded-full" />
        <Skeleton className="mt-7 h-14 w-[28rem] max-w-full" />
        <Skeleton className="mt-5 h-6 w-96 max-w-full" />
        <Skeleton className="mt-9 h-11 w-40 max-w-full rounded-full" />
      </Container>
    </div>
  );
}
