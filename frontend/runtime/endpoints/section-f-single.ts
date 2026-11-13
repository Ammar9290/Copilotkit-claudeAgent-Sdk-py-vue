/**
 * Runtime HTTP endpoints — "Single-route mode": `/api/copilotkit-section-f-single`.
 *
 * The same runtime instance as `/api/copilotkit-section-f-runtime`, mounted a
 * second time with `mode: "single-route"`. In this mode the runtime answers one
 * `POST {basePath}` taking a `{ method, params, body }` envelope. The Vue
 * provider is pointed at the base URL with `use-single-endpoint` omitted, so it
 * has to discover the transport from runtime info, as the page says.
 */
import { sectionFRuntime } from "./section-f-runtime";

export default {
  basePath: "/api/copilotkit-section-f-single",
  runtime: sectionFRuntime,
  options: { mode: "single-route" },
};
