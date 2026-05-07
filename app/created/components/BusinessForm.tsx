import { Button, Icon } from '@/shared/components/ui';
import type { BusinessData, FormErrors } from '../types';
import { Step1General, Step2Economic, Step3Contact, Step4Legal } from './BusinessFormSteps';

interface BusinessFormProps {
  stepNumber: number;
  title: string;
  onNext: () => void;
  onBack?: () => void;
  isLastStep?: boolean;
  formData: BusinessData;
  onChange: (field: keyof BusinessData, value: string) => void;
  onFileChange?: (file: File | null) => void;
  errors: FormErrors;
  isSubmitting?: boolean;
  // NEW: Props for RUC verification state
  isRucVerified?: boolean;
  onRucVerificationChange?: (verified: boolean) => void;
}

export function BusinessForm({
  stepNumber,
  title,
  onNext,
  onBack,
  isLastStep,
  formData,
  onChange,
  onFileChange,
  errors,
  isSubmitting,
  isRucVerified,
  onRucVerificationChange,
}: BusinessFormProps) {
  let buttonText = 'Siguiente';
  if (isSubmitting) {
    buttonText = 'Creando...';
  } else if (isLastStep) {
    buttonText = 'Finalizar';
  }

  let buttonIcon: string | undefined = 'arrow_forward';
  if (isSubmitting) {
    buttonIcon = undefined;
  } else if (isLastStep) {
    buttonIcon = 'check';
  }

  return (
    <div style={{ width: '100%' }}>
      <h1 className="heading-2 " style={{ fontWeight: 400, paddingBottom: 50 }}>
        {stepNumber}. {title}
      </h1>

      <div className="flex-column gap-xl">
        {stepNumber === 1 && (
          <Step1General
            formData={formData}
            onChange={onChange}
            onFileChange={onFileChange}
            errors={errors}
            isRucVerified={isRucVerified} // â† PASS THIS
            onVerificationChange={onRucVerificationChange} // â† PASS THIS
          />
        )}

        {stepNumber === 2 && (
          <Step2Economic formData={formData} onChange={onChange} errors={errors} />
        )}

        {stepNumber === 3 && (
          <Step3Contact
            formData={formData}
            onChange={onChange}
            errors={errors}
            isRucVerified={isRucVerified} // â† PASS THIS
          />
        )}

        {stepNumber === 4 && (
          <Step4Legal
            formData={formData}
            onChange={onChange}
            errors={errors}
            isRucVerified={isRucVerified} // â† PASS THIS
          />
        )}

        <div className={`flex-row ${onBack ? 'flex-justify-between' : 'flex-justify-end'} mt-2xl`}>
          {onBack && (
            <Button
              variant="outlined"
              style={{ borderRadius: '100px', marginRight: 20 }}
              onClick={onBack}
            >
              AtrÃ¡s
            </Button>
          )}

          <Button
            variant="filled"
            className="px-xl"
            style={{ borderRadius: '100px', display: 'flex', alignItems: 'center', gap: 10 }}
            onClick={onNext}
            disabled={isSubmitting}
          >
            {buttonText}
            <Icon slot="icon" style={{ fontSize: 22 }}>
              {buttonIcon}
            </Icon>
          </Button>
        </div>
      </div>
    </div>
  );
}
