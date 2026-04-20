import { validateRuntimeConfig } from '../utils/runtime-config'

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  const issues = validateRuntimeConfig(config)

  if (issues.length === 0) {
    return
  }

  const issueLines = issues.map(issue => `  - ${issue.key}: ${issue.reason}`)

  if (process.env.NODE_ENV === 'production') {
    console.error('[config] Runtime configuration validation failed. Application startup aborted.')
    console.error(issueLines.join('\n'))
    process.exit(1)
  }

  console.warn('[config] Runtime configuration validation warnings:')
  console.warn(issueLines.join('\n'))
})
