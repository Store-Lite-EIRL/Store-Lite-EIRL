'use client';

import { requestOtpAction, verifyOtpAction } from '@app/actions/kyb';
import { useRef, useState } from 'react';
import type { BusinessData } from '../types';

export const OTP_LENGTH = 6;
export const EMPTY_OTP_DIGITS = Array(OTP_LENGTH).fill('') as string[];

export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export interface PhoneOtpVerificationOptions {
  formData: BusinessData;
  onChange: (field: keyof BusinessData, value: string) => void;
  verifiedPhone?: string | null;
  onPhoneVerificationChange?: (phone: string | null) => void;
}

export function usePhoneOtpVerification({
  formData,
  onChange,
  verifiedPhone,
  onPhoneVerificationChange,
}: PhoneOtpVerificationOptions) {
  const isVerified = verifiedPhone !== null && formData.phone === verifiedPhone;
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(EMPTY_OTP_DIGITS);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    onChange('phone', digits);
    if (otpError) setOtpError(null);
  };

  const handleRequestOtp = async () => {
    const phone = formData.phone.trim();
    if (phone.length !== 9) return;

    setIsOtpSending(true);
    setOtpError(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append('identifier', phone);
      formDataObj.append('type', 'phone');
      formDataObj.append('countryPrefix', formData.countryPrefix || '+51');

      const result = await requestOtpAction(formDataObj);

      if (result.error) {
        setOtpError(result.error);
        return;
      }

      setOtpDigits([...EMPTY_OTP_DIGITS]);
      setOtpError(null);
      setShowOtpModal(true);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (error: unknown) {
      setOtpError(getErrorMessage(error, 'Error al enviar código'));
    } finally {
      setIsOtpSending(false);
    }
  };

  const handleOtpInput = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    setOtpError(null);

    if (value && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedData = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pastedData.length === 0) return;

    event.preventDefault();

    const newDigits = pastedData.split('').concat(EMPTY_OTP_DIGITS).slice(0, OTP_LENGTH);
    setOtpDigits(newDigits);

    const nextEmpty = newDigits.findIndex((digit) => digit === '');
    const focusIndex = nextEmpty === -1 ? OTP_LENGTH - 1 : nextEmpty;
    otpInputRefs.current[focusIndex]?.focus();
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtpError(null);
  };

  const handleVerifyOtp = async () => {
    const code = otpDigits.join('');
    if (code.length !== OTP_LENGTH) return;

    setIsOtpVerifying(true);
    setOtpError(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append('identifier', formData.phone.trim());
      formDataObj.append('code', code);
      formDataObj.append('countryPrefix', formData.countryPrefix || '+51');

      const result = await verifyOtpAction(formDataObj);

      if (result.error) {
        setOtpError(result.error);
        return;
      }

      setShowOtpModal(false);
      setOtpError(null);
      onPhoneVerificationChange?.(formData.phone);
    } catch (error: unknown) {
      setOtpError(getErrorMessage(error, 'Error al verificar código'));
    } finally {
      setIsOtpVerifying(false);
    }
  };

  const resendOtp = () => {
    setOtpDigits([...EMPTY_OTP_DIGITS]);
    setOtpError(null);
    void handleRequestOtp();
  };

  return {
    closeOtpModal,
    handleOtpInput,
    handleOtpKeyDown,
    handleOtpPaste,
    handlePhoneChange,
    handleRequestOtp,
    handleVerifyOtp,
    isOtpSending,
    isOtpVerifying,
    isVerified,
    otpDigits,
    otpError,
    otpInputRefs,
    resendOtp,
    showOtpModal,
  };
}
