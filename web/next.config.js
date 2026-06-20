/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

// In development the API runs on http://localhost:5000 (a different origin from
// the Next dev server), so a plain `https:`-only connect-src would block every
// login/listing/map XHR. Allow local http/ws origins in dev only; production
// stays locked to https/wss.
const connectSrc = isDev
  ? "connect-src 'self' https: wss: http://localhost:* ws://localhost:*"
  : "connect-src 'self' https: wss:";

// Defense-in-depth HTTP security headers applied to every response.
// Script/style are kept permissive enough for Google Maps + CKEditor, while the
// genuinely safe-to-lock directives (framing, base-uri, object/form targets,
// MIME sniffing) are hardened. The blog stored-XSS sink is already closed at the
// API (server-side HTML sanitisation); this CSP is a second layer.
const ContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.googleapis.com https://*.gstatic.com https://maps.gstatic.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://*.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  connectSrc,
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
  "worker-src 'self' blob:",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  // HSTS only makes sense over real HTTPS; emitting it on http://localhost can
  // poison the browser into forcing https on localhost for other dev projects.
  ...(isDev
    ? []
    : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]),
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig = {
  reactStrictMode: false, // matches the Vite app: maps markers break under StrictMode double-mount
  poweredByHeader: false, // don't advertise the framework
  images: {
    // Listing images are stored on Cloudinary (absolute URLs).
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
