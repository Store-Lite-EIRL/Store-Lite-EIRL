'use client';

import type { StorefrontTheme } from '@/core/storefront';
import { BusinessPreviewCard } from '@/shared/components/business/BusinessPreviewCard';
import type { BusinessData } from '../types';

interface BusinessPreviewProps {
  formData: BusinessData;
  logoPreview: string | null;
  storefrontTheme: StorefrontTheme;
  onStorefrontThemeChange: (theme: StorefrontTheme) => void;
}

export const BusinessPreview = ({
  formData,
  logoPreview,
  storefrontTheme,
  onStorefrontThemeChange,
}: BusinessPreviewProps) => {
  return (
    <BusinessPreviewCard
      commercialName={formData.commercialName}
      sector={formData.sector}
      country={formData.country}
      city={formData.city}
      address={formData.address}
      email={formData.email}
      description={formData.description}
      taxId={formData.taxId}
      legalRepName={formData.legalRepName}
      legalRepRole={formData.legalRepRole}
      logoPreview={logoPreview}
      storefrontTheme={storefrontTheme}
      onStorefrontThemeChange={onStorefrontThemeChange}
      showDownloadButton={true}
    />
  );
};
