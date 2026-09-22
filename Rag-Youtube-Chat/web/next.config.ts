import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // faiss-node is a native addon: load it with Node's require instead of bundling it.
  serverExternalPackages: ["faiss-node"],
};

export default nextConfig;
