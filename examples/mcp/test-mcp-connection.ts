const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000'
const API_TOKEN = process.env.API_TOKEN

if (!API_TOKEN) {
  throw new Error('API_TOKEN is required')
}

async function testConnection() {
  const response = await fetch(`${API_BASE_URL}/mcp`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`
    }
  })

  console.log('status:', response.status)
  console.log('ok:', response.ok)
  console.log('body:', await response.text())
}

testConnection().catch((error) => {
  console.error(error)
  process.exit(1)
})
