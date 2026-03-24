# meta.api.airat.top

Public Cloudflare Worker API that extracts webpage metadata by URL.

Live endpoint:
- https://meta.api.airat.top

## API

Required query parameter:
- `url` - absolute `http://` or `https://` URL.

### `GET /`

Default endpoint. Returns metadata as JSON.

```bash
curl 'https://meta.api.airat.top/?url=https%3A%2F%2Fairat.top'
```

Test in browser: https://meta.api.airat.top/?url=https%3A%2F%2Fairat.top

Example response:

```json
{
  "ok": true,
  "query": {
    "url": "https://airat.top/"
  },
  "fetched": {
    "finalUrl": "https://airat.top/",
    "status": 200,
    "statusText": "OK",
    "contentType": "text/html; charset=utf-8"
  },
  "meta": {
    "title": "AiratTop",
    "description": "Automation and AI solutions.",
    "canonical": "https://airat.top/",
    "robots": "index,follow",
    "lang": "en",
    "charset": "utf-8",
    "openGraph": {
      "title": "AiratTop",
      "description": "Automation and AI solutions.",
      "image": "https://airat.top/airattop.jpg",
      "url": "https://airat.top/",
      "type": "website",
      "siteName": "AiratTop"
    },
    "twitter": {
      "card": "summary",
      "title": "AiratTop",
      "description": "Automation and AI solutions.",
      "image": "https://airat.top/airattop.jpg"
    }
  },
  "service": "meta.api.airat.top",
  "generatedAt": "2026-03-25T00:00:00.000Z"
}
```

### `GET /json`

JSON alias for `/`.

```bash
curl 'https://meta.api.airat.top/json?url=https%3A%2F%2Fairat.top'
```

Test in browser: https://meta.api.airat.top/json?url=https%3A%2F%2Fairat.top

### `GET /text`

Returns a single plain-text value (best available of `title`, `description`, or final URL).

```bash
curl 'https://meta.api.airat.top/text?url=https%3A%2F%2Fairat.top'
```

Test in browser: https://meta.api.airat.top/text?url=https%3A%2F%2Fairat.top

### `GET /yaml`

Returns the same payload as YAML.

```bash
curl 'https://meta.api.airat.top/yaml?url=https%3A%2F%2Fairat.top'
```

Test in browser: https://meta.api.airat.top/yaml?url=https%3A%2F%2Fairat.top

### `GET /xml`

Returns the same payload as XML.

```bash
curl 'https://meta.api.airat.top/xml?url=https%3A%2F%2Fairat.top'
```

Test in browser: https://meta.api.airat.top/xml?url=https%3A%2F%2Fairat.top

### `GET /health`

Health check endpoint.

```bash
curl 'https://meta.api.airat.top/health'
```

Response:

```json
{
  "status": "ok"
}
```

Test in browser: https://meta.api.airat.top/health

### Validation errors

Missing or invalid `url` returns `400`:

```bash
curl 'https://meta.api.airat.top/?url=not-a-url'
```

```json
{
  "error": "Invalid URL. Use an absolute http/https URL."
}
```

### CORS

CORS is enabled for all origins (`*`).

## Privacy

No analytics or request logs are collected by this project.

## Project structure

- `worker.js` - Cloudflare Worker script.
- `wrangler.toml` - Wrangler configuration.

## Deployment

Deploy with Wrangler:

```bash
npx wrangler deploy
```

If you use Cloudflare Workers Builds (GitHub integration), keep root directory as `/` and deploy command as `npx wrangler deploy`.

For custom domain binding, configure it in **Workers & Pages -> Domains & Routes**.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE).

---

## Author

**AiratTop**

- Website: [airat.top](https://airat.top)
- GitHub: [@AiratTop](https://github.com/AiratTop)
- Email: [mail@airat.top](mailto:mail@airat.top)
- Repository: [meta.api.airat.top](https://github.com/AiratTop/meta.api.airat.top)
