/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Аватары/фото тюторов на старте — внешние демо-картинки.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // legacy/ — старая vanilla-реализация, не часть сборки Next.
  outputFileTracingExcludes: {
    "*": ["./legacy/**/*"],
  },
};

export default nextConfig;
