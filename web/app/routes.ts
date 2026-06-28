import { index } from "@react-router/dev/routes";
import type { RouteConfig } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    {
        path: "/menu-editor",
        file: "routes/menu-editor.tsx"
    }
] satisfies RouteConfig;
