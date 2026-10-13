import { useEffect, useRef, useState } from 'react'
import GoogleButton from './GoogleButton'
import { fetchGoogleConfig, loginWithGoogle, type Token } from '../lib/api'
import { loadGsiScript, type WindowWithGsi } from '../lib/gsi'

interface GoogleSignInProps {
  onToken: (token: Token) => void
  onError: (error: unknown) => void
  text?: 'signin_with' | 'signup_with' | 'continue_with'
}

/**
 * Renders Google's official sign-in button (the reliable flow: a popup that is
 * never suppressed like One Tap). Falls back to a disabled look-alike button
 * when Google is not configured or cannot load.
 */
export default function GoogleSignIn({ onToken, onError, text = 'continue_with' }: GoogleSignInProps) {
  const holder = useRef<HTMLDivElement>(null)
  const onTokenRef = useRef(onToken)
  const onErrorRef = useRef(onError)
  onTokenRef.current = onToken
  onErrorRef.current = onError
  const [state, setState] = useState<'loading' | 'ready' | 'off'>('loading')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const cfg = await fetchGoogleConfig()
        if (!cfg.enabled || !cfg.client_id) return setState('off')
        await loadGsiScript()
        const gid = (window as WindowWithGsi).google?.accounts?.id
        if (cancelled || !gid || !holder.current) return
        gid.initialize({
          client_id: cfg.client_id,
          callback: async (resp) => {
            try {
              onTokenRef.current(await loginWithGoogle(resp.credential))
            } catch (e) {
              onErrorRef.current(e)
            }
          },
        })
        const width = Math.min(400, Math.max(200, holder.current.parentElement?.clientWidth ?? 340))
        gid.renderButton(holder.current, {
          type: 'standard', theme: 'outline', size: 'large', text, shape: 'pill', width, logo_alignment: 'center',
        })
        setState('ready')
      } catch {
        if (!cancelled) setState('off')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [text])

  return (
    <div>
      <div ref={holder} className={state === 'ready' ? 'flex min-h-[44px] justify-center' : 'hidden'} />
      {import.meta.env.DEV && (
        <p className="mt-2 break-all text-center text-[11px] text-muted">
          Google origin check: <b>{window.location.origin}</b> must be listed under Authorized JavaScript origins.
        </p>
      )}
      {state !== 'ready' && (
        <GoogleButton
          onClick={() => undefined}
          loading={state === 'loading'}
          disabled={state === 'off'}
          disabledReason="Google sign-in is not available right now. Please use your e-mail and password."
        />
      )}
    </div>
  )
}
