/** `src/shop-ui.ts` from the Catalogs page (Vue tab), verbatim. */
import { z } from "zod";
import { createGenerativeUI } from "@copilotkit/vue/v2/generative-ui";
import ProductCard from "./ProductCard.vue";
import ProductGrid from "./ProductGrid.vue";

export const shopUI = createGenerativeUI({
  id: "acme/shop@1",
  components: {
    ProductGrid: {
      component: ProductGrid,
      description: "A grid of products. Put the ids of ProductCard components in children.",
      props: z.object({ title: z.string().optional() }),
      slots: { children: "multiple" },
    },
    ProductCard: {
      component: ProductCard,
      description: "One product. Copy every value from a product of a tool result.",
      props: z.object({ name: z.string(), price: z.number(), imageUrl: z.string() }),
    },
  },
});
