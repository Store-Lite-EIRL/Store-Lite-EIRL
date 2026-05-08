// =====================================================
// KYB SERVER ACTIONS (Re-export)
// =====================================================
// Description: Barrel file to maintain import path '@/app/actions/kyb'
// Actual implementation lives in src/features/kyb/kybActions.ts
// =====================================================

export {
  createVerifiedBusinessAction,
  requestOtpAction,
  verifyIdentityAction,
  verifyOtpAction,
} from '@/features/kyb/kybActions';
