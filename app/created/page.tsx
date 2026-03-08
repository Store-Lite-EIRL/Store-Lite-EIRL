/* eslint-disable max-lines-per-function */
'use client';

import { Button, Icon } from '@/shared/components/ui';
import { CircularProgress } from '@/shared/components/ui/feedback';
import { AlertSnackbar } from '@/shared/components/ui/feedback/AlertSnackbar';
import { optimizeImage } from '@/shared/utils/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { checkUserHasBusinessesAction, createBusinessAction } from './actions';
import { BusinessForm } from './components/BusinessForm';
import { BusinessPreview } from './components/BusinessPreview';

import { SOUTH_AMERICAN_COUNTRIES } from './constants';
import type { BusinessData, FormErrors } from './types';

export default function CreatedPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasBusinesses, setHasBusinesses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<BusinessData>({
    personType: 'natural',
    country: 'Perú',
    countryPrefix: '+51',
    taxId: '10456789231',
    commercialName: 'EA Tech Solutions',
    logo: null,
    sector: 'Servicios',
    description:
      'Empresa dedicada al desarrollo de aplicaciones web modernas, mantenimiento de APIs y servicios de infraestructura en la nube utilizando TypeScript y prácticas DevOps.',
    address: 'Av. Javier Prado Este 1234, Oficina 502',
    city: 'Lima',
    phone: '',
    email: 'contacto@eatech.pe',
    legalRepName: 'Ernesto Alonso García',
    legalRepRole: 'Gerente General',
    legalRepPhone: '',
    legalRepEmail: 'gerente@eatech.pe',
  });

  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    color: 'error' | 'success' | 'warning' | 'primary';
  }>({
    open: false,
    message: '',
    color: 'primary',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Check if user has businesses (loading state)
  useEffect(() => {
    setMounted(true);

    checkUserHasBusinessesAction()
      .then((result) => {
        if (result.hasBusinesses) {
          setHasBusinesses(true);
        }
      })
      .catch((err) => {
        console.error('Error checking businesses:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleChange = (field: keyof BusinessData, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Handle country change to update prefix
      if (field === 'country') {
        const countryData = SOUTH_AMERICAN_COUNTRIES.find((c) => c.name === value);
        if (countryData) {
          newData.countryPrefix = countryData.prefix;
        }
      }

      return newData;
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newEntries = Object.entries(prev).filter(([key]) => key !== field);
        return Object.fromEntries(newEntries) as FormErrors;
      });
    }
  };

  const handleFileChange = (file: File | null) => {
    if (file && file.size > 1024 * 1024) {
      setAlert({
        open: true,
        message: 'La imagen no debe pesar más de 1MB.',
        color: 'error',
      });
      return;
    }

    setFormData((prev) => {
      return { ...prev, logo: file };
    });

    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    } else {
      setLogoPreview(null);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    const phoneRegex = /^\+?[1-9]\d{1,14}$/;

    switch (step) {
      case 0:
        if (!formData.commercialName || formData.commercialName.length < 3) {
          newErrors.commercialName = 'El nombre comercial debe tener al menos 3 caracteres.';
          isValid = false;
        }
        if (!formData.taxId) {
          newErrors.taxId = 'El RUC/NIT es obligatorio.';
          isValid = false;
        } else if (formData.personType === 'natural' && formData.taxId.length !== 11) {
          newErrors.taxId = 'El RUC de persona natural debe tener 11 dígitos.';
          isValid = false;
        } else if (
          formData.personType === 'juridica' &&
          (formData.taxId.length < 11 || formData.taxId.length > 20)
        ) {
          newErrors.taxId = 'El RUC de persona jurídica debe tener entre 11 y 20 dígitos.';
          isValid = false;
        }
        break;
      case 1:
        if (!formData.sector) {
          newErrors.sector = 'El sector es obligatorio.';
          isValid = false;
        }
        if (!formData.description || formData.description.length < 10) {
          newErrors.description = 'La descripción debe tener al menos 10 caracteres.';
          isValid = false;
        }
        break;
      case 2:
        if (!formData.city) {
          newErrors.city = 'La ciudad es obligatoria.';
          isValid = false;
        }
        if (!formData.address) {
          newErrors.address = 'La dirección es obligatoria.';
          isValid = false;
        }
        if (!formData.email || !formData.email.includes('@')) {
          newErrors.email = 'Email institucional inválido.';
          isValid = false;
        }
        if (!formData.phone) {
          newErrors.phone = 'El teléfono es obligatorio.';
          isValid = false;
        } else if (!phoneRegex.test(formData.phone)) {
          newErrors.phone = 'Formato de teléfono inválido (9-15 dígitos).';
          isValid = false;
        }
        break;
      case 3:
        if (!formData.legalRepName) {
          newErrors.legalRepName = 'El nombre del representante es obligatorio.';
          isValid = false;
        }
        if (!formData.legalRepRole) {
          newErrors.legalRepRole = 'El cargo del representante es obligatorio.';
          isValid = false;
        }
        if (!formData.legalRepPhone) {
          newErrors.legalRepPhone = 'El celular del representante es obligatorio.';
          isValid = false;
        } else if (!phoneRegex.test(formData.legalRepPhone)) {
          newErrors.legalRepPhone = 'Formato de celular inválido.';
          isValid = false;
        }
        if (!formData.legalRepEmail || !formData.legalRepEmail.includes('@')) {
          newErrors.legalRepEmail = 'Email del representante inválido.';
          isValid = false;
        }
        break;
    }

    setErrors(newErrors);
    return isValid;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => {
        return prev + 1;
      });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => {
      return prev - 1;
    });
  };

  const handleFinish = async () => {
    if (validateStep(currentStep)) {
      setIsSubmitting(true);
      try {
        const formDataToSubmit = new FormData();

        // Append all fields from formData
        Object.entries(formData).forEach(([key, value]) => {
          if (key !== 'logo' && value !== null) {
            formDataToSubmit.append(key, value.toString());
          }
        });

        // Handle the logo file specially with optimization
        if (formData.logo) {
          try {
            const optimizedLogo = await optimizeImage(formData.logo);
            formDataToSubmit.append('logo', optimizedLogo);
          } catch (error) {
            console.error('Error optimizing logo:', error);
            // Fallback to original logo if optimization fails
            formDataToSubmit.append('logo', formData.logo);
          }
        }

        const result = await createBusinessAction(formDataToSubmit);

        if (result.error) {
          setAlert({
            open: true,
            message: `Error: ${result.error}`,
            color: 'error',
          });
          setIsSubmitting(false);
        } else if (result.success) {
          // Use window.location for hard redirect to the list business page
          window.location.href = '/list-business';
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        setAlert({
          open: true,
          message: 'Ocurrió un error inesperado al crear la empresa.',
          color: 'error',
        });
        setIsSubmitting(false);
      }
    }
  };

  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <main
        className="min-h-screen flex-justify-center flex-align-center"
        style={{
          height: '100vh',
          width: '100vw',
          backgroundColor: 'var(--md-sys-color-surface)',
        }}
      >
        <CircularProgress indeterminate />
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex-mobile"
      style={{
        overflow: 'hidden',
        gap: 0,
        height: '100vh',
        width: '100vw',
      }}
    >
      {/* Exit Button - Only shown if user has businesses */}
      {hasBusinesses && (
        <Button
          variant="text"
          onClick={() => router.push('/list-business')}
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            zIndex: 1000,
            minWidth: '64px',
            width: '64px',
            height: '64px',
            padding: 0,
            borderRadius: '50%',
          }}
        >
          <Icon style={{ fontSize: '32px', paddingRight: 10 }}>close</Icon>
        </Button>
      )}

      {/* Left Column: Form */}
      <div
        className="flex-1 flex-column flex-justify-center page-container"
        style={{
          backgroundColor: 'var(--md-sys-color-surface)',
          overflow: 'hidden',
          padding: '40px',
        }}
      >
        <div
          className="slide-container"
          style={{
            maxWidth: '480px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          <div className="slide-track" style={{ transform: `translateX(-${currentStep * 100}%)` }}>
            {/* Steps remain same... */}
            <div className={`slide-step ${currentStep !== 0 ? 'inactive' : ''}`}>
              <BusinessForm
                stepNumber={1}
                title="Datos Generales"
                onNext={nextStep}
                formData={formData}
                onChange={handleChange}
                onFileChange={handleFileChange}
                errors={errors}
                isSubmitting={isSubmitting}
              />
            </div>

            <div className={`slide-step ${currentStep !== 1 ? 'inactive' : ''}`}>
              <BusinessForm
                stepNumber={2}
                title="Actividad Económica"
                onNext={nextStep}
                onBack={prevStep}
                formData={formData}
                onChange={handleChange}
                errors={errors}
                isSubmitting={isSubmitting}
              />
            </div>

            <div className={`slide-step ${currentStep !== 2 ? 'inactive' : ''}`}>
              <BusinessForm
                stepNumber={3}
                title="Ubicación y Contacto"
                onNext={nextStep}
                onBack={prevStep}
                formData={formData}
                onChange={handleChange}
                errors={errors}
                isSubmitting={isSubmitting}
              />
            </div>

            <div className={`slide-step ${currentStep !== 3 ? 'inactive' : ''}`}>
              <BusinessForm
                stepNumber={4}
                title="Representante Legal"
                onNext={handleFinish}
                onBack={prevStep}
                isLastStep
                formData={formData}
                onChange={handleChange}
                errors={errors}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Dynamic Preview */}
      <div
        className="flex-justify-center flex-align-center show-tablet-desktop"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-variant)',
          height: '100vh',
          overflow: 'visible',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
        }}
      >
        <BusinessPreview formData={formData} logoPreview={logoPreview} />
      </div>

      <AlertSnackbar
        open={alert.open}
        description={alert.message}
        color={alert.color}
        onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
      />
    </main>
  );
}
