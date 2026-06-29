/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

// CSP применяем только в проде: строгий script-src ломает dev-HMR (eval/ws).
// script/style 'unsafe-inline' — прагматичный компромисс (App Router инлайнит
// скрипты; без nonce-мидлвари иначе никак). Остальные директивы реально режут
// векторы: framing, base-tag hijack, form-exfil, плагины, левые источники.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.posthog.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://i.pravatar.cc https://images.unsplash.com https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.posthog.com https://*.supabase.co",
  "frame-src https://meet.jit.si",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

// Заголовки, безопасные и в dev, и в prod.
const baseHeaders = [
  { key: "X-Frame-Options", value: "DENY" }, // антикликджекинг
  { key: "X-Content-Type-Options", value: "nosniff" }, // не угадывать MIME
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

// Только прод (на http-localhost бессмысленны/вредны).
const prodHeaders = isProd
  ? [
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "Content-Security-Policy", value: csp },
    ]
  : [];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // не светим "X-Powered-By: Next.js"
  // Аватары/фото тюторов на старте — внешние демо-картинки.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: [...baseHeaders, ...prodHeaders] }];
  },
};

export default nextConfig;
