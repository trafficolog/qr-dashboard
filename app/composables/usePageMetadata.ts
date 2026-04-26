type PageMetadataKey = 'home'
  | 'login'
  | 'verify'
  | 'dashboard'
  | 'qrList'
  | 'qrCreate'
  | 'qrBulk'
  | 'qrShared'
  | 'qrDetails'
  | 'qrEdit'
  | 'folders'
  | 'folderDetails'
  | 'analytics'
  | 'integrations'
  | 'mcpSetup'
  | 'apiDocs'
  | 'notifications'
  | 'settings'
  | 'settingsGeneral'
  | 'settingsProfile'
  | 'settingsTeam'
  | 'settingsDomains'
  | 'settingsDestinationDomains'
  | 'settingsDepartments'
  | 'settingsAudit'
  | 'settingsIntegrations'
  | 'docsUi'
  | 'expired'
  | 'notFound'

interface PageMetadataRoute {
  key: PageMetadataKey
  match: (path: string) => boolean
}

const PAGE_METADATA_ROUTES: PageMetadataRoute[] = [
  { key: 'login', match: path => path === '/auth/login' },
  { key: 'verify', match: path => path === '/auth/verify' },
  { key: 'dashboard', match: path => path === '/dashboard' },
  { key: 'qrCreate', match: path => path === '/qr/create' },
  { key: 'qrBulk', match: path => path === '/qr/bulk' },
  { key: 'qrShared', match: path => path === '/qr/shared' },
  { key: 'qrEdit', match: path => /^\/qr\/[^/]+\/edit$/.test(path) },
  { key: 'qrDetails', match: path => /^\/qr\/[^/]+$/.test(path) },
  { key: 'qrList', match: path => path === '/qr' },
  { key: 'folderDetails', match: path => /^\/folders\/[^/]+$/.test(path) },
  { key: 'folders', match: path => path === '/folders' },
  { key: 'analytics', match: path => path === '/analytics' },
  { key: 'mcpSetup', match: path => path === '/integrations/mcp-setup' },
  { key: 'integrations', match: path => path === '/integrations' },
  { key: 'apiDocs', match: path => path === '/api-docs' },
  { key: 'notifications', match: path => path === '/notifications' },
  { key: 'settingsDestinationDomains', match: path => path === '/settings/destination-domains' },
  { key: 'settingsIntegrations', match: path => path === '/settings/integrations' },
  { key: 'settingsDepartments', match: path => path === '/settings/departments' },
  { key: 'settingsDomains', match: path => path === '/settings/domains' },
  { key: 'settingsProfile', match: path => path === '/settings/profile' },
  { key: 'settingsGeneral', match: path => path === '/settings/general' },
  { key: 'settingsTeam', match: path => path === '/settings/team' },
  { key: 'settingsAudit', match: path => path === '/settings/audit' },
  { key: 'settings', match: path => path === '/settings' },
  { key: 'docsUi', match: path => path.startsWith('/docs-ui') },
  { key: 'expired', match: path => path === '/expired' },
  { key: 'notFound', match: path => path === '/not-found' },
  { key: 'home', match: path => path === '/' },
]

function resolvePageMetadataKey(path: string): PageMetadataKey {
  return PAGE_METADATA_ROUTES.find(route => route.match(path))?.key ?? 'home'
}

export function usePageMetadata() {
  const route = useRoute()
  const { t, locale } = useI18n()
  const config = useRuntimeConfig()

  const appName = computed(() => config.public.appName || t('app.name'))
  const pageKey = computed(() => resolvePageMetadataKey(route.path))
  const pageTitle = computed(() => t(`seo.pages.${pageKey.value}.title`))
  const pageSubtitle = computed(() => t(`seo.pages.${pageKey.value}.subtitle`))
  const pageDescription = computed(() => t(`seo.pages.${pageKey.value}.description`))
  const fullTitle = computed(() => `${pageTitle.value} | ${appName.value}`)

  return {
    appName,
    locale,
    pageKey,
    pageTitle,
    pageSubtitle,
    pageDescription,
    fullTitle,
  }
}
