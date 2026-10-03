export type VisionRequest = {system: string; user: string; images: Uint8Array[]};
export type VisionResult = {text: string; inputTokens: number; outputTokens: number; model: string};

export interface VisionClient {
  readonly mode: 'stub' | 'live';
  readonly region: string;
  answer(req: VisionRequest): Promise<VisionResult>;
}

// Rough token estimate until the first live call calibrates it (UNVERIFIED: ~800 tokens/image).
const TOKENS_PER_IMAGE = 800;

export class StubClient implements VisionClient {
  readonly mode = 'stub' as const;
  readonly region = 'none';
  private delayMs: number;
  constructor(delayMs = 800) {
    this.delayMs = delayMs;
  }
  async answer(req: VisionRequest): Promise<VisionResult> {
    await new Promise((r) => setTimeout(r, this.delayMs));
    return {
      text: `Stub answer: no model was called (${req.images.length} frames selected).`,
      inputTokens: req.images.length * TOKENS_PER_IMAGE + Math.ceil((req.system.length + req.user.length) / 4),
      outputTokens: 20,
      model: 'stub',
    };
  }
}

// Calls Amazon Bedrock Converse. The AWS SDK is imported lazily so stub mode and tests need no install:
//   cd backend && npm install @aws-sdk/client-bedrock-runtime
export class LiveClient implements VisionClient {
  readonly mode = 'live' as const;
  readonly region: string;
  private modelId: string;
  private timeoutMs: number;
  constructor(modelId: string, region: string, timeoutMs = 6000) {
    this.modelId = modelId;
    this.region = region;
    this.timeoutMs = timeoutMs;
  }
  async answer(req: VisionRequest): Promise<VisionResult> {
    let sdk: typeof import('@aws-sdk/client-bedrock-runtime');
    try {
      sdk = await import('@aws-sdk/client-bedrock-runtime');
    } catch {
      throw new Error('BEDROCK_MODE=live needs: cd backend && npm install @aws-sdk/client-bedrock-runtime');
    }
    const client = new sdk.BedrockRuntimeClient({region: this.region});
    const res = await client.send(
      new sdk.ConverseCommand({
        modelId: this.modelId,
        system: [{text: req.system}],
        messages: [
          {
            role: 'user',
            content: [
              ...req.images.map((bytes) => ({image: {format: 'jpeg' as const, source: {bytes}}})),
              {text: req.user},
            ],
          },
        ],
        inferenceConfig: {maxTokens: 120, temperature: 0.2},
      }),
      {abortSignal: AbortSignal.timeout(this.timeoutMs)},
    );
    const text = res.output?.message?.content?.map((c) => c.text ?? '').join(' ') ?? '';
    return {
      text,
      inputTokens: res.usage?.inputTokens ?? 0,
      outputTokens: res.usage?.outputTokens ?? 0,
      model: this.modelId,
    };
  }
}

export const makeClient = (env: Record<string, string | undefined> = process.env): VisionClient => {
  if ((env.BEDROCK_MODE ?? 'stub') === 'live') {
    return new LiveClient(env.BEDROCK_MODEL_ID ?? 'amazon.nova-lite-v1:0', env.AWS_REGION ?? 'us-east-1');
  }
  return new StubClient(Number(env.STUB_DELAY_MS ?? 800));
};
