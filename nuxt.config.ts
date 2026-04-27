import tailwindcss from '@tailwindcss/vite'
import { SplatPreset } from './app/themes/splat-preset'

export default defineNuxtConfig({
  modules: [
    '@primevue/nuxt-module',
    '@nuxt/icon',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ].filter(Boolean),

  ssr: true,

  devtools: { enabled: true },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/splat-logo.svg' },
        // Served from public/ (copied on postinstall) — avoids Windows /@fsD:… Vite bug with pkg CSS in `css[]`.
        { rel: 'stylesheet', href: '/scalar-api-reference.css' },
      ],
    },
  },

  css: ['~~/app/assets/css/main.css', '~~/app/assets/layout/layout.scss'],

  runtimeConfig: {
    // Server-only
    databaseUrl: process.env.DATABASE_URL || '',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: Number.parseInt(process.env.SMTP_PORT || '587'),
    smtpUser: process.env.SMTP_USER || '',
    smtpPassword: process.env.SMTP_PASSWORD || '',
    smtpFrom: process.env.SMTP_FROM || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    maxmindDbPath: process.env.MAXMIND_DB_PATH || './data/GeoLite2-City.mmdb',
    sentryDsn: process.env.SENTRY_DSN || '',
    csrfSecret: process.env.CSRF_SECRET || '',
    otpPepper: process.env.OTP_PEPPER || '',
    adminEmail: process.env.ADMIN_EMAIL || '',
    proxySchemeEnabled: process.env.PROXY_SCHEME_ENABLED === '1',
    trustedProxies: process.env.TRUSTED_PROXIES || '',

    // Public (доступны на клиенте)
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
      mcpServerUrl: process.env.NUXT_PUBLIC_MCP_SERVER_URL || '',
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'SPLAT QR Service',
      csrfHeaderName: process.env.NUXT_PUBLIC_CSRF_HEADER_NAME || 'X-CSRF-Token',
      docsUiEnabled: process.env.NODE_ENV !== 'production' || process.env.NUXT_DOCS_UI !== '0',
    },
  },

  alias: {
    '@scalar/api-reference/vue': '@scalar/api-reference',
  },

  future: { compatibilityVersion: 4 },

  // Avoid Vite pre-transform "Failed to resolve import #app-manifest" on dev (esp. fresh .nuxt / first run).
  // See https://github.com/nuxt/nuxt/issues/33606 — re-enable when fixed in your Nuxt version if you need manifest prefetch.
  experimental: {
    appManifest: false,
    // Default true stacks nitropack + @nuxt/nitro-server `useAppConfig` auto-imports → noisy duplicate warning (unimport 5.7+).
    // false enables nitro-server’s preset cleanup (single registration). Safe if you don’t rely on per-request appConfig cloning.
    // See https://github.com/nuxt/nuxt/issues/34812
    serverAppConfig: false,
  },

  compatibilityDate: '2025-01-01',

  nitro: {
    routeRules: {
      // Browsers request /favicon.ico even when head declares an SVG icon; avoid a noisy 404 in devtools.
      '/favicon.ico': { redirect: '/splat-logo.svg' },
      '/api/**': { maxBodySize: '1MB' } as unknown as Record<string, unknown>,
      '/api/v1/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Credentials': 'false',
        },
      } as unknown as Record<string, unknown>,
      '/api/qr/bulk': { maxBodySize: '5MB' } as unknown as Record<string, unknown>,
    },
    rollupConfig: {
      external: ['papaparse'],
    },
  },

  // papaparse is browser-oriented CJS; bundling it through Rollup's CJS plugin fails on worker/Blob code.
  // Tailwind v4 requires this plugin or utilities from Vue/templates are never generated.
  // https://tailwindcss.com/docs/installation/framework-guides/nuxt
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['papaparse'],
    },
  },

  i18n: {
    defaultLocale: 'ru',
    locales: [
      { code: 'ru', name: 'Русский', file: 'ru.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    langDir: 'locales/',
    strategy: 'no_prefix',
  },

  icon: {
    serverBundle: (process.env.NUXT_ICON_SERVER_BUNDLE as 'auto' | 'local' | 'remote' | undefined) || 'remote',
  },

  primevue: {
    options: {
      theme: {
        preset: SplatPreset,
        options: {
          darkModeSelector: '.app-dark',
        },
      },
      ripple: true,
    },
  },
})
