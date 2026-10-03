import {createServer} from 'node:http';

const PORT = Number(process.env.PORT ?? 8787);
const STUB_DELAY_MS = 1000;

type AskRequest = {question: string; t: number};

const send = (res: import('node:http').ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, {'content-type': 'application/json'});
  res.end(JSON.stringify(body));
};

const readJson = (req: import('node:http').IncomingMessage): Promise<unknown> =>
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

const server = createServer(async (req, res) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, {ok: true});
  }
  if (req.method === 'POST' && req.url === '/ask') {
    try {
      const body = (await readJson(req)) as Partial<AskRequest>;
      if (typeof body.question !== 'string' || typeof body.t !== 'number') {
        return send(res, 400, {error: 'expected {question: string, t: number}'});
      }
      await new Promise((r) => setTimeout(r, STUB_DELAY_MS));
      return send(res, 200, {
        answer: `Stub answer to "${body.question}" at ${body.t.toFixed(1)}s.`,
        t: body.t,
      });
    } catch {
      return send(res, 400, {error: 'invalid JSON'});
    }
  }
  send(res, 404, {error: 'not found'});
});

server.listen(PORT, '127.0.0.1', () => console.log(`moment backend (stub) on http://127.0.0.1:${PORT}`));
