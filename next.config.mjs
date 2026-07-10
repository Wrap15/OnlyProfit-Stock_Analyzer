/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracing: process.platform === 'win32' && !process.env.VERCEL ? false : true,
};

export default nextConfig;
