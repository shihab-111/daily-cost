import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DEFAULT_PATHAO_BASE_URL = (
  process.env.PATHAO_BASE_URL || 'https://api-hermes.pathao.com'
).replace(/\/+$/, '');

interface CachedPathaoToken {
  accessToken: string;
  expiresAt: number;
}

interface PathaoMerchantConfig {
  configured: boolean;
  environment: 'production' | 'sandbox';
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  defaultStoreId: number | null;
  merchantId: string;
  merchantLabel: string;
  accountScope: 'user' | 'business' | 'default' | 'unconfigured';
}

interface RawMerchantOverride {
  baseUrl?: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  defaultStoreId?: number | string | null;
  merchantId?: string | number;
  label?: string;
}

const tokenCache = new Map<string, CachedPathaoToken>();

function parseMerchantOverrides(): Record<string, RawMerchantOverride> {
  const raw = (process.env.PATHAO_MERCHANTS_JSON || '').trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const normalized: Record<string, RawMerchantOverride> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (v && typeof v === 'object') {
        normalized[k.trim().toLowerCase()] = v as RawMerchantOverride;
      }
    }
    return normalized;
  } catch {
    return {};
  }
}

function buildPathaoConfig(
  source: RawMerchantOverride,
  accountScope: PathaoMerchantConfig['accountScope']
): PathaoMerchantConfig {
  const baseUrl = String(source.baseUrl || DEFAULT_PATHAO_BASE_URL)
    .trim()
    .replace(/\/+$/, '');
  const clientId = String(source.clientId || '').trim();
  const clientSecret = String(source.clientSecret || '').trim();
  const username = String(source.username || '').trim();
  const password = String(source.password || '').trim();
  const storeRaw = source.defaultStoreId !== undefined && source.defaultStoreId !== null
    ? String(source.defaultStoreId).trim()
    : '';
  const defaultStoreId =
    storeRaw && Number.isFinite(Number(storeRaw)) && Number(storeRaw) > 0
      ? Number(storeRaw)
      : null;
  const configured = Boolean(clientId && clientSecret && username && password);
  const environment = baseUrl.includes('sandbox') ? 'sandbox' : 'production';

  return {
    configured,
    environment,
    baseUrl,
    clientId,
    clientSecret,
    username,
    password,
    defaultStoreId,
    merchantId: String(source.merchantId || '').trim(),
    merchantLabel: String(source.label || '').trim(),
    accountScope: configured ? accountScope : 'unconfigured',
  };
}

function getHeaderString(req: express.Request, name: string): string {
  const val = req.headers[name.toLowerCase()];
  if (Array.isArray(val)) return String(val[0] || '').trim();
  return String(val || '').trim();
}

function resolvePathaoConfig(req: express.Request): PathaoMerchantConfig {
  const overrides = parseMerchantOverrides();
  const businessId = getHeaderString(req, 'x-ektally-business-id').toLowerCase();
  const userId = getHeaderString(req, 'x-ektally-user-id').toLowerCase();
  const userEmail = getHeaderString(req, 'x-ektally-user-email').toLowerCase();

  if (businessId && overrides[businessId]) {
    return buildPathaoConfig(overrides[businessId], 'business');
  }
  if (userId && overrides[userId]) {
    return buildPathaoConfig(overrides[userId], 'user');
  }
  if (userEmail && overrides[userEmail]) {
    return buildPathaoConfig(overrides[userEmail], 'user');
  }

  const isolate = String(process.env.PATHAO_ISOLATE_BY_MERCHANT || '').toLowerCase() === 'true';
  if (isolate) {
    return buildPathaoConfig({}, 'unconfigured');
  }

  return buildPathaoConfig(
    {
      baseUrl: DEFAULT_PATHAO_BASE_URL,
      clientId: process.env.PATHAO_CLIENT_ID,
      clientSecret: process.env.PATHAO_CLIENT_SECRET,
      username: process.env.PATHAO_USERNAME,
      password: process.env.PATHAO_PASSWORD,
      defaultStoreId: process.env.PATHAO_DEFAULT_STORE_ID,
      merchantId: process.env.PATHAO_MERCHANT_ID,
      label: process.env.PATHAO_MERCHANT_LABEL,
    },
    'default'
  );
}

