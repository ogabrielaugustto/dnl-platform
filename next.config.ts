import type { NextConfig } from "next";

const remoteBaseUrl = process.env.R2_PUBLIC_BASE_URL;
const remoteUrl = remoteBaseUrl ? new URL(remoteBaseUrl) : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: remoteUrl
      ? [
          {
            protocol: remoteUrl.protocol.replace(":", "") as "http" | "https",
            hostname: remoteUrl.hostname,
            port: remoteUrl.port,
            pathname: `${remoteUrl.pathname.replace(/\/$/, "") || ""}/**`,
          },
        ]
      : [],
  },
};

export default nextConfig;
