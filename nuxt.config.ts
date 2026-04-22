import { SplatPreset } from './app/themes/splat-preset'

export default defineNuxtConfig({
  modules: [
    '@primevue/nuxt-module',
    '@nuxt/ui',
    '@nuxt/icon',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  ssr: true,

  devtools: { enabled: true },

  css: ['~~/app/assets/css/main.css', '~~/app/assets/layout/layout.scss', '@scalar/api-reference/style.css'],

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
  },

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
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3001',
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
  },
  compatibilityDate: '2025-01-01',

  nitro: {
    routeRules: {
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
  vite: {
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
    serverBundle: process.env.NUXT_ICON_SERVER_BUNDLE || 'remote',
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
