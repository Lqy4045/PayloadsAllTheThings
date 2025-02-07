import { $t } from "@/plugins/i18n";

export default {
  path: "/test",
  redirect: "/test/index",
  meta: {
    icon: "ri:information-line",
    // showLink: false,
    title: $t("menus.pureAbnormal"),
    rank: 9
  },
  children: [
    {
      path: "/test/index",
      name: "Test",
      component: () => import("@/views/tests/index.vue"),
      meta: {
        title: "408"
      }
    },
    {
      path: "/test/detail/:id",
      name: "Test1",
      component: () => import("@/views/error/403.vue"),
      meta: {
        showLink: false,
        title: "404"
      }
    }
  ]
} satisfies RouteConfigsTable;
