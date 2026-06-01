/*
 * Copyright 2026 International Digital Economy Academy
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { jwtDecode } from 'jwt-decode'

export const MOONCAKES_SESSION_STORAGE_KEY = 'access_token_with_time'
const LEGACY_ACCESS_TOKEN_KEY = 'mooncakes-access-token'
const LEGACY_USERNAME_KEY = 'mooncakes-username'
const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000

export type MooncakesSession = {
  access_token: string
  time: number
}

export type MooncakesTokenPayload = {
  username?: string
  gh_avatar?: string | null
  gh_name?: string | null
}

export type MooncakesUserSession = MooncakesSession & {
  username: string
  gh_avatar?: string | null
  gh_name?: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function clearLegacyMooncakesSession(storage = window.localStorage) {
  storage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
  storage.removeItem(LEGACY_USERNAME_KEY)
}

export function clearMooncakesSession(storage = window.localStorage) {
  storage.removeItem(MOONCAKES_SESSION_STORAGE_KEY)
  clearLegacyMooncakesSession(storage)
}

export function saveMooncakesSession(
  accessToken: string,
  storage = window.localStorage
): MooncakesSession {
  const session = {
    access_token: accessToken,
    time: Date.now()
  }
  storage.setItem(MOONCAKES_SESSION_STORAGE_KEY, JSON.stringify(session))
  clearLegacyMooncakesSession(storage)
  return session
}

export function readMooncakesSession(
  storage = window.localStorage
): MooncakesSession | null {
  const raw = storage.getItem(MOONCAKES_SESSION_STORAGE_KEY)
  if (raw === null) return null

  try {
    const parsed = JSON.parse(raw) as unknown
    if (
      !isRecord(parsed) ||
      typeof parsed.access_token !== 'string' ||
      parsed.access_token === '' ||
      typeof parsed.time !== 'number' ||
      !Number.isFinite(parsed.time)
    ) {
      clearMooncakesSession(storage)
      return null
    }

    if (Date.now() - parsed.time > SESSION_TTL_MS) {
      clearMooncakesSession(storage)
      return null
    }

    return {
      access_token: parsed.access_token,
      time: parsed.time
    }
  } catch {
    clearMooncakesSession(storage)
    return null
  }
}

export function decodeMooncakesToken<T extends object>(
  accessToken: string
): T | null {
  try {
    return jwtDecode<T>(accessToken)
  } catch {
    return null
  }
}

export function readMooncakesUserSession(
  storage = window.localStorage
): MooncakesUserSession | null {
  const session = readMooncakesSession(storage)
  if (session === null) return null

  const payload = decodeMooncakesToken<MooncakesTokenPayload>(
    session.access_token
  )
  if (payload === null || typeof payload.username !== 'string') {
    clearMooncakesSession(storage)
    return null
  }

  return {
    ...session,
    username: payload.username,
    gh_avatar: payload.gh_avatar,
    gh_name: payload.gh_name
  }
}

export function getSafeRedirectPath(
  search: string,
  fallback = '/mooncakes'
): string {
  const redirect = new URLSearchParams(search).get('redirect')
  if (redirect === null || redirect === '') return fallback

  try {
    const target = new URL(redirect, window.location.origin)
    if (target.origin !== window.location.origin) return fallback
    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return fallback
  }
}
