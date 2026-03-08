'use client';

import type { Business } from '@/core/database/schema';
import { useState } from 'react';
import style from '../ListBusiness.module.css';
import BusinessCard from './BusinessCard';
import DeleteBusinessDialog from './DeleteBusinessDialog';

interface BusinessGridProps {
  businesses: Business[];
}

export default function BusinessGrid({ businesses }: BusinessGridProps) {
  const [selectedBusiness, setSelectedBusiness] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDeleteClick = (biz: Business) => {
    setSelectedBusiness(biz);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedBusiness(null);
  };

  const handleDeletionSuccess = () => {
    // Optionally show a success message or handle anything after deletion
    // The server action already revalidates the path
  };

  return (
    <>
      <div className={style.businessGrid}>
        {businesses.map((biz) => (
          <BusinessCard key={biz.id} biz={biz} onDelete={() => handleDeleteClick(biz)} />
        ))}
      </div>

      <DeleteBusinessDialog
        business={selectedBusiness}
        open={isDialogOpen}
        onClose={handleCloseDialog}
        onSuccess={handleDeletionSuccess}
      />
    </>
  );
}
