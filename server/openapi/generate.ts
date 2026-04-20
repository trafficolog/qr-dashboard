import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { buildOpenApiDocument } from './registry'
import './schemas'

async function run() {
  const outputPath = resolve(process.cwd(), 'public/openapi.json')
  const document = buildOpenApiDocument()

  await mkdir(resolve(process.cwd(), 'public'), { recursive: true })
  await writeFile(outputPath, JSON.stringify(document, null, 2), 'utf8')

  console.info(`OpenAPI spec generated at ${outputPath}`)
}

run().catch((error) => {
  console.error('Failed to generate OpenAPI spec')
  console.error(error)
  process.exitCode = 1
})
