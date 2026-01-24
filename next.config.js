// const createNextIntlPlugin = require('next-intl/plugin');
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
// });

// const withNextIntl = createNextIntlPlugin();

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
// };

// module.exports = withPWA(withNextIntl(nextConfig));

const createNextIntlPlugin = require('next-intl/plugin');
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      // Редирект с http и без www на https + www
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'souldestiny.app', // без www
          },
        ],
        destination: 'https://www.souldestiny.app/:path*',
        permanent: true,
      },
      // (опционально) если Vercel каким-то образом пропускает http:
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://www.souldestiny.app/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = withPWA(withNextIntl(nextConfig));
