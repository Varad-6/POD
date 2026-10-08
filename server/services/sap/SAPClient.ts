/**
 * SAP S/4HANA OData v2 Client
 * Connects via SAP BTP Destination Service or direct environment variables.
 * Read-Only mode: Safe for production.
 */

export interface SAPClientConfig {
  baseUrl: string;
  client: string;
  username?: string;
  password?: string;
  destinationName?: string;
}

export class SAPClient {
  private config: SAPClientConfig;

  constructor() {
    this.config = {
      baseUrl: process.env.SAP_HOST || process.env.VITE_SAP_S21_BASE_URL || '',
      client: process.env.SAP_CLIENT || process.env.VITE_SAP_S21_CLIENT || '100',
      username: process.env.SAP_USER || process.env.VITE_SAP_S21_USERNAME || '',
      password: process.env.SAP_PASSWORD || process.env.VITE_SAP_S21_PASSWORD || '',
      destinationName: process.env.SAP_DESTINATION || 'SAP_S4H_PROD',
    };
  }

  public isConfigured(): boolean {
    return Boolean(this.config.baseUrl && this.config.baseUrl.startsWith('http'));
  }

  /**
   * Executes an authorized OData v2 request against SAP S/4HANA.
   */
  async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('SAP S/4HANA client is not configured with a valid host URL.');
    }

    const query = new URLSearchParams({
      'sap-client': this.config.client,
      '$format': 'json',
      ...params,
    }).toString();

    const normalizedBase = this.config.baseUrl.endsWith('/')
      ? this.config.baseUrl.slice(0, -1)
      : this.config.baseUrl;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${normalizedBase}${normalizedPath}?${query}`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (this.config.username && this.config.password) {
      const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout per plan

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`SAP OData Error [HTTP ${res.status}]: ${errorText.slice(0, 300)}`);
      }

      const json = await res.json() as any;
      return (json?.d?.results ?? json?.d ?? json) as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('SAP S/4HANA request timed out after 10 seconds.');
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
