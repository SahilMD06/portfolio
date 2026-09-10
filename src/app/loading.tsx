import { Container, Skeleton } from '@/components/ui';

export default function Loading() {
  return (
    <div className="py-20" aria-busy="true" aria-label="Loading">
      <Container>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-4 h-5 w-80" />
        <Skeleton className="mt-8 h-11 w-40" />
      </Container>
    </div>
  );
}
