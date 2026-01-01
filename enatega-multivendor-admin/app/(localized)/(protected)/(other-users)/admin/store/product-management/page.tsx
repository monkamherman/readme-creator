'use client';

// Noyau
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function FoodManagementPage() {
  // Hooks
  const router = useRouter();

  // Effets
  useEffect(() => {
    router.push('/admin/store/food-management/food');
  }, []);

  return <></>;
}
