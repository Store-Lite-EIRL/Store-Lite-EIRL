// =====================================================
// KYB SERVER ACTIONS (Re-export)
// =====================================================
// Description: Barrel file to maintain import path '@/app/actions/kyb'
// Actual implementation lives in src/features/business/actions/kybActions.ts
// =====================================================

export {
  createVerifiedBusinessAction,
  requestOtpAction,
  verifyIdentityAction,
  verifyOtpAction,
} from '@/features/business/actions/kybActions';
