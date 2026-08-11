import { createFileRoute } from '@tanstack/react-router'

const UPSTREAM_API_ORIGIN = 'https://mscproject.tuckersmile.com'

function buildUpstreamUrl(requestUrl: string, splatPath: string | undefined) {
  const incomingUrl = new URL(requestUrl)
  const upstreamPath = (splatPath ?? '').replace(/^\/+/, '')
  const upstreamUrl = new URL(upstreamPath, `${UPSTREAM_API_ORIGIN}/`)
  upstreamUrl.search = incomingUrl.search
  return upstreamUrl
}

function buildForwardHeaders(request: Request) {
  const headers = new Headers(request.headers)

  // Avoid forwarding origin-specific headers that can cause upstream rejection.
  headers.delete('origin')
  headers.delete('referer')
  headers.delete('host')

  return headers
}

async function forwardRequest(request: Request, splatPath: string | undefined) {
  const upstreamUrl = buildUpstreamUrl(request.url, splatPath)
  const method = request.method.toUpperCase()

  const upstreamResponse = await fetch(upstreamUrl, {
    method,
    headers: buildForwardHeaders(request),
    body: method === 'GET' || method === 'HEAD' ? undefined : request.body,
    redirect: 'follow',
  })

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: upstreamResponse.headers,
  })
}

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      GET: ({ request, params }) => forwardRequest(request, params._splat),
      POST: ({ request, params }) => forwardRequest(request, params._splat),
      PUT: ({ request, params }) => forwardRequest(request, params._splat),
      PATCH: ({ request, params }) => forwardRequest(request, params._splat),
      DELETE: ({ request, params }) => forwardRequest(request, params._splat),
      OPTIONS: ({ request, params }) => forwardRequest(request, params._splat),
    },
  },
})