import type { NextConfig } from "next";


// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',          // vide = tous les ports
        pathname: '/**',   // autorise tous les chemins sur ce domaine
      },
      // Tu peux ajouter d'autres domaines si besoin plus tard
      // {
      //   protocol: 'https',
      //   hostname: 'exemple.com',
      //   pathname: '/images/**',
      // },
    ],
  },
}

module.exports = nextConfig

export default nextConfig;
