import { ApiError } from './api'

/**
 * Translate any thrown value into a calm, non-technical message.
 * Golden rule: never surface a raw library/stack string to the user.
 */
export function toFriendlyError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof Error) return new ApiError(error.message, 500)
  return new ApiError('Something went wrong. Please try again.', -1)
}

export interface FriendlyMessage {
  title: string
  message: string
}

/**
 * Map an ApiError (or raw message) to human copy. Order matters: the string
 * checks catch backend quirks such as a missing google-auth library.
 */
export type ErrorContext = 'login' | 'otp-send' | 'otp-verify' | 'google' | 'register' | 'general'

export function friendlyMessage(err: unknown, context: ErrorContext = 'general'): FriendlyMessage {
  const message = err instanceof Error ? err.message : String(err ?? '')
  const status = err instanceof ApiError ? err.status : 0

  if (status === 0 || /network|failed to fetch/i.test(message)) {
    return {
      title: "Can't reach the server",
      message: "Can't reach the server. Check your connection and make sure the backend is running.",
    }
  }
  // Context-specific wording first - the same HTTP code means different things on each screen.
  if (context === 'otp-send') {
    if (status === 404) {
      return {
        title: 'Account not found',
        message: 'No account matches that e-mail or username. Check the spelling, or sign up for a new account.',
      }
    }
    if (status === 429) return { title: 'Too many attempts', message: 'Please wait a minute before asking for another code.' }
  }
  if (context === 'otp-verify') {
    if (/expired/i.test(message)) return { title: 'Code expired', message: 'That code has expired. Go back and request a new one.' }
    if (status === 401 || status === 404) {
      return { title: 'Wrong code', message: 'That code is incorrect. Check the e-mail and try again.' }
    }
  }
  if (context === 'login' && status === 401) {
    return { title: 'Sign in failed', message: 'Incorrect username/e-mail or password. Please try again.' }
  }
  if (context === 'register' && (status === 400 || status === 409 || status === 422)) {
    return { title: 'Could not create account', message: message || 'Please check your details and try again.' }
  }
  if (context === 'google') {
    if (status === 401) {
      return {
        title: 'Google sign-in failed',
        message: message || 'Google could not verify your account. Please try again or use your e-mail and password.',
      }
    }
    if (status === 501) {
      return { title: 'Google sign-in unavailable', message: 'Google sign-in is not configured on the server.' }
    }
  }

  // Google provider unavailable (raw "google-auth library is not installed", 501, "not configured").
  if (status === 501 || /not configured/i.test(message)) {
    return {
      title: 'Google sign-in unavailable',
      message: 'Google sign-in is temporarily unavailable. Please use your email and password.',
    }
  }
  if (status === 401) {
    return { title: 'Sign in failed', message: 'Incorrect username or password. Please try again.' }
  }
  if (status === 403) {
    return {
      title: 'Not allowed',
      message: 'You do not have permission to do that. Contact a manager for access.',
    }
  }
  if (status === 409 || /already exists|duplicate/i.test(message)) {
    return {
      title: 'Already exists',
      message: /code/i.test(message)
        ? 'That medicine code is already in use. Try a different one.'
        : 'That record already exists. Check the details and try again.',
    }
  }
  if (status === 422 || /validation/i.test(message)) {
    return {
      title: 'Check your details',
      message: 'Some fields need attention. Please review the highlighted inputs.',
    }
  }
  if (status === 500 || status === 502 || status === 503) {
    return {
      title: 'Server hiccup',
      message: 'Something went wrong on our side. Please try again in a moment.',
    }
  }
  if (status === 404) {
    // Deliberately generic for privacy — never reveal whether the account exists.
    return {
      title: 'Sign in failed',
      message: 'We could not find a matching account. Check your details and try again.',
    }
  }
  if (status === 429 || /too many/i.test(message)) {
    return {
      title: 'Too many attempts',
      message: 'Too many attempts. Please wait a few minutes and try again.',
    }
  }
  if (status === 0 || /network|failed to fetch/i.test(message)) {
    return {
      title: "Can't reach the server",
      message: "Can't reach the server. Check your connection and try again.",
    }
  }
  if (/otp/i.test(message)) {
    return {
      title: 'Verification failed',
      message: 'That code is incorrect or has expired. Request a new one.',
    }
  }

  // Fallback: hide anything that looks like an internal/library error.
  const looksInternal = /library|traceback|exception|undefined|cannot read|stack/i.test(message)
  return {
    title: 'Something went wrong',
    message: looksInternal
      ? 'Something went wrong on our side. Please try again in a moment.'
      : message || 'Something went wrong. Please try again.',
  }
}
