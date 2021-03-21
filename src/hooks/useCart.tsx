import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const responseStock = await api.get(`stock/${productId}`)
      const stock = responseStock.data.amount

      const product = cart.find(product => product.id === productId);

      if(product) {
        if(product.amount < stock) {
          const products = cart.map(product => {
            if(product.id === productId){
              return {
                ...product,
                amount: product.amount + 1,
              }
            } else {
              return product
            }
          });
          setCart(products);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(products));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }

      } else {
        const response = await api.get(`products/${productId}`)
        const product = response.data;
        const products = [...cart, {...product, amount: 1 }]
        setCart(products);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(products));
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find(product => product.id === productId)
      if (product) {
        const product = cart.filter(product => product.id !== productId)
        setCart(product)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(product));
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const responseStock = await api.get(`stock/${productId}`)
      const stock = responseStock.data.amount

      if (amount > stock || amount === 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const products = cart.map(product => {
        if(product.id === productId){
          return {
            ...product,
            amount: amount,
          }
        } else {
          return product
        }
      });

      setCart(products);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(products));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
