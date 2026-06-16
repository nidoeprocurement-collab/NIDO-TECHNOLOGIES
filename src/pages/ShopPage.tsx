import { useState } from "react";
import { Search, ShoppingCart, Heart, Star } from "lucide-react";

const MOCK_PRODUCTS = [
  {
    id: "prod_001",
    name: "Laptop Computer",
    category: "IT Hardware",
    price: 899,
    rating: 4.5,
    reviews: 24,
    image: "🖥️",
  },
  {
    id: "prod_002",
    name: "Office Desk",
    category: "Furniture",
    price: 299,
    rating: 4.2,
    reviews: 18,
    image: "🪑",
  },
  {
    id: "prod_003",
    name: "Printer",
    category: "Office Equipment",
    price: 349,
    rating: 4.7,
    reviews: 32,
    image: "🖨️",
  },
  {
    id: "prod_004",
    name: "Monitor 27 inch",
    category: "IT Hardware",
    price: 299,
    rating: 4.4,
    reviews: 45,
    image: "📺",
  },
  {
    id: "prod_005",
    name: "Keyboard & Mouse",
    category: "Peripherals",
    price: 79,
    rating: 4.3,
    reviews: 56,
    image: "⌨️",
  },
  {
    id: "prod_006",
    name: "Webcam HD",
    category: "Peripherals",
    price: 99,
    rating: 4.6,
    reviews: 38,
    image: "📷",
  },
];

export default function ShopPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cart, setCart] = useState<string[]>([]);

  const categories = ["all", ...new Set(MOCK_PRODUCTS.map((p) => p.category))];

  const filtered = MOCK_PRODUCTS.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const addToCart = (id: string) => {
    setCart([...cart, id]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Shop / Products</p>
            <h1 className="text-2xl font-bold">Product Shop</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
              <ShoppingCart size={18} />
              <span>{cart.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                  categoryFilter === cat
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {cat === "all" ? "All Products" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg border hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Product Image */}
              <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-5xl">
                {product.image}
              </div>

              {/* Product Info */}
              <div className="p-6">
                <p className="text-xs text-gray-500 mb-1">{product.category}</p>
                <h3 className="font-semibold text-lg mb-2">{product.name}</h3>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>

                {/* Price and Actions */}
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold">${product.price}</p>
                  <button
                    onClick={() => addToCart(product.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <ShoppingCart size={18} />
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}
