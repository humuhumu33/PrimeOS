import type { PrimeRegistryModel } from './registry';
import { StreamingChunk, StreamingOptions, StreamProcessor, Factor } from './types';
import { createPrimeStreamImpl } from './prime-stream';
import { createFactorStreamImpl } from './factor-stream';

export function createStreamProcessorImpl(
  registry: PrimeRegistryModel,
  options: StreamingOptions = {}
): StreamProcessor {
  return {
    factorizeStreaming: async (
      stream: AsyncIterable<StreamingChunk> | StreamingChunk[]
    ): Promise<Factor[]> => {
      let number: bigint;
      if (Array.isArray(stream)) {
        if (stream.length === 0) {
          throw new Error('Empty stream provided');
        }
        const chunk = stream[0];
        if (typeof chunk.data === 'bigint') {
          number = chunk.data;
        } else if (chunk.data instanceof Uint8Array) {
          number = BigInt(
            '0x' + Array.from(chunk.data).map(b => b.toString(16).padStart(2, '0')).join('')
          );
        } else {
          throw new Error(`Unsupported chunk data type: ${typeof chunk.data}`);
        }
      } else {
        let firstChunk: StreamingChunk | undefined;
        for await (const chunk of stream) {
          firstChunk = chunk;
          break;
        }
        if (!firstChunk) {
          throw new Error('Empty stream provided');
        }
        if (typeof firstChunk.data === 'bigint') {
          number = firstChunk.data;
        } else if (firstChunk.data instanceof Uint8Array) {
          number = BigInt(
            '0x' + Array.from(firstChunk.data as Uint8Array)
              .map(b => b.toString(16).padStart(2, '0'))
              .join('')
          );
        } else {
          throw new Error(`Unsupported chunk data type: ${typeof firstChunk.data}`);
        }
      }
      return registry.factor(number);
    },

    transformStreaming: async (
      stream: AsyncIterable<StreamingChunk> | StreamingChunk[]
    ): Promise<StreamingChunk[]> => {
      if (Array.isArray(stream)) {
        return [...stream];
      }
      const chunks: StreamingChunk[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return chunks;
    }
  };
}

export async function factorizeStreamingImpl(
  registry: PrimeRegistryModel,
  stream: AsyncIterable<StreamingChunk> | StreamingChunk[]
): Promise<Factor[]> {
  const processor = createStreamProcessorImpl(registry);
  return processor.factorizeStreaming(stream);
}
