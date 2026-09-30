import type { NextConfig } from "next";

// Alamat server Go. Bisa diganti lewat env GO_API_URL kalau port/host berbeda.
const GO_API_URL = process.env.GO_API_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Frontend memanggil /api/... lalu diteruskan ke Go, jadi tidak kena CORS
        source: "/api/:path*",
        destination: `${GO_API_URL}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${GO_API_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;