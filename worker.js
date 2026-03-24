// Metadata extractor API for Cloudflare Workers.

const SERVICE_NAME = 'meta.api.airat.top';
const MAX_HTML_BYTES = 750000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow'
};

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function normalizeValue(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return value;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS
    }
  });
}

function textResponse(text, status = 200) {
  return new Response(text, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      ...CORS_HEADERS
    }
  });
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toXml(value, key = 'item', indent = '') {
  if (value === null) {
    return `${indent}<${key} />`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${indent}<${key} />`;
    }

    const rows = value
      .map((entry) => toXml(entry, 'item', `${indent}  `))
      .join('\n');

    return `${indent}<${key}>\n${rows}\n${indent}</${key}>`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return `${indent}<${key} />`;
    }

    const rows = entries
      .map(([childKey, childValue]) => toXml(childValue, childKey, `${indent}  `))
      .join('\n');

    return `${indent}<${key}>\n${rows}\n${indent}</${key}>`;
  }

  return `${indent}<${key}>${xmlEscape(value)}</${key}>`;
}

function xmlResponse(data, status = 200) {
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n${toXml(data, 'response')}`;

  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      ...CORS_HEADERS
    }
  });
}

function yamlEscapeString(value) {
  return String(value).replace(/'/g, "''");
}

function toYaml(value, indent = 0) {
  const prefix = '  '.repeat(indent);

  if (value === null) {
    return 'null';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }

    return value
      .map((entry) => {
        if (entry === null || typeof entry !== 'object') {
          return `${prefix}- ${toYaml(entry, 0)}`;
        }

        const nested = toYaml(entry, indent + 1);
        return `${prefix}-\n${nested}`;
      })
      .join('\n');
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return '{}';
    }

    return entries
      .map(([key, child]) => {
        if (child === null || typeof child !== 'object') {
          return `${prefix}${key}: ${toYaml(child, 0)}`;
        }

        const nested = toYaml(child, indent + 1);
        return `${prefix}${key}:\n${nested}`;
      })
      .join('\n');
  }

  if (typeof value === 'string') {
    return `'${yamlEscapeString(value)}'`;
  }

  return String(value);
}

function yamlResponse(data, status = 200) {
  return new Response(toYaml(data), {
    status,
    headers: {
      'Content-Type': 'text/yaml; charset=utf-8',
      ...CORS_HEADERS
    }
  });
}

function healthPayload() {
  return { status: 'ok' };
}

function parseTargetUrl(rawUrl) {
  if (!rawUrl) {
    return {
      ok: false,
      error: 'Missing url parameter. Example: ?url=https://example.com'
    };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return {
      ok: false,
      error: 'Invalid URL. Use an absolute http/https URL.'
    };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return {
      ok: false,
      error: 'Unsupported URL scheme. Only http and https are allowed.'
    };
  }

  return { ok: true, url: parsed.toString() };
}

function decodeHtmlEntities(input) {
  return String(input)
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .trim();
}

