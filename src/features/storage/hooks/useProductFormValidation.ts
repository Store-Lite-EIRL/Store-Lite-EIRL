import { useState } from 'react';
import {
  MAX_NAME_LENGTH,
  MIN_NAME_LENGTH,
  type FormErrors,
  type FormState,
} from '../components/createProduct/types';
import { parsePriceValue } from '../utils/currency';

export const useProductFormValidation = () => {
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (form: FormState): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) newErrors.name = 'El nombre es obligatorio';
    else if (form.name.trim().length < MIN_NAME_LENGTH)
      newErrors.name = `Mínimo ${MIN_NAME_LENGTH} caracteres`;
    else if (form.name.trim().length > MAX_NAME_LENGTH)
      newErrors.name = `Máximo ${MAX_NAME_LENGTH} caracteres`;

    // Description length is handled by input, but could be validated here if needed

    if (!form.category.trim()) newErrors.category = 'La categoría es obligatoria';

    const stockNum = parseInt(form.stock, 10);
    if (!form.stock.trim()) newErrors.stock = 'El stock es obligatorio';
    else if (isNaN(stockNum) || stockNum < 0) newErrors.stock = 'Número válido (≥ 0)';

    const priceNum = parsePriceValue(form.price);
    if (!form.price.trim()) newErrors.price = 'El precio es obligatorio';
    else if (priceNum <= 0) newErrors.price = 'Precio válido (> 0)';

    if (!form.status) newErrors.status = 'Selecciona un estado';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (key: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [key]: undefined }));

  return { errors, setErrors, validate, clearError };
};
