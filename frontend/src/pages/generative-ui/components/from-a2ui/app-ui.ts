/** "Convert a custom catalog" — the Vue tab's "After", verbatim. */
import { z } from "zod";
import { createGenerativeUI, standardUI } from "@copilotkit/vue/v2/generative-ui";
import Airport from "./Airport.vue";
import Arrow from "./Arrow.vue";

export const appUI = createGenerativeUI({
  id: "acme/flights@1",
  extends: [standardUI],
  components: {
    Airport: {
      component: Airport,
      description: "An airport by IATA code, with its city under it.",
      props: z.object({ code: z.string(), city: z.string() }),
    },
    Arrow: { component: Arrow, description: "An arrow between two airports." },
  },
});
