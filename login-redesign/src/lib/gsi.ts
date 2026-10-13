/** Google Identity Services script loader + minimal typings. */
export interface GsiButtonOptions {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill'
  width?: number
  logo_alignment?: 'left' | 'center'
}

export interface GsiId {
  initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void }) => void
  renderButton: (el: HTMLElement, opts: GsiButtonOptions) => void
}

export interface WindowWithGsi extends Window {
  google?: { accounts?: { id?: GsiId } }
}

let pending: Promise<void> | null = null

export function loadGsiScript(): Promise<void> {
  const w = window as WindowWithGsi
  if (w.google?.accounts?.id) return Promise.resolve()
  if (pending) return pending
  pending = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => {
      pending = null
      reject(new Error('Could not load Google sign-in (check your internet connection).'))
    }
    document.head.appendChild(s)
  })
  return pending
}
