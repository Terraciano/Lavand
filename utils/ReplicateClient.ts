import { getEnv, ENV_KEY } from '@/utils/env';
import Replicate from 'replicate';
import { QrCodeControlNetRequest, QrCodeControlNetResponse } from './types';

export class ReplicateClient {
  replicate: Replicate;

  constructor(apiKey: string) {
    this.replicate = new Replicate({
      auth: apiKey,
    });
  }

  generateQrCode = async (
    request: QrCodeControlNetRequest,
  ): Promise<string> => {
    const output = (await this.replicate.run(
      'andreasjansson/illusion:75d51a73fce3c00de31ed9ab4358c73e8fc0f627dc8ce975818e653317cb919b',
      {
        input: {
          qr_code_content: '',
          image: request.image,
          prompt: request.prompt,
          num_inference_steps: 40,
          guidance_scale: 7.5,
          seed: -1,
          negative_prompt: request.negative_prompt,
          controlnet_conditioning_scale: request.conditioningScale,
        },
      },
    )) as QrCodeControlNetResponse;

    if (!output) {
      throw new Error('Failed to generate image');
    }

    return output[0];
  };
}

const apiKey = getEnv(ENV_KEY.REPLICATE_API_KEY);
if (!apiKey) {
  throw new Error('REPLICATE_API_KEY is not set');
}
export const replicateClient = new ReplicateClient(apiKey);
