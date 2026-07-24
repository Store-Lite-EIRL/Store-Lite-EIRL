// =====================================================
// LEGAL — TypeScript Types & Constants
// =====================================================
// Types for legal content stored in businessSettings.preferences
// and for the complaint book form (Libro de Reclamaciones).
// =====================================================

/**
 * Legal content stored in `businessSettings.preferences` jsonb.
 * Each field holds the raw text content for the corresponding
 * public legal page.
 */
export interface LegalPreferences {
  /** Términos y Condiciones — plain text content */
  termsContent?: string | null;
  /** Política de Devoluciones — plain text content */
  returnsContent?: string | null;
  /** Email de contacto para reclamos legales */
  complaintContactEmail?: string | null;
}

/**
 * Zod schema and validation will be applied server-side,
 * but this type serves as the canonical form data shape
 * for the Libro de Reclamaciones submission.
 *
 * Matches Anexo I del DS 011-2011-PCM.
 */
export interface ComplaintFormInput {
  consumerLastName: string;
  consumerFirstName: string;
  consumerDocumentType: 'dni' | 'ce';
  consumerDocumentId: string;
  consumerAddress: string;
  consumerPhone: string;
  consumerEmail: string;
  minorAge: boolean;
  guardianName?: string | null;
  contractDescription: string;
  claimedAmount?: number | null;
  claimDescription: string;
  consumerRequest: string;
}

/**
 * Result returned by the submitComplaint server action.
 */
export interface ComplaintSubmitResult {
  success: boolean;
  ticketNumber?: string;
  emailFailed?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Complaint record displayed in the admin dashboard.
 */
export interface ComplaintAdminView {
  id: string;
  ticketNumber: string;
  consumerName: string;
  consumerEmail: string;
  claimType: 'queja' | 'reclamo';
  claimDescription: string;
  status: 'pending' | 'acknowledged' | 'responded';
  createdAt: string;
  slaDeadline: string;
}

/**
 * Complaint record returned by getComplaints server action.
 */
export interface ComplaintRecord {
  id: string;
  ticketNumber: string;
  consumerFirstName: string;
  consumerLastName: string;
  consumerEmail: string;
  claimDescription: string;
  status: 'pending' | 'acknowledged' | 'responded';
  createdAt: string;
  slaDeadline: string;
}
