'use client';

// Noyau
import React, { useState } from 'react';

// Interfaces
import { IZoneResponse } from '@/lib/utils/interfaces';

// Composants
import ZoneAddForm from '@/lib/ui/screen-components/protected/super-admin/zone/form';
import ZoneHeader from '@/lib/ui/screen-components/protected/super-admin/zone/view/header/screen-header';
import ZoneMain from '@/lib/ui/screen-components/protected/super-admin/zone/view/main';

export default function ZoneScreen() {
  // États
  const [isAddRiderVisible, setIsAddRiderVisible] = useState(false);
  const [zone, setZone] = useState<IZoneResponse | null>(null);

  // Gestionnaire
  const onSetAddFormVisible = () => {
    setIsAddRiderVisible(true);
    setZone(null);
  };

  return (
    <>
      <div className="flex h-screen flex-col overflow-hidden p-3">
        <ZoneHeader onSetAddFormVisible={onSetAddFormVisible} />
        <div className="flex-grow overflow-y-auto">
          <ZoneMain
            setIsAddZoneVisible={setIsAddRiderVisible}
            setZone={setZone}
          />
        </div>

        <ZoneAddForm
          isAddZoneVisible={isAddRiderVisible}
          onHide={() => setIsAddRiderVisible(false)}
          zone={zone}
        />
      </div>
    </>
  );
}
