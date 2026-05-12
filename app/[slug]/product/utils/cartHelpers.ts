import type { Product } from '../../storage/data';

interface CartProductInput {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: string;
  currency: string;
  image: string;
  images?: string[];
  description?: string;
  /** Si se omite, se deriva de `stock > 0` */
  status?: string;
}

/** Construye un objeto Product listo para `toggleCartItem()` o `addToCart()` */
export function toCartProduct(input: CartProductInput): Product {
  return {
    id: input.id,
    name: input.name,
    category: input.category,
    stock: input.stock,
    price: input.price,
    currency: input.currency,
    status: input.status ?? (input.stock > 0 ? 'ACTIVO' : 'NO ACTIVO'),
    image: input.image,
    images: input.images,
    description: input.description,
  };
}
