'use client';

import { useCallback, useState } from 'react';

interface SnackbarFeedback {
  open: boolean;
  description: string;
  color: 'success' | 'error';
  icon: string;
}

export function useSnackbarFeedback() {
  const [feedback, setFeedback] = useState<SnackbarFeedback>({
    open: false,
    description: '',
    color: 'success',
    icon: 'check_circle',
  });

  const showSuccess = useCallback((description: string) => {
    setFeedback({ open: true, description, color: 'success', icon: 'check_circle' });
  }, []);

  const showError = useCallback((description: string) => {
    setFeedback({ open: true, description, color: 'error', icon: 'error' });
  }, []);

  const close = useCallback(() => {
    setFeedback((prev) => ({ ...prev, open: false }));
  }, []);

  return { feedback, showSuccess, showError, close };
}
