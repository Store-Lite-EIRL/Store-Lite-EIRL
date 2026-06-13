export interface SaveProductPayload {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  status: string;
  brand?: string;
  tags?: string[];
  shippingInfo?: string;
  secondPrice?: number;
  saleStatus?: string;
  metadata?: Record<string, unknown> | null;
}

export type SaveProductMediaItem =
  | { type: 'url'; url: string }
  | { type: 'file'; file: File; preview: string };
