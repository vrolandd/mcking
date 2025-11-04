import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [index("routes/home.tsx"), route("/checkout", "routes/checkout.tsx"), route("/order/:id", "routes/order.tsx"), route("/auth", "routes/auth.tsx"), route("/admin", "routes/admin.tsx"), route("/worker", "routes/worker.tsx")] satisfies RouteConfig;
