import { CreditCard, Info, MessageSquare, Package, ShoppingCart } from 'lucide-react';
import type { ReactNode } from 'react';

export function getCategoryIcon(category: string, size = 18): ReactNode {
  switch (category) {
    case 'chat':
      return <MessageSquare size={size} />;
    case 'almacen':
      return <Package size={size} />;
    case 'plan':
      return <CreditCard size={size} />;
    case 'pedidos':
      return <ShoppingCart size={size} />;
    default:
      return <Info size={size} />;
  }
}
