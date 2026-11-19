import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserRepo, UserRow, TenantRow } from '../repositories/userRepo';
import { getJwtSecret } from '../config/secrets';

export interface OAuthStatePayload {
  provider: 'google' | 'github';
  nonce: string;
  timestamp: number;
  redirectUri: string;
}

export class OAuthService {
  /**
   * Generates a tamper-proof signed state parameter.
   */
  static generateState(provider: 'google' | 'github', redirectUri: string): string {
    const payload: OAuthStatePayload = {
      provider,
      nonce: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
      redirectUri,
    };
    const json = JSON.stringify(payload);
    const dataB64 = Buffer.from(json, 'utf-8').toString('base64url');
    const signature = crypto.createHmac('sha256', getJwtSecret()).update(dataB64).digest('base64url');
    return `${dataB64}.${signature}`;
  }

  /**
   * Verifies and decodes the state parameter. Valid for 10 minutes.
   */
  static verifyState(state: string, expectedProvider: 'google' | 'github'): OAuthStatePayload | null {
    if (!state || typeof state !== 'string' || !state.includes('.')) return null;

    const [dataB64, signature] = state.split('.');
    if (!dataB64 || !signature) return null;

    const expectedSig = crypto.createHmac('sha256', getJwtSecret()).update(dataB64).digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    try {
      const json = Buffer.from(dataB64, 'base64url').toString('utf-8');
      const payload = JSON.parse(json) as OAuthStatePayload;

      if (payload.provider !== expectedProvider) return null;
      // 10 minutes max age
      if (Date.now() - payload.timestamp > 10 * 60 * 1000) return null;

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Checks whether Google OAuth environment credentials are configured.
   */
  static isGoogleConfigured(): boolean {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    return Boolean(clientId && clientSecret && !clientId.startsWith('your_') && !clientSecret.startsWith('your_'));
  }

  /**
   * Checks whether GitHub OAuth environment credentials are configured.
   */
  static isGitHubConfigured(): boolean {
    const clientId = process.env.GITHUB_CLIENT_ID?.trim();
    const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
    return Boolean(clientId && clientSecret && !clientId.startsWith('your_') && !clientSecret.startsWith('your_'));
  }

  /**
   * Builds the Google Authorization URL.
   */
  static getGoogleAuthUrl(redirectUri: string): { url: string; state: string } {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is not configured in server environment variables.');
    }

    const state = this.generateState('google', redirectUri);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state,
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      state,
    };
  }

