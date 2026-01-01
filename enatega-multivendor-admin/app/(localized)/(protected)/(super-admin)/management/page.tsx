'use client';

// Noyau
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
// Écran

export default function GeneralPage() {
  // Hooks
  const router = useRouter();

  // Effets
  useEffect(() => {
    router.push('/management/configurations');
  }, []);

  return <></>;
}
