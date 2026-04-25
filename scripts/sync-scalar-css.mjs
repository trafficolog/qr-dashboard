/**
 * Copy Scalar API Reference bundled CSS into public/ so Nuxt/Vite does not emit
 * broken /@fsD:/... URLs on Windows (see https://github.com/nuxt/nuxt/issues/34766).
 */
import { copyFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'node_modules/@scalar/api-reference/dist/style.css')
const dest = resolve(root, 'public/scalar-api-reference.css')

if (!existsSync(src)) {
  console.warn('[sync-scalar-css] skip: node_modules/@scalar/api-reference/dist/style.css not found')
  process.exit(0)
}

copyFileSync(src, dest)
