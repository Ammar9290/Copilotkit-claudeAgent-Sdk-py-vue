import { createApp } from "vue";
// "Components and surfaces" (Vue tab): the chart and map plugins the standard
// catalog's Chart and Map components need. Registered once, app-wide.
import { GenerativeUIChart } from "@copilotkit/vue/v2/generative-ui/chart";
import { GenerativeUIMap } from "@copilotkit/vue/v2/generative-ui/map";
import App from "./App.vue";
import { router } from "./router";
import "./style.css";
// Quickstart, "Import the styles": once, in the app entry.
import "@copilotkit/vue/styles.css";

createApp(App).use(router).use(GenerativeUIChart).use(GenerativeUIMap).mount("#app");
