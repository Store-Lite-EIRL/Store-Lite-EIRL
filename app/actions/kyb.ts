// =====================================================
// KYB SERVER ACTIONS (Re-export)
// =====================================================
// Description: Barrel file to maintain import path '@/app/actions/kyb'
// Actual implementation lives in src/features/kyb/kyb-actions.ts
// =====================================================

export {
  createVerifiedBusinessAction,
  requestOtpAction,
  verifyIdentityAction,
  verifyOtpAction,
  verifyRepresentativeAction,
} from '@/features/kyb/kyb-actions';
