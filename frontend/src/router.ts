import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { ALL_ROUTES } from "./lib/nav-config";
import NotesPage from "./pages/NotesPage.vue";

/**
 * One notes route and (where a demo exists) one `/demo-chat` route per doc page.
 *
 * Demos live at `src/pages<path>/Demo.vue`. A page that needs more than the
 * generic notes layout ships its own `Notes.vue` beside it.
 */
const demos = import.meta.glob("./pages/**/Demo.vue");
const customNotes = import.meta.glob("./pages/**/Notes.vue");

const file = (path: string, name: string) => `./pages${path === "/" ? "" : path}/${name}`;

const routes: RouteRecordRaw[] = [
  { path: "/", component: () => import("./pages/Home.vue") },
  { path: "/status", component: () => import("./pages/Status.vue") },
];

for (const route of ALL_ROUTES) {
  if (route.path === "/") continue;
  const notes = customNotes[file(route.path, "Notes.vue")];
  routes.push(
    notes
      ? { path: route.path, component: notes }
      : {
          path: route.path,
          component: NotesPage,
          props: { path: route.path, showHealth: route.path === "/quickstart" },
        },
  );
  const demo = demos[file(route.path, "Demo.vue")];
  if (route.hasDemo && demo) routes.push({ path: `${route.path}/demo-chat`, component: demo });
}

routes.push({ path: "/:pathMatch(.*)*", component: () => import("./pages/NotFound.vue") });

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});
