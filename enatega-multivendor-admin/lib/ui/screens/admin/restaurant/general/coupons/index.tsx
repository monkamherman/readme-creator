'use client';
// Noyau
import { useState } from 'react';

// Composants
import CouponsHeader from '@/lib/ui/screen-components/protected/restaurant/coupons/view/header/screen-header';
import CouponsMain from '@/lib/ui/screen-components/protected/restaurant/coupons/view/main';
import CouponsAddForm from '@/lib/ui/screen-components/protected/restaurant/coupons/add-form';

// Interfaces and Types
import { ICouponRestaurantResponse } from '@/lib/utils/interfaces/coupons-restaurant.interface';

export default function CouponsScreen() {
  // État
  const [isAddCouponVisible, setIsAddCouponVisible] = useState(false);
  const [coupon, setCoupon] = useState<null | ICouponRestaurantResponse>(null);

  return (
    <div className="screen-container">
      <CouponsHeader setIsAddCouponVisible={setIsAddCouponVisible} />

      <CouponsMain
        setIsAddCouponVisible={setIsAddCouponVisible}
        setCoupon={setCoupon}
      />

      <CouponsAddForm
        coupon={coupon}
        onHide={() => {
          setIsAddCouponVisible(false);
          setCoupon(null);
        }}
        isAddCouponVisible={isAddCouponVisible}
      />
    </div>
  );
}
