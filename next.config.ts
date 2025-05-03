import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  eslint: {
    // ADVERTENCIA: Esto desactivará la verificación de ESLint durante 'next build'.
    // No se recomienda para producción final. Asegúrate de arreglar los errores de ESLint eventualmente.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
