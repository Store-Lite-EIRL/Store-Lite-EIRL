'use client';

import { requestOtpAction, verifyOtpAction } from '@app/actions/kyb';
import { useCallback, useRef, useState } from 'react';

export const OTP_LENGTH = 6;
const EMPTY_DIGITS = Array(OTP_LENGTH).fill('') as string[];

interface UseOtpVerificationOptions {
  /** Called after successful verification — proceed to save */
  onVerified: () => void;
}

export function useOtpVerification({ onVerified }: UseOtpVerificationOptions) {
  const [identifier, setIdentifier] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [digits, setDigits] = useState<string[]>([...EMPTY_DIGITS]);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /** Send OTP to the given phone number and open the modal */
  const requestOtp = useCallback(async (phone: string, countryPrefix = '+51') => {
    setIdentifier(phone);
    setIsSending(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('identifier', phone);
      fd.append('type', 'phone');
      fd.append('countryPrefix', countryPrefix);

      const result = await requestOtpAction(fd);
      if (result.error) {
        setError(result.error);
        return false;
      }

      setDigits([...EMPTY_DIGITS]);
      setError(null);
      setShowModal(true);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar código');
      return false;
    } finally {
      setIsSending(false);
    }
  }, []);

  /** Verify the 6-digit code the user entered */
  const verifyOtp = useCallback(async () => {
    const code = digits.join('');
    if (code.length !== OTP_LENGTH) return;

    setIsVerifying(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('identifier', identifier);
      fd.append('code', code);

      const result = await verifyOtpAction(fd);
      if (result.error) {
        setError(result.error);
        return;
      }

      setShowModal(false);
      setError(null);
      onVerified();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al verificar código');
    } finally {
      setIsVerifying(false);
    }
  }, [digits, identifier, onVerified]);

  /** Resend OTP (same identifier) */
  const resendOtp = useCallback(() => {
    setDigits([...EMPTY_DIGITS]);
    setError(null);
    // Fire-and-forget resend
    void requestOtp(identifier);
  }, [identifier, requestOtp]);

  const handleInput = useCallback((index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setError(null);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits],
  );

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const newDigits = pasted.split('').concat(EMPTY_DIGITS).slice(0, OTP_LENGTH) as string[];
    setDigits(newDigits);
    const nextEmpty = newDigits.findIndex((d) => !d);
    inputRefs.current[nextEmpty === -1 ? OTP_LENGTH - 1 : nextEmpty]?.focus();
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setError(null);
  }, []);

  return {
    requestOtp,
    verifyOtp,
    resendOtp,
    closeModal,
    showModal,
    digits,
    error,
    isSending,
    isVerifying,
    inputRefs,
    handleInput,
    handleKeyDown,
    handlePaste,
    identifier,
  };
}
