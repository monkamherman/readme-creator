'use client';

// Noyau
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RestaurantPage() {
  // Hooks
  const router = useRouter();

  // Effets
  useEffect(() => {
    router.push('/admin/vendor/dashboard'); // vendor or restaurant based on user type
  }, []);

  return <></>;
}
