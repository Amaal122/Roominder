import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '172.20.32.1',
    '192.168.56.1',
  ],
};

export default nextConfig;
