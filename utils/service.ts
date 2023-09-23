export interface QrGenerateRequest {
  inputImage: any;

  prompt: string;

  qr_conditioning_scale?: number;

  num_inference_steps?: number;
}

export interface QrGenerateResponse {
  image_url: string;

  model_latency_ms: number;

  id: string;

  conditioning_scale: string;
}
