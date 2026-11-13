/**
 * The page imports `useCartStore` from "./cart-store" without publishing it
 * (it reads like Pinia). A module-level reactive object is the smallest stand-in.
 */
import { reactive } from "vue";

interface CartLine {
  productId: string;
  quantity: number;
}

interface Cart {
  items: CartLine[];
  addItem(productId: string, quantity?: number): void;
  readonly count: number;
}

const cart: Cart = reactive({
  items: [] as CartLine[],
  addItem(productId: string, quantity = 1) {
    const line = cart.items.find((i: CartLine) => i.productId === productId);
    if (line) line.quantity += quantity;
    else cart.items.push({ productId, quantity });
  },
  get count(): number {
    return cart.items.reduce((n: number, i: CartLine) => n + i.quantity, 0);
  },
});

export const useCartStore = () => cart;
