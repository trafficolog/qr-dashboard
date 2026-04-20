# Examples

В этой папке собраны примеры для REST и MCP интеграции.

## Переменные окружения

```bash
export API_BASE_URL="http://localhost:3000"
export API_TOKEN="<your_api_token>"
```

## MCP endpoint

Используйте endpoint: `/mcp`.

Полный URL обычно выглядит так:

```text
${API_BASE_URL}/mcp
```

## Authorization header

Для всех примеров используйте формат:

```text
Authorization: Bearer ${API_TOKEN}
```

## Структура

- `typescript-sdk/` — генерация и использование TypeScript SDK.
- `python-client/` — минимальный Python-клиент.
- `curl-recipes.md` — cURL команды для быстрой проверки.
- `mcp/` — конфиги MCP-клиентов и скрипт проверки соединения.
