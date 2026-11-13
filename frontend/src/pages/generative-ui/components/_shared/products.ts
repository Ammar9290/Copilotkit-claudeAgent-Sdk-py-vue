/**
 * NOT DOC CODE. The shop's products, for the page's own fallback row
 * (Surfaces: `<ProductRow :products="products" />`). The pages import a
 * `Product` type and product list without publishing them.
 *
 * The agent gets the same list from the backend tool `get_products`
 * (backend/src/agents/routes/section_b.py), which is what ProductCard's
 * "Copy every value from a product of a tool result" refers to. Images are
 * served by the agent server through Vite's `/agent` proxy.
 */
export interface Product {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
}

const img = (id: string) => `/agent/section-b/products/${id}.svg`;

export const PRODUCTS: Product[] = [
  { productId: "kb-01", name: "Mechanical Keyboard", price: 129, imageUrl: img("kb-01") },
  { productId: "ms-02", name: "Wireless Mouse", price: 49, imageUrl: img("ms-02") },
  { productId: "hd-03", name: "Noise-cancelling Headphones", price: 249, imageUrl: img("hd-03") },
  { productId: "mn-04", name: "4K Monitor", price: 399, imageUrl: img("mn-04") },
];
