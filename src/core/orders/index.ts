// ──────────────────────────────────────────
// Orders — barrel re-export
// ──────────────────────────────────────────

export {
  CONFIRMABLE_STATUSES,
  ORDER_STATUS,
  ORDER_STATUS_INTERNAL,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_V2,
  TICKET_UPLOADABLE_STATUSES,
} from './orderStatus';
export type { ActorType, OrderStatusV2, OrderStatusValue, TransitionInput } from './orderStatus';

export type { OrderAttachmentType, OrderTimelineEventType } from './orderTypes';

export {
  ForbiddenActorError,
  InvalidTransitionError,
  PreconditionError,
  getAllowedTransitions,
  isValidTransition,
  validateTransition,
  validateTransitionFull,
} from './orderStateMachine';
export type { ValidationResult } from './orderStateMachine';

export {
  getLegacyStatuses,
  isLegacyStatus,
  mapToLegacyStatus,
  mapToNewStatus,
} from './orderStatusMapping';

export { getTimeline, recordEvent } from './orderTimeline';
export type { RecordEventParams } from './orderTimeline';

export {
  MAX_ATTACHMENTS,
  deleteAttachment,
  listAttachments,
  uploadAttachment,
} from './orderAttachments';
export type {
  UploadAttachmentError,
  UploadAttachmentParams,
  UploadAttachmentResult,
} from './orderAttachments';

export { generatePickupCode } from './orderPickup';

export { isValidPaymentStatus } from './isValidPaymentStatus';

export { VersionConflictError, transition } from './orderService';
export type { TransitionError, TransitionResult } from './orderService';

export { processTimeouts } from './orderTimeouts';
