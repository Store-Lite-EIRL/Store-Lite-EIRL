// ──────────────────────────────────────────
// Order domain types — shared type aliases
// Maps DB enum types to clean domain types
// ──────────────────────────────────────────

import type {
  orderAttachmentTypeEnum,
  orderTimelineEventTypeEnum,
} from '@/core/database/schema/enums';

/** Typed attachment type values */
export type OrderAttachmentType = (typeof orderAttachmentTypeEnum.enumValues)[number];

/** Typed timeline event type values */
export type OrderTimelineEventType = (typeof orderTimelineEventTypeEnum.enumValues)[number];
