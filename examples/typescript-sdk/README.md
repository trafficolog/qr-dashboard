# TypeScript SDK example

Generated SDK files are written to `examples/typescript-sdk/generated`.

## Generate SDK

```bash
npm run sdks:generate
```

## Minimal usage

```ts
import { client } from './generated/client'
import { getApiV1Qr } from './generated/sdk.gen'

client.setConfig({
  baseUrl: process.env.API_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.API_TOKEN}`
  }
})

const response = await getApiV1Qr()
console.log(response.data)
```
