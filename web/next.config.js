/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // matches the Vite app: maps markers break under StrictMode double-mount
  images: {
    // Listing images are stored on Cloudinary (absolute URLs).
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },
};

module.exports = nextConfig;
