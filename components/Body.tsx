'use client';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCallback, useEffect, useState } from 'react';
import { QrGenerateResponse } from '@/utils/service';
import { AiIllusion } from '@/components/AiIllusion';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import LoadingDots from '@/components/ui/loadingdots';
import downloadQrCode from '@/utils/downloadQrCode';
import va from '@vercel/analytics';
import { PromptSuggestion } from '@/components/PromptSuggestion';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { FileInput, MantineProvider, Slider } from '@mantine/core';

const promptSuggestions = [
  'A bowl of spaghetti',
  'Illustration of a city',
  'A forest overlooking a mountain',
  'A saharan desert',
];

const generateFormSchema = z.object({
  inputImage: z.instanceof(File),
  prompt: z.string().min(3).max(160),
  conditioningScale: z.number(),
});

type GenerateFormValues = z.infer<typeof generateFormSchema>;

const Body = ({
  imageUrl,
  prompt,
  redirectUrl,
  modelLatency,
  id,
  conditioningScale,
}: {
  imageUrl?: string;
  prompt?: string;
  redirectUrl?: string;
  modelLatency?: number;
  id?: string;
  conditioningScale?: number;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [response, setResponse] = useState<QrGenerateResponse | null>(null);
  const router = useRouter();

  const form = useForm<GenerateFormValues>({
    resolver: zodResolver(generateFormSchema),
    mode: 'onChange',

    // Set default values so that the form inputs are controlled components.
    defaultValues: {
      inputImage: new File([], ''),
      prompt: '',
      conditioningScale: 50,
    },
  });

  useEffect(() => {
    if (imageUrl && modelLatency && id && prompt && conditioningScale) {
      setResponse({
        image_url: imageUrl,
        model_latency_ms: modelLatency,
        id: id,
        conditioning_scale: conditioningScale.toString(),
      });

      form.setValue('prompt', prompt);
      form.setValue('conditioningScale', conditioningScale);
    }
  }, [
    imageUrl,
    modelLatency,
    prompt,
    redirectUrl,
    id,
    form,
    conditioningScale,
  ]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      form.setValue('prompt', suggestion);
    },
    [form],
  );

  const handleSubmit = useCallback(
    async (values: GenerateFormValues) => {
      setIsLoading(true);
      setResponse(null);

      try {
        const fd = new FormData();
        fd.append('file', values.inputImage);
        fd.append('prompt', values.prompt);
        fd.append('conditioningScale', values.conditioningScale.toString());

        const response = await fetch('/api/generate', {
          method: 'POST',
          body: fd,
        });

        // Handle API errors.
        if (!response.ok || response.status !== 200) {
          const text = await response.text();
          throw new Error(
            `Failed to generate Image: ${response.status}, ${text}`,
          );
        }

        const data = await response.json();

        va.track('Generated Image', {
          prompt: values.prompt,
        });

        router.push(`/start/${data.id}`);
      } catch (error) {
        va.track('Failed to generate', {
          prompt: values.prompt,
        });
        if (error instanceof Error) {
          setError(error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  return (
    <MantineProvider>
      <div className="flex justify-center items-center flex-col w-full lg:p-0 p-4 sm:mb-28 mb-0">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 mt-10">
          <div className="col-span-1">
            <h1 className="text-3xl font-bold mb-10">
              Generate an AI Illusion
            </h1>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name="inputImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FileInput
                            accept={'.png, .webp'}
                            label={'Select image: '}
                            placeholder={'optical-illusion.png'}
                            {...field}
                            onChange={(file) => {
                              file && form.setValue('inputImage', file);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          This is your base image.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prompt</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="A city view with clouds"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="">
                          This is what the final image will look like
                        </FormDescription>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="conditioningScale"
                    render={() => (
                      <FormItem>
                        <FormLabel>Conditioning Scale</FormLabel>
                        <FormControl>
                          <Slider
                            color={'dark'}
                            defaultValue={conditioningScale ?? 50}
                            max={100}
                            onChange={(value) => {
                              form.setValue('conditioningScale', value);
                            }}
                          />
                        </FormControl>
                        <FormDescription className="">
                          This is how close to your input image the output is
                          going to look.
                        </FormDescription>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="my-2">
                    <p className="text-sm font-medium mb-3">
                      Prompt suggestions
                    </p>
                    <div className="grid sm:grid-cols-2 grid-cols-1 gap-3 text-center text-gray-500 text-sm">
                      {promptSuggestions.map((suggestion) => (
                        <PromptSuggestion
                          key={suggestion}
                          suggestion={suggestion}
                          onClick={() => handleSuggestionClick(suggestion)}
                          isLoading={isLoading}
                        />
                      ))}
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex justify-center
                 max-w-[200px] mx-auto w-full"
                  >
                    {isLoading ? (
                      <LoadingDots color="white" />
                    ) : response ? (
                      '✨ Regenerate'
                    ) : (
                      'Generate'
                    )}
                  </Button>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </form>
            </Form>
          </div>
          <div className="col-span-1">
            {imageUrl && (
              <>
                <h1 className="text-3xl font-bold sm:mb-5 mb-5 mt-5 sm:mt-0 sm:text-center text-left">
                  Your AI Illusion
                </h1>
                <div>
                  <div className="flex flex-col justify-center relative h-auto items-center">
                    {response ? (
                      <AiIllusion
                        imageURL={imageUrl}
                        time={(response.model_latency_ms / 1000).toFixed(2)}
                      />
                    ) : (
                      <div className="relative flex flex-col justify-center items-center gap-y-2 w-[510px] border border-gray-300 rounded shadow group p-2 mx-auto animate-pulse bg-gray-400 aspect-square max-w-full" />
                    )}
                  </div>
                  {response && (
                    <div className="flex justify-center gap-5 mt-4">
                      <Button
                        onClick={() =>
                          downloadQrCode(response.image_url, 'lavand-illusion')
                        }
                      >
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `https://qrgpt.io/start/${id || ''}`,
                          );
                          toast.success('Link copied to clipboard');
                        }}
                      >
                        ✂️ Share
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <Toaster />
      </div>
    </MantineProvider>
  );
};

export default Body;
