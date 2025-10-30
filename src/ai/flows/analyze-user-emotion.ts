
'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing user emotion from video and audio inputs.
 *
 * - analyzeUserEmotion - A function that takes video and audio data URIs as input and returns an analysis of the user's emotional state.
 * - AnalyzeUserEmotionInput - The input type for the analyzeUserEmotion function, including video and audio data URIs.
 * - AnalyzeUserEmotionOutput - The output type for the analyzeUserEmotion function, providing a summary of the detected emotional state.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeUserEmotionInputSchema = z.object({
  videoDataUri: z
    .string()
    .optional()
    .describe(
      "A video of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  audioDataUri: z
    .string()
    .optional()
    .describe(
      "Audio recording of the user's voice, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  text: z.string().describe('The text input from the user.'),
  facialEmotion: z
    .object({
      emotion: z.string(),
      confidence: z.number(),
    })
    .optional()
    .describe('Detected facial emotion from face-api.js'),
});
export type AnalyzeUserEmotionInput = z.infer<typeof AnalyzeUserEmotionInputSchema>;

const AnalyzeUserEmotionOutputSchema = z.object({
  emotionalState: z
    .string()
    .describe('A summary of the user emotional state based on the video, audio, and text inputs.'),
  facialEmotion: z.string().optional().describe('Emotion detected from facial expression'),
  voiceEmotion: z.string().optional().describe('Emotion detected from voice/audio'),
  textEmotion: z.string().optional().describe('Emotion detected from text'),
  fusedEmotion: z.string().optional().describe('Final fused emotion from all modalities'),
});
export type AnalyzeUserEmotionOutput = z.infer<typeof AnalyzeUserEmotionOutputSchema>;

export async function analyzeUserEmotion(input: AnalyzeUserEmotionInput): Promise<AnalyzeUserEmotionOutput> {
  return analyzeUserEmotionFlow(input);
}

// Prompt for analyzing voice/audio emotion
const analyzeVoiceEmotionPrompt = ai.definePrompt({
  name: 'analyzeVoiceEmotionPrompt',
  input: {
    schema: z.object({
      audioDataUri: z.string(),
    }),
  },
  output: {
    schema: z.object({
      emotion: z.string().describe('The detected emotion from voice/audio tone'),
    }),
  },
  prompt: `You are an AI trained to analyze emotions from voice and audio.
  Listen to this audio: {{media url=audioDataUri}}
  
  Analyze the speaker's emotional tone based on:
  - Voice pitch and tone
  - Speaking pace and rhythm
  - Voice intensity and volume
  - Emotional inflections
  
  Identify the primary emotion from: Happy, Sad, Angry, Fearful, Surprised, Disgusted, Neutral, Anxious, Excited, Calm, Frustrated, Confused.
  Return only the emotion name.`,
  model: 'googleai/gemini-2.5-flash',
});

// Prompt for analyzing text emotion
const analyzeTextEmotionPrompt = ai.definePrompt({
  name: 'analyzeTextEmotionPrompt',
  input: {
    schema: z.object({
      text: z.string(),
    }),
  },
  output: {
    schema: z.object({
      emotion: z.string().describe('The detected emotion from text content'),
    }),
  },
  prompt: `You are an AI trained to analyze emotions from text.
  Analyze the emotional content of this text: "{{text}}"
  
  Consider:
  - Word choice and sentiment
  - Sentence structure and punctuation
  - Overall tone and context
  
  Identify the primary emotion from: Happy, Sad, Angry, Fearful, Surprised, Disgusted, Neutral, Anxious, Excited, Calm, Frustrated, Confused.
  Return only the emotion name.`,
  model: 'googleai/gemini-2.5-flash',
});

const analyzeUserEmotionFlow = ai.defineFlow(
  {
    name: 'analyzeUserEmotionFlow',
    inputSchema: AnalyzeUserEmotionInputSchema,
    outputSchema: AnalyzeUserEmotionOutputSchema,
  },
  async input => {
    const result: AnalyzeUserEmotionOutput = {
      emotionalState: '',
    };

    // Analyze facial emotion (already detected on client-side)
    if (input.facialEmotion) {
      result.facialEmotion = input.facialEmotion.emotion;
    }

    // Analyze voice emotion
    if (input.audioDataUri) {
      try {
        const voiceResult = await analyzeVoiceEmotionPrompt({
          audioDataUri: input.audioDataUri,
        });
        result.voiceEmotion = voiceResult.output?.emotion;
      } catch (error) {
        console.error('Error analyzing voice emotion:', error);
      }
    }

    // Analyze text emotion
    if (input.text) {
      try {
        const textResult = await analyzeTextEmotionPrompt({
          text: input.text,
        });
        result.textEmotion = textResult.output?.emotion;
      } catch (error) {
        console.error('Error analyzing text emotion:', error);
      }
    }

    // Fuse emotions (this will be done on client-side for better control)
    // For now, prioritize facial > voice > text
    result.fusedEmotion = 
      result.facialEmotion || 
      result.voiceEmotion || 
      result.textEmotion || 
      'Neutral';

    // Create emotional state summary
    const emotions = [
      result.facialEmotion && `Face: ${result.facialEmotion}`,
      result.voiceEmotion && `Voice: ${result.voiceEmotion}`,
      result.textEmotion && `Text: ${result.textEmotion}`,
    ].filter(Boolean);

    result.emotionalState = emotions.length > 0 
      ? `${result.fusedEmotion} (${emotions.join(', ')})`
      : result.fusedEmotion || 'Neutral';

    return result;
  }
);
