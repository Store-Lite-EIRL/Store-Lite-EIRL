'use client';

import type { Business } from '@/core/database/schema';
import { useState } from 'react';
import style from '../ListBusiness.module.css';
import BusinessCard from './BusinessCard';
import DeleteBusinessDialog from './DeleteBusinessDialog';
import BusinessSettingsModal from './BusinessSettingsModal';

interface BusinessGridProps {
  businesses: Business[];
}

export default function BusinessGrid({ businesses }: BusinessGridProps) {
  const [selectedBusiness, setSelectedBusiness] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEditBusiness, setSelectedEditBusiness] = useState<Business | null>(null);
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

  const handleEditClick = (biz: Business) => {
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
        open={isSettingsOpen}
        onClose={handleCloseSettings}
      />
    </>
  );
}
