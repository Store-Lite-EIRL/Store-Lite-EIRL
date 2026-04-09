// Shared types and constants for the Create Product Sheet feature

export interface FormState {
  name: string;
  category: string;
  newCategoryInput: string;
  stock: string;
  price: string;
  status: string;
  description: string;
  shippingInfo: string;
  brand: string;
  tags: string[];
  secondPrice: string;
  saleStatus: string;
  seoTitle: string;
  seoDescription: string;
}

export interface FormErrors {
  name?: string;
  category?: string;
  stock?: string;
  price?: string;
  status?: string;
  images?: string;
}

export interface StatusOption {
  value: string;
  label: string;
  desc: string;
  color: string;
}

export const MAX_IMAGES = 3;
export const MIN_NAME_LENGTH = 3;
export const MAX_NAME_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 350;

export const STATUSES: StatusOption[] = [
  { value: 'ACTIVO', label: 'Activo', desc: 'Producto visible y disponible', color: '#1a7a4a' },
  { value: 'NO ACTIVO', label: 'No Activo', desc: 'Producto oculto temporalmente', color: '#777' },
];

export const EMPTY_FORM: FormState = {
  name: '',
  category: '',
  newCategoryInput: '',
  stock: '',
  price: '',
  status: '',
  description: '',
  shippingInfo: '',
  brand: '',
  tags: [],
  secondPrice: '',
  saleStatus: 'NORMAL',
  seoTitle: '',
  seoDescription: '',
};

export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+U2luIGltYWdlbjwvdGV4dD48L3N2Zz4=';
