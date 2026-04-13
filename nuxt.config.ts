export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/icon',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  ssr: true,

  devtools: { enabled: true },

  css: ['~~/assets/css/main.css'],

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

    // Public (доступны на клиенте)
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3001',
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'SPLAT QR Service',
    },
  },

  future: { compatibilityVersion: 4 },
  compatibilityDate: '2025-01-01',

  i18n: {
    defaultLocale: 'ru',
    locales: [
      { code: 'ru', name: 'Русский', file: 'ru.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    lazy: true,
    langDir: 'locales/',
    strategy: 'no_prefix',
  },

  icon: {
    serverBundle: 'remote',
  },
})
