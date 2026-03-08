'use client';

import '@/styles/components/SteppedSheet.css';
import React, { useState } from 'react';
import { Button } from '../buttons/Button';
import { IconButton } from '../buttons/IconButton';
import { Icon } from '../data-display/Icon';

interface SteppedSheetProps {
  id?: string;
  title?: string;
  children: React.ReactNode;
  onFinish?: () => void;
  className?: string;
}

export const SteppedSheet = ({
  id,
  title = 'Proceso',
  children,
  onFinish,
  className = '',
}: SteppedSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = React.Children.toArray(children);
  const totalSteps = steps.length;

  const show = () => {
    setIsOpen(true);
    setCurrentStep(0); // Reset to first step on show
  };

  const close = () => {
    setIsOpen(false);
  };

  const next = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (onFinish) {
        onFinish();
      }
      close();
    }
  };

  const back = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Expose imperative methods
  const rootRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (rootRef.current) {
      const node = rootRef.current as HTMLDivElement & { show: () => void; close: () => void };
      node.show = show;
      node.close = close;
    }
  }, []);

  return (
    <>
      <div className={`md-sheet-scrim md-stepped-sheet-scrim ${isOpen ? 'open' : ''}`} />
      <div
        ref={rootRef}
        id={id}
        className={`md-sheet md-stepped-sheet md-sheet--right ${isOpen ? 'open' : ''} ${className}`}
      >
        <div className="md-stepped-sheet__header">
          {currentStep > 0 ? (
            <IconButton onClick={back}>
              <Icon>arrow_back</Icon>
            </IconButton>
          ) : (
            <div />
          )}
          <h2 className="md-stepped-sheet__title">{title}</h2>
          <IconButton onClick={close}>
            <Icon>close</Icon>
          </IconButton>
        </div>

        <div className="md-stepped-sheet__content">
          {steps.length > currentStep && steps[currentStep]}
        </div>

        <div className="md-stepped-sheet__footer">
          <span className="md-stepped-sheet__progress">
            Paso {currentStep + 1} de {totalSteps}
          </span>
          <div className="md-stepped-sheet__actions">
            {currentStep === totalSteps - 1 ? (
              <>
                <Button variant="text" onClick={close}>
                  Cancelar
                </Button>
                <Button variant="filled" onClick={next}>
                  Aceptar
                </Button>
              </>
            ) : (
              <Button variant="filled" onClick={next}>
                Siguiente
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
