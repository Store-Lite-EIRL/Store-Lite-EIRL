import { CircularProgress } from '@/shared/components/ui/feedback/Progress';
import './pricing.css';

export default function PricingLoading() {
  return (
    <div className="pricing-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress indeterminate style={{ width: '48px', height: '48px', color: 'var(--md-sys-color-primary)' }} />
    </div>
  );
}
