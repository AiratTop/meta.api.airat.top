# Contributing

Thanks for your interest in improving meta.api.airat.top. Contributions are welcome, including bug reports, docs improvements, and API behavior refinements.

## How to Help

- **Report bugs or suggest enhancements** by opening an issue on GitHub. Include clear reproduction steps and request/response examples.
- **Improve documentation** by fixing typos or clarifying usage details in the README.
- **Submit pull requests** for Worker logic, API behavior, or tests.

## Before You Start

- Read `README.md` to understand the API contract.
- Keep changes focused. If you have multiple unrelated ideas, open separate pull requests.
- Avoid adding heavy dependencies. This project is a single Cloudflare Worker script.

## Development Workflow

1. Fork the repository and clone your fork locally.
2. Create a feature branch that describes your work (for example, `feature/add-more-og-fields`).
3. Make your changes in `worker.js` or docs.
4. Test with Wrangler and verify examples in README.
5. Open a pull request against `main` and describe what changed and how you verified it.

## Pull Request Checklist

- [ ] `GET /` and `GET /json` return metadata JSON for a valid `url`.
- [ ] `GET /text` returns a single plain-text result.
- [ ] `GET /yaml` and `GET /xml` return valid formatted output.
- [ ] Invalid or missing `url` returns documented `400` error.
- [ ] `GET /health` returns `{"status":"ok"}`.
- [ ] `GET /robots.txt` returns the documented static content.
- [ ] Documentation updated if behavior changed.

## Code Style and Standards

- Keep code minimal and readable.
- Avoid adding dependencies or build steps.
- Prefer explicit logic over magic behavior.

## Security and Responsible Disclosure

If you discover a security vulnerability, do not open a public issue. Email mail@airat.top with details so it can be addressed promptly.

## Questions or Feedback

If you are unsure about anything before contributing, open a discussion or contact AiratTop at mail@airat.top.
