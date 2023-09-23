export type QrCodeControlNetRequest = {
  conditioningScale: number;
  qr_code_content: '';
  image: string;
  prompt: string;
  num_inference_steps?: number;
  guidance_scale?: number;
  negative_prompt?: string;
};

export type QrCodeControlNetResponse = [string];
