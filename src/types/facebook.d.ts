interface FacebookAuthResponse {
  accessToken?: string
  code?: string
  expiresIn?: number
  signedRequest?: string
  userID?: string
}

interface FacebookLoginResponse {
  authResponse?: FacebookAuthResponse
  status?: string
}

interface FacebookLoginOptions {
  config_id?: string
  response_type?: string
  override_default_response_type?: boolean
  extras?: Record<string, unknown>
  scope?: string
}

interface FacebookStatic {
  init(params: {
    appId: string
    autoLogAppEvents?: boolean
    xfbml?: boolean
    version: string
  }): void
  login(
    callback: (response: FacebookLoginResponse) => void,
    options?: FacebookLoginOptions
  ): void
}

interface Window {
  FB?: FacebookStatic
  fbAsyncInit?: () => void
}
