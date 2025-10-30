'use server';

/**
 * @fileOverview Personalized Conversational AI flow that remembers past conversations.
 *
 * - personalizedConversation - A function that handles the conversational flow with memory.
 * - PersonalizedConversationInput - The input type for the personalizedConversation function.
 * - PersonalizedConversationOutput - The return type for the personalizedConversation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const PersonalizedConversationInputSchema = z.object({
  userInput: z.string().describe('The user input text.'),
  conversationHistory: z.string().optional().describe('The history of the conversation.'),
  videoDataUri: z.string().optional().describe(
    "A photo of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  audioDataUri: z.string().optional().describe(
    "An audio recording of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type PersonalizedConversationInput = z.infer<typeof PersonalizedConversationInputSchema>;

const PersonalizedConversationOutputSchema = z.object({
  aiResponse: z.string().describe('The AI response to the user input.'),
  updatedConversationHistory: z.string().describe('The updated conversation history.'),
  aiAudioResponse: z.string().describe('The AI audio response to the user input in base64 WAV format'),
});
export type PersonalizedConversationOutput = z.infer<typeof PersonalizedConversationOutputSchema>;

export async function personalizedConversation(input: PersonalizedConversationInput): Promise<PersonalizedConversationOutput> {
  return personalizedConversationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedConversationPrompt',
  input: {schema: PersonalizedConversationInputSchema},
  output: {schema: PersonalizedConversationOutputSchema},
  prompt: `You are EmotiMate, a personalized AI assistant designed to help users with their emotional well-being.
  You should remember past conversations and use that context to provide relevant and helpful responses.
  Consider the user's emotion based on their video and audio inputs to tailor your responses to be empathetic and supportive.

  Here's the conversation history:
  {{conversationHistory}}

  User input: {{userInput}}

  Respond in a human-like voice and generate an audio response.
  Include the updated conversation history in the output.
`,
});

const personalizedConversationFlow = ai.defineFlow(
  {
    name: 'personalizedConversationFlow',
    inputSchema: PersonalizedConversationInputSchema,
    outputSchema: PersonalizedConversationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);

    const ttsResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash-preview-tts',
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: output?.aiResponse ?? ''
      });

      let aiAudioResponse = '';
      if (ttsResponse.media) {
        const audioBuffer = Buffer.from(
          ttsResponse.media.url.substring(ttsResponse.media.url.indexOf(',') + 1),
          'base64'
        );
        aiAudioResponse = 'data:audio/wav;base64,' + (await toWav(audioBuffer));
      }

    return {
      aiResponse: output!.aiResponse,
      updatedConversationHistory: (input.conversationHistory || '') + '\n' + 'User: ' + input.userInput + '\n' + 'AI: ' + output!.aiResponse,
      aiAudioResponse,
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
