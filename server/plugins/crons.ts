import cron from 'node-cron'
import { aggregationService } from '../services/aggregation.service'

/**
 * Daily aggregation cron: every day at 02:00 UTC
 * Aggregates the previous day's scan_events into scan_daily_stats.
 */
export default defineNitroPlugin(() => {
  // Only run in production to avoid noise during development
  if (process.env.NODE_ENV !== 'production') return

  cron.schedule('0 2 * * *', async () => {
    const yesterday = new Date()
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    try {
      await aggregationService.aggregateDay(yesterday)
      console.log(`[cron] Daily aggregation complete for ${yesterday.toISOString().slice(0, 10)}`)
    }
    catch (err) {
      console.error('[cron] Daily aggregation failed:', err)
    }
  }, { timezone: 'UTC' })

  console.log('[cron] Daily aggregation scheduled (02:00 UTC)')
})
