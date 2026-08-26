import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useI18n } from '@/i18n/I18nProvider';
import { formatCurrency } from '@/lib/formatters';

export default function FloatingCartButton() {
  const navigate = useNavigate();
  const { items } = useCart();
  useI18n();

  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.priceNum || 0) * item.quantity, 0);

  if (totalQty === 0) return null;

  return (
    <button
      onClick={() => navigate('/shop/cart')}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#1a2340] hover:bg-[#222d4a] text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/30 transition-colors"
      title="View Cart"
    >
      {/* Cart icon with count badge */}
      <div className="relative">
        <ShoppingCart size={22} strokeWidth={1.8} />
        <span className="absolute -top-2.5 -right-2.5 bg-blue-500 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none border-2 border-[#1a2340]">
          {totalQty > 99 ? '99+' : totalQty}
        </span>
      </div>

      {/* Text block */}
      <div className="flex flex-col items-start leading-none">
        <span className="text-[13px] font-semibold tracking-wide">Cart</span>
        <span className="text-[11px] font-medium text-blue-200 mt-0.5">
          {formatCurrency(totalPrice)}
        </span>
      </div>
    </button>
  );
}
