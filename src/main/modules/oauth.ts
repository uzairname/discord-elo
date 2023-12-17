import * as D from 'discord-api-types/v10'
import { AccessTokens } from '../../database/schema'
import { DiscordRESTClient } from '../../discord-framework'
import { sentry } from '../../request/sentry'
import { nonNullable } from '../../utils/utils'
import { App } from '../app/app'
import { AppErrors, UserErrors } from '../app/errors'
import { updateUserRoleConnectionData } from './linked_roles'

export function oauthRedirect(app: App, scopes: D.OAuth2Scopes[]): Response {
  const state = crypto.randomUUID()
  const url = app.bot.oauthRedirectURL(app.config.OAUTH_REDIRECT_URI, scopes, state)

  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      'Set-Cookie': `state=${state}; HttpOnly; Secure; Max-Age=300; path=/`
    }
  })
}

export async function oauthCallback(app: App, request: Request): Promise<Response> {
  const url = new URL(request.url)
  const client_state = request.headers.get('Cookie')?.split('state=')[1]?.split(';')[0]
  const discord_state = url.searchParams.get('state')

  if (client_state !== discord_state) {
    return new Response('Invalid state', { status: 400 })
  }

  try {
    const code = nonNullable(url.searchParams.get('code'), 'code')
    var tokendata = await app.bot.getOauthToken(code, app.config.OAUTH_REDIRECT_URI)
  } catch (e) {
    sentry.catchAfterResponding(e)
    return new Response('Invalid code', { status: 400 })
  }

  await saveUserAccessToken(app, tokendata)

  return new Response(`Authorized. You may return to Discord`, {
    status: 200
  })
}

export async function saveUserAccessToken(app: App, token: D.RESTPostOAuth2AccessTokenResult) {
  const me = await app.bot.getOauthUser(token.access_token)
  const expires_at = Date.now() + token.expires_in * 1000

  if (me.user) {
    // save token
    await app.db.db.insert(AccessTokens).values({
      user_id: me.user.id,
      data: token,
      purpose: 'user'
    })
  } else {
    throw new AppErrors.MissingIdentifyScope()
  }
}

type StoredToken = {
  access_token: string
  refresh_token: string
  expires_at: number
}

export async function refreshAccessToken(
  bot: DiscordRESTClient,
  tokens: StoredToken
): Promise<string> {
  if (Date.now() < tokens.expires_at) {
    return tokens.access_token
  }

  const response = await bot.refreshOauthToken(tokens.refresh_token)
  return response.access_token
}
