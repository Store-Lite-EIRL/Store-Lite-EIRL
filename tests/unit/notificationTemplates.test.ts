import {
  appealDecisionNotice,
  appealReceivedNotice,
  deactivationNotice,
  gracePeriodNotice,
} from '@/lib/legal/notificationTemplates';
import { describe, expect, it } from 'vitest';

describe('Legal Notification Templates (DS 011-2011-PCM)', () => {
  const mockBusiness = {
    id: 'biz-1',
    name: 'Test Business S.A.C.',
    slug: 'test-business',
    legalName: 'Test Business S.A.C.',
    taxId: '20123456789',
    email: 'contact@testbusiness.com',
    address: 'Av. Principal 123, Lima, Perú',
  };

  const mockComplaints = ['complaint-1', 'complaint-2', 'complaint-3'];
  const graceUntil = new Date('2024-12-15T10:00:00-05:00');
  const appealDeadline = new Date('2024-12-25T10:00:00-05:00');
  const appealId = 'appeal-1';
  const reactivatedAt = new Date('2024-12-20T10:00:00-05:00');

  describe('deactivationNotice', () => {
    it('generates HTML with all required DS 011 fields', () => {
      const html = deactivationNotice({
        business: mockBusiness,
        reason: 'verified_complaints',
        complaintIds: mockComplaints,
        graceUntil,
      });

      // Required DS 011 fields
      expect(html).toContain('Test Business S.A.C.');
      expect(html).toContain('20123456789');
      expect(html).toContain('Av. Principal 123, Lima, Perú');
      expect(html).toContain('contact@testbusiness.com');
      expect(html).toContain('Denuncias verificadas');
      expect(html).toContain('complaint-1');
      expect(html).toContain('complaint-2');
      expect(html).toContain('complaint-3');
      expect(html).toContain('72 horas');
      expect(html).toContain('15/12/2024');
      expect(html).toContain('Libro de Reclamaciones');
      expect(html).toContain('DS 011-2011-PCM');
    });

    it('includes appeal instructions and deadline', () => {
      const html = deactivationNotice({
        business: mockBusiness,
        reason: 'verified_complaints',
        complaintIds: mockComplaints,
        graceUntil,
      });

      expect(html).toContain('reclamo');
      expect(html).toContain('apelación');
      expect(html).toContain('10 días hábiles');
    });
  });

  describe('gracePeriodNotice', () => {
    it('generates HTML with grace period reminder', () => {
      const html = gracePeriodNotice({
        business: mockBusiness,
        graceUntil,
        appealDeadline,
      });

      expect(html).toContain('Test Business S.A.C.');
      expect(html).toContain('período de gracia');
      expect(html).toContain('15/12/2024');
      expect(html).toContain('25/12/2024');
      expect(html).toContain('apelación');
    });
  });

  describe('appealReceivedNotice', () => {
    it('generates HTML confirming appeal receipt with SLA deadline', () => {
      const html = appealReceivedNotice({
        business: mockBusiness,
        appealId,
        slaDeadline: appealDeadline,
      });

      expect(html).toContain('Test Business S.A.C.');
      expect(html).toContain('apelación recibida');
      expect(html).toContain('appeal-1');
      expect(html).toContain('25/12/2024');
      expect(html).toContain('10 días hábiles');
      expect(html).toContain('SLA');
    });
  });

  describe('appealDecisionNotice', () => {
    it('generates HTML for approved appeal with reactivation date', () => {
      const html = appealDecisionNotice({
        business: mockBusiness,
        decision: 'approved',
        adminNotes: 'Apelación fundada. Se reactiva el negocio.',
        reactivatedAt,
      });

      expect(html).toContain('Test Business S.A.C.');
      expect(html).toContain('APROBADA');
      expect(html).toContain('reactivada');
      expect(html).toContain('20/12/2024');
      expect(html).toContain('Apelación fundada');
    });

    it('generates HTML for rejected appeal', () => {
      const html = appealDecisionNotice({
        business: mockBusiness,
        decision: 'rejected',
        adminNotes: 'Apelación no fundada. Mantiene desactivación.',
      });

      expect(html).toContain('Test Business S.A.C.');
      expect(html).toContain('RECHAZADA');
      expect(html).toContain('desactivación se mantiene');
      expect(html).toContain('Apelación no fundada');
    });
  });

  it('all templates include platform branding and contact info', () => {
    const templates = [
      deactivationNotice({
        business: mockBusiness,
        reason: 'verified_complaints',
        complaintIds: mockComplaints,
        graceUntil,
      }),
      gracePeriodNotice({ business: mockBusiness, graceUntil, appealDeadline }),
      appealReceivedNotice({ business: mockBusiness, appealId, slaDeadline: appealDeadline }),
      appealDecisionNotice({
        business: mockBusiness,
        decision: 'approved',
        adminNotes: 'Test',
        reactivatedAt,
      }),
    ];

    templates.forEach((html) => {
      expect(html).toContain('Store Lite');
      expect(html).toContain('soporte@storelite.com');
    });
  });
});
