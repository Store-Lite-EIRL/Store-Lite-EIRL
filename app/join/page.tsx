'use client';

import { Button, Card, Icon, TextField } from '@/shared/components/ui';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState, useTransition } from 'react';
import { confirmJoinTeam, joinTeam } from '../actions/team';
import { JoinSuccessModal } from './components/JoinSuccessModal';
import styles from './join.module.css';

export default function JoinTeamPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [slug, setSlug] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [pendingBusiness, setPendingBusiness] = useState<{
    id: string;
    name: string;
    slug: string;
  } | null>(null);
  const [ownBusinessId, setOwnBusinessId] = useState<string | null>(null);

  // Success state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [joinedBusiness, setJoinedBusiness] = useState<{
    name: string;
    slug: string;
  } | null>(null);

  const handleJoin = () => {
    if (!slug.trim()) {
      setError('Por favor, ingresa el nombre del negocio.');
      return;
    }
    if (!code.trim()) {
      setError('Por favor, ingresa el código de invitación.');
      return;
    }

    startTransition(async () => {
      setError(null);

      // Normalize slug
      const normalizedSlug = slug.trim().toLowerCase().replace(/\s+/g, '-');
      const result = await joinTeam(normalizedSlug, code.trim());

      if (!result.success) {
        setError(result.error || 'No se pudo unir al equipo.');
        return;
      }

      // If user has own business, show decision modal
      if (result.hasOwnBusiness && result.business) {
        setPendingBusiness(result.business);
        setOwnBusinessId(result.ownBusinessId || null);
        setShowDecisionModal(true);
      } else if (result.success && result.business) {
        // Direct success - show confetti and redirect
        setJoinedBusiness({
          name: result.business.name,
          slug: result.business.slug,
        });
        setShowSuccessModal(true);
      }
    });
  };

  const handleConfirmJoin = () => {
    if (!pendingBusiness || !ownBusinessId) return;

    startTransition(async () => {
      const result = await confirmJoinTeam(code.trim(), ownBusinessId);
      if (result.success) {
        setShowDecisionModal(false);
        setJoinedBusiness({
          name: pendingBusiness.name,
          slug: pendingBusiness.slug,
        });
        setShowSuccessModal(true);
      } else {
        setError(result.error || 'Error al confirmar la unión.');
      }
    });
  };

  const handleSuccessComplete = useCallback(() => {
    if (joinedBusiness) {
      router.push(`/${joinedBusiness.slug}/settings`);
    }
  }, [joinedBusiness, router]);

  const handleStayInOwnBusiness = () => {
    setShowDecisionModal(false);
    setPendingBusiness(null);
    setOwnBusinessId(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <Icon size={48}>group_add</Icon>
          </div>
          <h1 className={styles.title}>Unirse a un equipo</h1>
          <p className={styles.subtitle}>
            Ingresá el nombre del negocio y el código de invitación que te proporcionó el dueño.
          </p>
        </div>

        <Card variant="elevated" className={styles.card}>
          <div className={styles.form}>
            <TextField
              label="Nombre del negocio"
              placeholder="mi-negocio"
              value={slug}
              onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
              }
              disabled={isPending}
              supportingText="El nombre aparece en la URL del negocio"
            >
              <Icon slot="leading-icon">store</Icon>
            </TextField>

            <TextField
              label="Código de invitación"
              placeholder="XXXX-XXXX"
              value={code}
              onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCode(e.target.value.toUpperCase())
              }
              disabled={isPending}
              supportingText="El código tiene el formato XXXX-XXXX"
            >
              <Icon slot="leading-icon">key</Icon>
            </TextField>

            {error && (
              <div className={styles.error}>
                <Icon size={18}>error</Icon>
                <span>{error}</span>
              </div>
            )}

            <Button
              variant="filled"
              onClick={handleJoin}
              disabled={isPending || !slug.trim() || !code.trim()}
              className={styles.button}
            >
              <Icon slot="icon" size={20}>
                {isPending ? 'sync' : 'login'}
              </Icon>
              {isPending ? 'Verificando...' : 'Unirme al equipo'}
            </Button>
          </div>
        </Card>

        <div className={styles.help}>
          <p>
            <Icon size={16}>help</Icon>
            ¿No tenés los datos? Contactá al dueño del negocio para que te invite.
          </p>
        </div>
      </div>

      {/* Decision Modal for users with own business */}
      {showDecisionModal && pendingBusiness && (
        <div className={styles.modalOverlay}>
          <Card variant="elevated" className={styles.modal}>
            <div className={styles.modalIcon}>
              <Icon size={40}>swap_horiz</Icon>
            </div>
            <h2 className={styles.modalTitle}>¿Deseas cambiarte a este equipo?</h2>
            <p className={styles.modalText}>
              Tenés un negocio propio. Al unirte a <strong>{pendingBusiness.name}</strong>, podrás
              trabajar en este equipo manteniendo acceso a tu negocio.
            </p>
            <div className={styles.modalActions}>
              <Button variant="outlined" onClick={handleStayInOwnBusiness} disabled={isPending}>
                Permanecer en mi negocio
              </Button>
              <Button variant="filled" onClick={handleConfirmJoin} disabled={isPending}>
                Unirme al equipo
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Success Modal with Confetti */}
      {showSuccessModal && joinedBusiness && (
        <JoinSuccessModal
          businessName={joinedBusiness.name}
          onComplete={handleSuccessComplete}
        />
      )}
    </div>
  );
}
