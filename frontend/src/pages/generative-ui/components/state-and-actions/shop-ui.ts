/**
 * `src/shop-ui.ts` from State and actions (Vue tab). The page shows the
 * catalog as separate snippets, one per section; they are merged here into
 * one catalog:
 *   - "Show live app state": `state: { cart }` + `bind.inCart`
 *   - "Run your code on a click": `functions.addToCart` + `events.onAddToCart`
 *   - "Keep what the user types": `CheckoutForm` with `writable: ["email"]`
 *   - "Send a click to the agent": an event that matches no function
 *     (`onChoose` with `parameters`), on a PlanButton (markup is ours).
 * As on the page, the catalog does not extend `standardUI`.
 */
import { z } from "zod";
import { createGenerativeUI } from "@copilotkit/vue/v2/generative-ui";
import CheckoutForm from "./CheckoutForm.vue";
import PlanButton from "./PlanButton.vue";
import ProductCard from "./ProductCard.vue";

const cartSchema = z.object({
  items: z.array(z.object({ productId: z.string(), quantity: z.number() })),
});

export const shopUI = createGenerativeUI({
  id: "acme/shop@1",
  state: { cart: cartSchema },
  functions: {
    addToCart: {
      description: "Add a product to the cart",
      parameters: z.object({ productId: z.string(), quantity: z.number().default(1) }),
    },
  },
  components: {
    ProductCard: {
      component: ProductCard,
      props: z.object({ productId: z.string(), name: z.string(), inCart: z.number() }),
      bind: {
        inCart: (state, { productId }) =>
          state.cart.items.find((item) => item.productId === productId)?.quantity ?? 0,
      },
      events: { onAddToCart: {} },
    },
    CheckoutForm: {
      component: CheckoutForm,
      props: z.object({ email: z.string().optional() }),
      writable: ["email"],
    },
    PlanButton: {
      component: PlanButton,
      description: "A button that asks for one pricing plan.",
      props: z.object({ plan: z.string() }),
      events: {
        onChoose: {
          description: "The user picked a plan",
          parameters: z.object({ plan: z.string() }),
        },
      },
    },
  },
});
