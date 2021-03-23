import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const isProductInCart = cart.find((item) => item.id === productId);

      const isProductInStock = await api
        .get<Stock>(`/stock/${productId}`)
        .then((response) => response.data);

      if (isProductInCart && isProductInStock) {
        if (isProductInCart.amount >= isProductInStock.amount) {
          toast.error("Quantidade solicitada fora de estoque");
        } else {
          updateProductAmount({
            productId,
            amount: isProductInCart.amount + 1,
          });
        }
      }

      if (!isProductInCart && isProductInStock) {
        const newCartProduct: Product = await api
          .get(`/products/${productId}`)
          .then((response) => response.data);

        setCart([...cart, { ...newCartProduct, amount: 1 }]);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify([...cart, { ...newCartProduct, amount: 1 }])
        );
      }
    } catch {
      // TODO
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const product = cart.find((item) => item.id === productId);

      if (product) {
        const productIndex = cart.findIndex((item) => productId === item.id);

        cart.splice(productIndex, 1);

        setCart([...cart]);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify([...cart]));
      } else {
        throw new Error("Product does not exists");
      }
    } catch {
      // TODO
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      const isProductInStock = await api
        .get(`/stock/${productId}`)
        .then<Stock>((response) => response.data);

      if (amount < 1) {
        return;
      }

      if (isProductInStock) {
        if (amount > isProductInStock.amount) {
          toast.error("Quantidade solicitada fora de estoque");
        } else {
          const updatedCart = cart.map((item) => {
            if (item.id === productId) {
              item.amount = amount;
              return item;
            }
            return item;
          });

          setCart(updatedCart);
          localStorage.setItem(
            "@RocketShoes:cart",
            JSON.stringify(updatedCart)
          );
        }
      }
    } catch {
      // TODO
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
