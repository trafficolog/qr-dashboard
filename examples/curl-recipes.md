# cURL recipes

## Environment

```bash
export API_BASE_URL="http://localhost:3000"
export API_TOKEN="<your_api_token>"
```

## MCP endpoint health check

```bash
curl -i \
  -H "Authorization: Bearer ${API_TOKEN}" \
  "${API_BASE_URL}/mcp"
```

## List QR codes via REST API

```bash
curl -sS \
  -H "Authorization: Bearer ${API_TOKEN}" \
  "${API_BASE_URL}/api/v1/qr"
```
