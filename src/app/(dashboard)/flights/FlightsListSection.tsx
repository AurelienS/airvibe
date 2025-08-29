import { Suspense } from 'react';
import { SkeletonList } from '@/components/SkeletonList';
import dynamic from 'next/dynamic';

const FlightsListServer = dynamic(() => import('./FlightsListServer'));

export function FlightsListSection({ year, location }: { year?: string; location?: string }) {
  return (
    <Suspense fallback={<SkeletonList rows={10} />}>
      <FlightsListServer year={year} location={location} />
    </Suspense>
  );
}


