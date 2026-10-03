import {createServer} from 'node:http';
import type {IncomingMessage, ServerResponse} from 'node:http';
import {fileURLToPath} from 'node:url';
import {AskInputError, handleAsk} from './ask.ts';
import {makeClient} from './bedrock.ts';

const PORT = Number(process.env.PORT ?? 8787);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const client = makeClient();
const deps = {
  client,
  clipsDir: process.env.CLIPS_DIR ?? `${ROOT}clips`,
  costLogPath: process.env.COST_LOG ?? `${ROOT}eval/cost_log.csv`,
  defaultClip: process.env.DEFAULT_CLIP ?? 'tos',
  allowOverBudget: process.env.ALLOW_OVER_BUDGET === '1',
};

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

let nextId = 0;
const server = createServer(async (req, res) => {
  const rid = ++nextId;
  const started = Date.now();
  res.on('finish', () => console.log(`#${rid} ${req.method} ${req.url} -> ${res.statusCode} ${Date.now() - started}ms`));
  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, {ok: true, mode: client.mode});
  }
  if (req.method === 'POST' && req.url === '/ask') {
    let body: unknown;
    try {
      body = await readJson(req);
    } catch {
      return send(res, 400, {error: 'invalid JSON'});
    }
    try {
      return send(res, 200, await handleAsk(body, deps));
    } catch (e) {
      if (e instanceof AskInputError) {
        return send(res, 400, {error: e.message});
      }
      console.error(`#${rid} ask failed:`, e);
      return send(res, 502, {error: 'answer service failed'});
    }
  }
  send(res, 404, {error: 'not found'});
});

server.listen(PORT, '127.0.0.1', () => console.log(`moment backend (${client.mode}) on http://127.0.0.1:${PORT}`));