function normalizePathaoPhone(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('8801') && digits.length === 13) {
    return digits.slice(2);
  }
  if (digits.startsWith('01') && digits.length === 11) {
    return digits;
  }
  if (digits.startsWith('1') && digits.length === 10) {
    return `0${digits}`;
  }
  return String(raw || '').trim();
}

async function getPathaoAccessToken(
  cfg: PathaoMerchantConfig,
  forceRefresh = false
): Promise<string> {
  if (!cfg.configured) {
    throw new Error(
      'Pathao Merchant API credentials are not configured on the server.'
    );
  }

  const cacheKey = `${cfg.baseUrl}::${cfg.clientId}::${cfg.username}`;
  const cached = tokenCache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() < cached.expiresAt) {
    return cached.accessToken;
  }

  const res = await fetch(`${cfg.baseUrl}/aladdin/api/v1/issue-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      username: cfg.username,
      password: cfg.password,
      grant_type: 'password',
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    message?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(
      data.message || `Pathao authentication failed (HTTP ${res.status}).`
    );
  }

  const expiresInMs = Math.max(60, (data.expires_in || 3600) - 120) * 1000;
  tokenCache.set(cacheKey, {
    accessToken: data.access_token,
    expiresAt: Date.now() + expiresInMs,
  });

  return data.access_token;
}

async function pathaoFetch(
  cfg: PathaoMerchantConfig,
  endpoint: string,
  init: RequestInit = {},
  retryOnAuth = true
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const token = await getPathaoAccessToken(cfg, false);

  const res = await fetch(`${cfg.baseUrl}${endpoint}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401 && retryOnAuth) {
    const freshToken = await getPathaoAccessToken(cfg, true);
    const retryRes = await fetch(`${cfg.baseUrl}${endpoint}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init.headers || {}),
        Authorization: `Bearer ${freshToken}`,
      },
    });
    const retryData = (await retryRes.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    return { ok: retryRes.ok, status: retryRes.status, data: retryData };
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, uptime: Math.round(process.uptime()) });
  });

  app.get('/api/pathao/status', (req, res) => {
    const cfg = resolvePathaoConfig(req);
    res.json({
      configured: cfg.configured,
      environment: cfg.environment,
      defaultStoreId: cfg.defaultStoreId,
      merchantId: cfg.merchantId,
      merchantLabel: cfg.merchantLabel,
      accountScope: cfg.accountScope,
    });
  });

  app.get('/api/pathao/stores', async (req, res) => {
    const cfg = resolvePathaoConfig(req);
    if (!cfg.configured) {
      res.status(503).json({
        error:
          'Pathao Merchant API credentials (PATHAO_CLIENT_ID, PATHAO_CLIENT_SECRET, PATHAO_USERNAME, PATHAO_PASSWORD) are not configured on the server.',
      });
      return;
    }

    try {
      const result = await pathaoFetch(cfg, '/aladdin/api/v1/stores', {
        method: 'GET',
      });
      if (!result.ok) {
        res.status(result.status).json({
          error:
            (result.data.message as string) ||
            'Unable to load Pathao pickup stores.',
          details: result.data,
        });
        return;
      }

      const stores =
        ((result.data.data as { data?: unknown[] } | undefined)?.data as
          | unknown[]
          | undefined) || [];
      res.json({ stores });
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : 'Failed to connect to Pathao Courier API.',
      });
    }
  });

  app.post('/api/pathao/orders', async (req, res) => {
    const cfg = resolvePathaoConfig(req);
    if (!cfg.configured) {
      res.status(503).json({
        error:
          'Pathao Merchant API credentials are not configured on the server.',
      });
      return;
    }

    try {
      const body = (req.body || {}) as {
        store_id?: number;
        merchant_order_id?: string;
        recipient_name?: string;
        recipient_phone?: string;
        recipient_address?: string;
        delivery_type?: number;
        item_type?: number;
        special_instruction?: string;
        item_quantity?: number;
        item_weight?: number | string;
        item_description?: string;
        amount_to_collect?: number;
      };

      const storeId = Number(body.store_id || cfg.defaultStoreId || 0);
      if (!Number.isFinite(storeId) || storeId <= 0) {
        res.status(400).json({
          error:
            'A valid Pathao Store ID is required to create a Pathao delivery order.',
        });
        return;
      }

      const recipientName = String(body.recipient_name || '').trim();
      const recipientPhone = normalizePathaoPhone(
        String(body.recipient_phone || '')
      );
      const recipientAddress = String(body.recipient_address || '').trim();

      if (!recipientName || !recipientPhone || recipientAddress.length < 10) {
        res.status(400).json({
          error:
            'Recipient name, 11-digit BD phone (01XXXXXXXXX), and full address (at least 10 characters) are required.',
        });
        return;
      }

      const payload = {
        store_id: storeId,
        merchant_order_id: String(
          body.merchant_order_id || `ORD-${Date.now()}`
        ).slice(0, 64),
        recipient_name: recipientName.slice(0, 140),
        recipient_phone: recipientPhone,
        recipient_address: recipientAddress.slice(0, 300),
        delivery_type: Number(body.delivery_type) === 12 ? 12 : 48,
        item_type: Number(body.item_type) === 1 ? 1 : 2,
        special_instruction: String(body.special_instruction || '').slice(
          0,
          300
        ),
        item_quantity: Math.max(1, Math.round(Number(body.item_quantity) || 1)),
        item_weight: String(
          Math.max(0.1, Number(body.item_weight) || 0.5)
        ),
        item_description: String(body.item_description || '').slice(0, 300),
        amount_to_collect: Math.max(
          0,
          Math.round(Number(body.amount_to_collect) || 0)
        ),
      };

      const result = await pathaoFetch(cfg, '/aladdin/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!result.ok) {
        res.status(result.status).json({
          error:
            (result.data.message as string) ||
            'Pathao rejected the parcel request.',
          details: result.data,
        });
        return;
      }

      const orderData = (result.data.data || {}) as {
        consignment_id?: string;
        merchant_order_id?: string;
        order_status?: string;
        delivery_fee?: number;
      };

      res.json({
        consignment_id: orderData.consignment_id || '',
        merchant_order_id:
          orderData.merchant_order_id || payload.merchant_order_id,
        order_status: orderData.order_status || 'Pending',
        delivery_fee: Number(orderData.delivery_fee || 0),
        raw: result.data,
      });
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : 'Unable to send parcel to Pathao.',
      });
    }
  });

  app.get('/api/pathao/orders/:consignmentId', async (req, res) => {
    const cfg = resolvePathaoConfig(req);
    if (!cfg.configured) {
      res.status(503).json({
        error:
          'Pathao Merchant API credentials are not configured on the server.',
      });
      return;
    }

    const consignmentId = String(req.params.consignmentId || '').trim();
    if (!consignmentId) {
      res.status(400).json({ error: 'Consignment ID is required.' });
      return;
    }

    try {
      const result = await pathaoFetch(
        cfg,
        `/aladdin/api/v1/orders/${encodeURIComponent(consignmentId)}/info`,
        { method: 'GET' }
      );
      if (!result.ok) {
        res.status(result.status).json({
          error:
            (result.data.message as string) ||
            'Unable to fetch Pathao parcel info.',
          details: result.data,
        });
        return;
      }

      const info = (result.data.data || {}) as {
        consignment_id?: string;
        order_status?: string;
        order_status_slug?: string;
        updated_at?: string;
      };

      res.json({
        consignment_id: info.consignment_id || consignmentId,
        order_status: info.order_status || info.order_status_slug || 'Pending',
        updated_at: info.updated_at || '',
      });
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : 'Unable to fetch parcel tracking from Pathao.',
      });
    }
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    const assetsDir = path.join(distDir, 'assets');
    if (fs.existsSync(assetsDir)) {
      app.use(
        '/assets',
        express.static(assetsDir, {
          maxAge: '1y',
          immutable: true,
        })
      );
    }

    app.use(
      express.static(distDir, {
        index: false,
        setHeaders: (res, filePath) => {
          const base = path.basename(filePath);
          if (
            base === 'index.html' ||
            base === 'sw.js' ||
            base === 'registerSW.js' ||
            base === 'manifest.webmanifest'
          ) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        },
      })
    );

    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
