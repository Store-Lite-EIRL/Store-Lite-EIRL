// ──────────────────────────────────────────
// Orders — barrel re-export
// ──────────────────────────────────────────

export { ORDER_STATUS, ORDER_STATUS_V2, ORDER_STATUS_INTERNAL, ORDER_STATUS_LABELS, CONFIRMABLE_STATUSES, TICKET_UPLOADABLE_STATUSES } from './order-status';
export type { OrderStatusValue, OrderStatusV2, ActorType, TransitionInput } from './order-status';

export type { OrderAttachmentType, OrderTimelineEventType } from './order-types';

export { isValidTransition, validateTransition, validateTransitionFull, getAllowedTransitions, InvalidTransitionError, ForbiddenActorError, PreconditionError } from './order-state-machine';
export type { ValidationResult } from './order-state-machine';

export { mapToNewStatus, mapToLegacyStatus, isLegacyStatus, getLegacyStatuses } from './order-status-mapping';

export { recordEvent, getTimeline } from './order-timeline';
export type { RecordEventParams } from './order-timeline';

export { uploadAttachment, listAttachments, deleteAttachment, MAX_ATTACHMENTS } from './order-attachments';
export type { UploadAttachmentParams, UploadAttachmentResult, UploadAttachmentError } from './order-attachments';

export { generatePickupCode } from './order-pickup';

export { transition, VersionConflictError } from './order-service';
export type { TransitionResult, TransitionError } from './order-service';

export { processTimeouts } from './order-timeouts';
