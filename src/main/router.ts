import { Router } from 'itty-router'
import { OAuth2Scopes } from 'discord-api-types/v10'

import { respondToDiscordInteraction } from '../discord-framework'
import { authorize } from '../request/request'
import { RequestArgs } from '../request/request'
import { sentry } from '../request/sentry'
import { initSentry } from '../request/sentry'

import { App } from './app/app'
import { apiRouter } from './api/router'
import { deployApp } from './app/deploy_app'
import { oauthRedirect, oauthCallback } from './modules/oauth'
import { runTests } from '../test/test'
import { findView } from './app/find_view'
import { onViewError } from './views/utils/on_view_error'

export function respond(req: RequestArgs): Promise<Response> {
  initSentry(req)
  const app = new App(req)
  const config = app.config

  const route = Router()
    .get('/', () => {
      return new Response(`👀`)
    })

    .post('/interactions', (request) => {
      return respondToDiscordInteraction(
        app.bot,
        request,
        findView(app),
        onViewError(app),
        app.config.features.DIRECT_RESPONSE,
      )
    })

    .get(config.routes.OAUTH_LINKED_ROLES, () => {
      return oauthRedirect(app, [OAuth2Scopes.Identify, OAuth2Scopes.RoleConnectionsWrite])
    })

    .get(config.routes.OAUTH_CALLBACK, (request) => {
      return oauthCallback(app, request)
    })

    .post('/init', authorize(req), async () => {
      await deployApp(app)
      return new Response(`Deployed Leaderboards bot (${app.config.env.ENVIRONMENT})`)
    })

    .all('/api', async (request) => {
      return apiRouter(app).handle(request)
    })

    .post('/test', authorize(req), async () => {
      return await runTests(app)
    })

    .all('*', () => new Response('Not Found', { status: 404 }))

  return sentry.handlerWrapper(route.handle)
}
