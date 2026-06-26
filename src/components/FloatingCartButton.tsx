import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

export default function FloatingCartButton() {
  const navigate = useNavigate();
  const { items } = useCart();

  const totalQty = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <button
      onClick={() => navigate('/cart')}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-full shadow-lg transition-colors"
      title="View Cart"
    >
      <div className="relative">
        <ShoppingCart size={20} />
        {totalQty > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
            {totalQty > 99 ? '99+' : totalQty}
          </span>
        )}
      </div>
      <span className="text-sm font-semibold">Cart</span>
    </button>
  );
}
