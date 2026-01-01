'use client';

// Noyau
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function GeneralPage() {
  // Hooks
  const router = useRouter();

  // Effets
  useEffect(() => {
    router.push('/general/vendors');
  }, []);

  return <></>;
}
