/// <reference types="vite/client" />
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, any>;
  export default component;
}
interface ImportMetaEnv {
  readonly VITE_RUNTIME_ORIGIN?: string;
  readonly VITE_COPILOTKIT_INSPECTOR?: string;
}
