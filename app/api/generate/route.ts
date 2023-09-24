import { replicateClient } from '@/utils/ReplicateClient';
import { QrGenerateResponse } from '@/utils/service';
import { NextRequest } from 'next/server';
// import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { put } from '@vercel/blob';
import { nanoid } from '@/utils/utils';

/**
 * Validates a request object.
 *
 * @param {QrGenerateRequest} request - The request object to be validated.
 * @throws {Error} Error message if URL or prompt is missing.
 */

// const validateRequest = (request: QrGenerateRequest) => {
//   if (!request.inputImage) {
//     throw new Error('Input image is required');
//   }
//   if (!request.prompt) {
//     throw new Error('Prompt is required');
//   }
// };

// const ratelimit = new Ratelimit({
//   redis: kv,
//   // Allow 20 requests from the same IP in 1 day.
//   limiter: Ratelimit.slidingWindow(20, '1 d'),
// });

export async function POST(request: NextRequest) {
  // const reqBody = (await request.json()) as QrGenerateRequest;

  // const ip = request.ip ?? '127.0.0.1';
  // const { success } = await ratelimit.limit(ip);

  // if (!success && process.env.NODE_ENV !== 'development') {
  //   return new Response('Too many requests. Please try again after 24h.', {
  //     status: 429,
  //   });
  // }

  // try {
  //   validateRequest(reqBody);
  // } catch (e) {
  //   if (e instanceof Error) {
  //     return new Response(e.message, { status: 400 });
  //   }
  // }

  const id = nanoid();
  const startTime = performance.now();
  const data = await request.formData();
  const img = data.get('file') as File;
  const prompt = data.get('prompt') as string;
  const conditioningScale = data.get('conditioningScale') as string;

  const bytes = await img.arrayBuffer();
  const buffer = Buffer.from(bytes).toString('base64');
  const uri = `data:${img.type};base64,${buffer}`;

  let imageUrl = await replicateClient.generateQrCode({
    qr_code_content: '',
    conditioningScale: parseInt(conditioningScale) / 50,
    image: uri,
    prompt: prompt,
    num_inference_steps: 30,
    guidance_scale: 7.5,
    negative_prompt:
      'Longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, blurry, poorly drawn, bad quality, ugly, nsfw, disturbing, compressed, jpg',
  });

  const endTime = performance.now();
  const durationMS = endTime - startTime;

  // convert output to a blob object
  const file = await fetch(imageUrl).then((res) => res.blob());

  // upload & store in Vercel Blob
  const { url } = await put(`${id}.png`, file, { access: 'public' });

  await kv.hset(id, {
    prompt: prompt,
    image: url,
    model_latency: Math.round(durationMS),
    conditioningScale: conditioningScale,
  });

  const response: QrGenerateResponse = {
    image_url: url,
    model_latency_ms: Math.round(durationMS),
    id: id,
    conditioning_scale: conditioningScale,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
  });
}
