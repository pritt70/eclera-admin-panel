import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      { source: "/products", destination: "/product" },
      { source: "/customers", destination: "/customer" },
      { source: "/discounts", destination: "/discount" },
      { source: "/categories", destination: "/category" },
      { source: "/orders", destination: "/order" },
      { source: "/specification", destination: "/specifications" },
      { source: "/collection", destination: "/collections" },
      { source: "/abandoned-carts", destination: "/abandoned-cart" },
      { source: "/announcements", destination: "/announcement" },
      { source: "/banners", destination: "/banner" },
      { source: "/policies", destination: "/policy" },
      { source: "/shippings", destination: "/shipping" },
    ];
  },
};

export default nextConfig;
