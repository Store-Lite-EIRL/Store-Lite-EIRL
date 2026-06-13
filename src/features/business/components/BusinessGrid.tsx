'use client';

import type { Business } from '@/core/database/schema';
import style from '@app/list-business/ListBusiness.module.css';
import { useState } from 'react';
import BusinessCard from './BusinessCard';
import BusinessSettingsModal from './BusinessSettingsModal';
import DeleteBusinessDialog from './DeleteBusinessDialog';

interface BusinessGridProps {
  businesses: (Business & { isTeam?: boolean; planType?: string | null })[];
}

export default function BusinessGrid({ businesses }: BusinessGridProps) {
  const [selectedBusiness, setSelectedBusiness] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEditBusiness, setSelectedEditBusiness] = useState<
    (Business & { planType?: string | null }) | null
  >(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleDeleteClick = (biz: Business) => {
    setSelectedBusiness(biz);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedBusiness(null);
  };

  const handleDeletionSuccess = () => {
    // Server action already revalidates the path
  };

  const handleEditClick = (biz: Business & { planType?: string | null }) => {
    setSelectedEditBusiness(biz);
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
    setSelectedEditBusiness(null);
  };

  return (
    <>
      <div className={style.businessGrid}>
        {businesses.map((biz, index) => (
          <BusinessCard
            key={biz.id}
            biz={biz}
            index={index}
            onDelete={() => handleDeleteClick(biz)}
            onEdit={() => handleEditClick(biz)}
          />
        ))}
      </div>

      <DeleteBusinessDialog
        business={selectedBusiness}
        open={isDialogOpen}
        onClose={handleCloseDialog}
        onSuccess={handleDeletionSuccess}
      />

      <BusinessSettingsModal
        business={selectedEditBusiness}
        planType={selectedEditBusiness?.planType ?? null}
        open={isSettingsOpen}
        onClose={handleCloseSettings}
      />
    </>
  );
}
