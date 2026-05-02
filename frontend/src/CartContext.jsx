import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext({
  cartItems: [],
  recentViews: [],
  totalItems: 0,
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  addRecentView: () => {},
});

const STORAGE_CART_KEY = 'multivasta-cart';
const STORAGE_RECENT_KEY = 'multivasta-recent';

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_CART_KEY)) || [];
    } catch {
      return [];
    }
  });

  const [recentViews, setRecentViews] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_RECENT_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_RECENT_KEY, JSON.stringify(recentViews));
  }, [recentViews]);

  const addToCart = (product) => {
    setCartItems((previous) => {
      const existing = previous.find((item) => item._id === product._id);
      if (existing) {
        return previous.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...previous, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((previous) => previous.filter((item) => item._id !== productId));
  };

  const clearCart = () => setCartItems([]);

  const addRecentView = (product) => {
    setRecentViews((previous) => {
      const existing = previous.find((item) => item._id === product._id);
      const next = existing
        ? previous.filter((item) => item._id !== product._id)
        : previous;
      return [product, ...next].slice(0, 4);
    });
  };

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        recentViews,
        totalItems,
        addToCart,
        removeFromCart,
        clearCart,
        addRecentView,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