function parseTagAttributes(tag) {
  const attributes = {};
  const attrRegex = /([^\s=\/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  let match;
  while ((match = attrRegex.exec(tag)) !== null) {
    const key = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attributes[key] = decodeHtmlEntities(value);
  }

  return attributes;
}

function extractTextByRegex(html, regex) {
  const match = html.match(regex);
  if (!match || !match[1]) {
    return null;
  }

  return decodeHtmlEntities(match[1].replace(/\s+/g, ' ').trim());
}

function extractHtmlLang(html) {
  const match = html.match(/<html[^>]*\blang\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  if (!match) {
    return null;
  }

  return normalizeValue(match[1] || match[2] || match[3] || null);
}

function extractMetadata(html) {
  const title = extractTextByRegex(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const htmlLang = extractHtmlLang(html);

  const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const linkTags = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);

  const byName = {};
  const byProperty = {};

  let charset = null;
  for (const tag of metaTags) {
    const attrs = parseTagAttributes(tag);

    if (!charset && attrs.charset) {
      charset = normalizeValue(attrs.charset);
    }

    const content = normalizeValue(attrs.content);
    if (!content) {
      continue;
    }

    if (attrs.name) {
      byName[attrs.name.toLowerCase()] = content;
    }

    if (attrs.property) {
      byProperty[attrs.property.toLowerCase()] = content;
    }

    if (!charset && attrs['http-equiv'] && attrs['http-equiv'].toLowerCase() === 'content-type') {
      const charsetMatch = content.match(/charset\s*=\s*([^;\s]+)/i);
      if (charsetMatch) {
        charset = normalizeValue(charsetMatch[1]);
      }
    }
  }

  let canonical = null;
  for (const tag of linkTags) {
    const attrs = parseTagAttributes(tag);
    const rel = normalizeValue(attrs.rel);
    if (!rel) {
      continue;
    }

    const relTokens = rel.toLowerCase().split(/\s+/);
    if (relTokens.includes('canonical') && attrs.href) {
      canonical = normalizeValue(attrs.href);
      break;
    }
  }

  return {
    title: normalizeValue(title),
    description: normalizeValue(byName.description),
    canonical,
    robots: normalizeValue(byName.robots),
    lang: normalizeValue(htmlLang),
    charset,
    openGraph: {
      title: normalizeValue(byProperty['og:title']),
      description: normalizeValue(byProperty['og:description']),
      image: normalizeValue(byProperty['og:image']),
      url: normalizeValue(byProperty['og:url']),
      type: normalizeValue(byProperty['og:type']),
      siteName: normalizeValue(byProperty['og:site_name'])
    },
    twitter: {
      card: normalizeValue(byName['twitter:card']),
      title: normalizeValue(byName['twitter:title']),
      description: normalizeValue(byName['twitter:description']),
      image: normalizeValue(byName['twitter:image'])
    }
  };
}

async function fetchPageMetadata(targetUrl) {
  let response;
  try {
    response = await fetch(targetUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': `${SERVICE_NAME}/1.0 (+https://airat.top)`,
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8'
      }
    });
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: `Fetch failed: ${error?.message || 'network error'}`
    };
  }

  let html = '';
  try {
    html = (await response.text()).slice(0, MAX_HTML_BYTES);
  } catch {
    html = '';
  }

  const payload = {
    ok: response.ok,
    query: {
      url: targetUrl
    },
    fetched: {
      finalUrl: normalizeValue(response.url),
      status: response.status,
      statusText: normalizeValue(response.statusText),
      contentType: normalizeValue(response.headers.get('content-type'))
    },
    meta: extractMetadata(html),
    service: SERVICE_NAME,
    generatedAt: new Date().toISOString()
  };

  return {
    ok: true,
    payload
  };
}

function renderText(payload) {
  return (
    payload.meta.title
    || payload.meta.description
    || payload.meta.openGraph.title
    || payload.fetched.finalUrl
    || payload.query.url
    || ''
  );
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (!['GET', 'HEAD'].includes(request.method)) {
      return textResponse('Method Not Allowed', 405);
    }

    const url = new URL(request.url);
    const path = normalizePath(url.pathname);

    if (path === '/robots.txt') {
      return textResponse('User-agent: *\nDisallow: /\n');
    }

    if (path === '/health') {
      return jsonResponse(healthPayload());
    }

    const allowedPaths = new Set(['/', '/json', '/text', '/yaml', '/xml']);
    if (!allowedPaths.has(path)) {
      return textResponse('Not Found', 404);
    }

    const urlResult = parseTargetUrl(url.searchParams.get('url'));
    if (!urlResult.ok) {
      return jsonResponse({ error: urlResult.error }, 400);
    }

    const result = await fetchPageMetadata(urlResult.url);
    if (!result.ok) {
      return jsonResponse({ error: result.error }, result.status || 502);
    }

    const payload = result.payload;

    if (path === '/text') {
      return textResponse(renderText(payload));
    }

    if (path === '/yaml') {
      return yamlResponse(payload);
    }

    if (path === '/xml') {
      return xmlResponse(payload);
    }

    return jsonResponse(payload);
  }
};
