let sdkPromise: Promise<FacebookStatic> | null = null

export function initMetaSdk(): void {
  const appId = import.meta.env.VITE_META_APP_ID as string | undefined
  if (!appId || sdkPromise) return

  sdkPromise = new Promise((resolve, reject) => {
    window.fbAsyncInit = function () {
      window.FB!.init({
        appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v18.0',
      })
      resolve(window.FB!)
    }

    if (window.FB) {
      window.fbAsyncInit()
      return
    }

    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script')
      script.id = 'facebook-jssdk'
      script.src = 'https://connect.facebook.net/en_US/sdk.js'
      script.async = true
      script.defer = true
      script.crossOrigin = 'anonymous'
      script.onerror = () => reject(new Error('Failed to load Meta SDK'))
      document.body.appendChild(script)
    }
  })
}

export async function launchWhatsAppEmbeddedSignup(): Promise<string> {
  const configId = import.meta.env.VITE_META_CONFIG_ID as string | undefined
  if (!configId) {
    throw new Error('WhatsApp signup is not configured (missing VITE_META_CONFIG_ID)')
  }

  initMetaSdk()
  if (!sdkPromise) {
    throw new Error('Meta App ID is not configured (missing VITE_META_APP_ID)')
  }

  const FB = await sdkPromise

  return new Promise((resolve, reject) => {
    FB.login(
      (response) => {
        const code = response.authResponse?.code
        if (code) {
          resolve(code)
          return
        }
        reject(new Error('WhatsApp signup was cancelled'))
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: '3',
        },
      }
    )
  })
}
