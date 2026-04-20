# Python client example

## Environment

```bash
export API_BASE_URL="http://localhost:3000"
export API_TOKEN="<your_api_token>"
```

## Request example

```python
import os
import requests

base_url = os.environ["API_BASE_URL"]
token = os.environ["API_TOKEN"]

response = requests.get(
    f"{base_url}/api/v1/qr",
    headers={"Authorization": f"Bearer {token}"},
    timeout=30,
)

response.raise_for_status()
print(response.json())
```
