import {createServer} from 'node:http';
import type {IncomingMessage, ServerResponse} from 'node:http';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {AskInputError, handleAsk} from './ask.ts';
import {AnswerCache} from './cache.ts';
import {UpstreamError} from './retry.ts';
import {makeClient} from './bedrock.ts';
import {listClips} from './clips.ts';
import {Prefetcher} from './prefetch.ts';
import type {AskResponse} from './ask.ts';

const PORT = Number(process.env.PORT ?? 8787);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const client = makeClient();
const deps = {
  client,
  clipsDir: process.env.CLIPS_DIR ?? `${ROOT}clips`,
  costLogPath: process.env.COST_LOG ?? `${ROOT}eval/cost_log.csv`,
  defaultClip: process.env.DEFAULT_CLIP ?? 'tos',
  allowOverBudget: process.env.ALLOW_OVER_BUDGET === '1',
  cache: new AnswerCache(500, process.env.CACHE_FILE),
  inflight: new Map<string, Promise<AskResponse>>(),
};
const prefetcher = new Prefetcher(deps);

const send = (res: ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, {'content-type': 'application/json'});
  res.end(JSON.stringify(body));
};

const readJson = (req: IncomingMessage): Promise<unknown> =>
  new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
  });

const log = (o: Record<string, unknown>) => console.log(JSON.stringify({ts: new Date().toISOString(), ...o}));

const server = createServer(async (req, res) => {
  const incoming = req.headers['x-request-id'];
  const rid = (typeof incoming === 'string' && /^[\w-]{1,64}$/.test(incoming) ? incoming : randomUUID().slice(0, 8));
  const started = Date.now();
  res.setHeader('x-request-id', rid);
  const reply = (status: number, body: Record<string, unknown>, extra: Record<string, unknown> = {}) => {
    log({rid, method: req.method, url: req.url, status, ms: Date.now() - started, ...extra});
    return send(res, status, {...body, requestId: rid});
  };
  if (req.method === 'GET' && req.url === '/clips') {
    return reply(200, {clips: await listClips(deps.clipsDir)});
  }
  if (req.method === 'GET' && req.url === '/health') {
    return reply(200, {ok: true, mode: client.mode, cacheSize: deps.cache.size, prefetch: prefetcher.stats});
  }
  if (req.method === 'POST' && (req.url === '/prefetch' || req.url === '/prefetch/cancel')) {
    let body: {clipId?: unknown; timestamp?: unknown};
    try {
      body = (await readJson(req)) as typeof body;
    } catch {
      return reply(400, {error: 'invalid JSON'});
    }
    if (typeof body.clipId !== 'string' || typeof body.timestamp !== 'number' || !Number.isFinite(body.timestamp) || body.timestamp < 0) {
      return reply(400, {error: 'expected {clipId: string, timestamp: number}'});
    }
    if (req.url === '/prefetch/cancel') {
      return reply(200, {cancelled: prefetcher.cancel(body.clipId, body.timestamp)});
    }
    const result = await prefetcher.request(body.clipId, body.timestamp);
    return reply(202, {prefetch: result}, {prefetch: result});
  }
  if (req.method === 'POST' && req.url === '/ask') {
    let body: unknown;
    try {
      body = await readJson(req);
    } catch {
      return reply(400, {error: 'invalid JSON'});
    }
    try {
      const result = await handleAsk(body, deps, {rid});
      return reply(200, result, {source: result.source, waitedMs: result.latencyMs, cached: result.cached ?? false, attempts: result.attempts ?? 0, clip: (body as {clipId?: string}).clipId, t: result.t});
    } catch (e) {
      if (e instanceof AskInputError) {
        return reply(400, {error: e.code === 'clip' ? 'clip' : e.message, detail: e.message});
      }
      if (e instanceof UpstreamError) {
        const status = e.kind === 'timeout' ? 504 : e.kind === 'budget' ? 503 : 502;
        return reply(status, {error: e.kind, retryable: e.retryable}, {attempts: e.attempts, detail: e.message});
      }
      console.error(`${rid} ask failed:`, e);
      return reply(502, {error: 'upstream', retryable: false});
    }
  }
  reply(404, {error: 'not found'});
});

server.listen(PORT, '127.0.0.1', () => console.log(`moment backend (${client.mode}) on http://127.0.0.1:${PORT}`));