  /**
   * Exchanges authorization code for Google tokens.
   */
  static async exchangeGoogleCode(code: string, redirectUri: string): Promise<string> {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET) are missing.');
    }

    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await res.json();
    if (!res.ok || !data.access_token) {
      console.error('Google token exchange error:', data);
      throw new Error(data.error_description || data.error || 'Failed to exchange authorization code with Google.');
    }

    return data.access_token;
  }

  /**
   * Fetches Google user profile using the access token.
   */
  static async fetchGoogleUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    name: string;
    picture?: string;
    emailVerified: boolean;
  }> {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();
    if (!res.ok || !data.id || !data.email) {
      console.error('Google userinfo fetch error:', data);
      throw new Error('Unable to retrieve profile information from Google.');
    }

    return {
      id: String(data.id),
      email: String(data.email).toLowerCase(),
      name: data.name || data.email.split('@')[0],
      picture: data.picture,
      emailVerified: Boolean(data.verified_email),
    };
  }

  /**
   * Builds the GitHub Authorization URL.
   */
  static getGithubAuthUrl(redirectUri: string): { url: string; state: string } {
    const clientId = process.env.GITHUB_CLIENT_ID?.trim();
    if (!clientId) {
      throw new Error('GITHUB_CLIENT_ID is not configured in server environment variables.');
    }

    const state = this.generateState('github', redirectUri);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'read:user user:email',
      state,
    });

    return {
      url: `https://github.com/login/oauth/authorize?${params.toString()}`,
      state,
    };
  }

  /**
   * Exchanges authorization code for GitHub access token.
   */
  static async exchangeGithubCode(code: string, redirectUri: string): Promise<string> {
    const clientId = process.env.GITHUB_CLIENT_ID?.trim();
    const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();

    if (!clientId || !clientSecret) {
      throw new Error('GitHub OAuth credentials (GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET) are missing.');
    }

    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error || !data.access_token) {
      console.error('GitHub token exchange error:', data);
      throw new Error(data.error_description || data.error || 'Failed to exchange authorization code with GitHub.');
    }

    return data.access_token;
  }

  /**
   * Fetches GitHub user profile and verified email.
   */
  static async fetchGithubUserInfo(accessToken: string): Promise<{
    id: string;
    login: string;
    name: string;
    email: string;
    avatarUrl?: string;
  }> {
    // 1. Fetch main user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'NomadsChat-OAuth-Agent',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const userData = await userRes.json();
    if (!userRes.ok || !userData.id) {
      console.error('GitHub user profile error:', userData);
      throw new Error('Unable to retrieve profile from GitHub.');
    }

    let resolvedEmail = userData.email ? String(userData.email).toLowerCase() : '';

    // 2. If email is private or null, fetch from /user/emails
    if (!resolvedEmail) {
      try {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'NomadsChat-OAuth-Agent',
            Accept: 'application/vnd.github.v3+json',
          },
        });
        if (emailsRes.ok) {
          const emailsList = await emailsRes.json();
          if (Array.isArray(emailsList) && emailsList.length > 0) {
            // Find primary and verified email first
            const primaryVerified = emailsList.find((e: any) => e.primary && e.verified);
            const verified = emailsList.find((e: any) => e.verified);
            const selected = primaryVerified || verified || emailsList[0];
            if (selected?.email) {
              resolvedEmail = String(selected.email).toLowerCase();
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch GitHub user emails list:', err);
      }
    }

    // Fallback if user has no visible emails
    if (!resolvedEmail) {
      resolvedEmail = `${userData.login.toLowerCase()}@users.noreply.github.com`;
    }

    return {
      id: String(userData.id),
      login: String(userData.login),
      name: userData.name || userData.login,
      email: resolvedEmail,
      avatarUrl: userData.avatar_url,
    };
  }

  /**
   * Resolves, links, or creates a user account & tenant from OAuth identity, returning a JWT.
   */
  static async processOAuthLogin(params: {
    provider: 'google' | 'github';
    providerUserId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }): Promise<{ user: UserRow; tenant: TenantRow; token: string; isNewUser: boolean }> {
    const { provider, providerUserId, email, name, avatarUrl } = params;
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0];

    // 1. Try finding by existing OAuth link
    let user = await UserRepo.findUserByOAuth(provider, providerUserId);
    let isNewUser = false;

    if (!user) {
      // 2. Try finding by email (account linking)
      user = await UserRepo.findUserByEmail(cleanEmail);

      if (user) {
        // Link existing user to this OAuth provider
        await UserRepo.linkOAuthAccount(user.id, provider, providerUserId, cleanEmail);
      } else {
        // 3. Brand new user & tenant creation
        isNewUser = true;
        const tenantId = 'tenant_' + Date.now();
        const userId = 'usr_' + Date.now();
        const now = new Date().toISOString();
        const trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

        // Create tenant with 3-day Pro trial
        await UserRepo.createTenant({
          id: tenantId,
          name: `${cleanName}'s Workspace`,
          owner_email: cleanEmail,
          plan: 'Pro',
          created_at: now,
          trial_started_at: now,
          trial_ends_at: trialEndsAt,
          subscription_status: 'trialing',
          payment_method_on_file: 0,
        });

        // Generate strong random hash for social user
        const socialPasswordHash = await bcrypt.hash(`oauth_${provider}_${crypto.randomBytes(24).toString('hex')}`, 10);

        user = await UserRepo.createUser({
          id: userId,
          email: cleanEmail,
          name: cleanName,
          password_hash: socialPasswordHash,
          tenant_id: tenantId,
          role: 'owner',
          created_at: now,
        });

        // Link OAuth account
        await UserRepo.linkOAuthAccount(userId, provider, providerUserId, cleanEmail);
      }
    } else {
      // Refresh OAuth record link
      await UserRepo.linkOAuthAccount(user.id, provider, providerUserId, cleanEmail);
    }

    // Load or resolve tenant
    let tenant = await UserRepo.findTenantById(user.tenant_id);
    if (!tenant) {
      tenant = {
        id: user.tenant_id,
        name: `${user.name}'s Workspace`,
        owner_email: user.email,
        plan: 'Pro',
        created_at: new Date().toISOString(),
      };
    }

    // Generate authenticated JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenant_id,
        role: user.role,
        avatarUrl,
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return { user, tenant, token, isNewUser };
  }

  /**
   * Generates the popup callback HTML response that communicates back to window.opener via postMessage.
   */
  static renderCallbackHtml(result: {
    success: boolean;
    provider?: string;
    token?: string;
    user?: any;
    tenant?: any;
    error?: string;
  }): string {
    const payload = result.success
      ? {
          type: 'OAUTH_AUTH_SUCCESS',
          provider: result.provider,
          token: result.token,
          user: result.user,
          tenant: result.tenant,
        }
      : {
          type: 'OAUTH_AUTH_ERROR',
          provider: result.provider,
          error: result.error || 'Authentication failed. Please try again.',
        };

    const serializedPayload = JSON.stringify(payload).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${result.success ? 'Authentication Complete' : 'Authentication Error'} - NomadsChat</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #09090b;
      color: #fafafa;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 360px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #27272a;
      border-top-color: #fafafa;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 {
      font-size: 16px;
      font-weight: 700;
      margin: 0 0 8px;
    }
    p {
      font-size: 13px;
      color: #a1a1aa;
      margin: 0;
      line-height: 1.5;
    }
    .error-text {
      color: #f87171;
    }
  </style>
</head>
<body>
  <div class="card">
    ${
      result.success
        ? `<div class="spinner"></div>
           <h2>Authentication Successful</h2>
           <p>Connecting to your workspace. This window will close automatically...</p>`
        : `<h2 class="error-text">Authentication Failed</h2>
           <p class="error-text">${result.error || 'Authorization was cancelled or encountered an error.'}</p>
           <p style="margin-top: 12px; font-size: 11px;">You may close this window and retry.</p>`
    }
  </div>

  <script>
    (function() {
      var data = ${serializedPayload};
      if (window.opener) {
        try {
          window.opener.postMessage(data, '*');
        } catch (e) {
          console.error('Failed to postMessage to opener:', e);
        }
        setTimeout(function() {
          try {
            window.close();
          } catch(e) {}
        }, 400);
      } else {
        // Direct navigation fallback
        if (data.type === 'OAUTH_AUTH_SUCCESS' && data.token) {
          try {
            localStorage.setItem('auth_token', data.token);
          } catch(e) {}
          window.location.href = '/';
        }
      }
    })();
  </script>
</body>
</html>`;
  }
}
