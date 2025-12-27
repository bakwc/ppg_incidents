'use client';

import dynamic from 'next/dynamic';

const UnverifiedList = dynamic(() => import('@/components/UnverifiedList'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function UnverifiedPage() {
  return <UnverifiedList />;
}

