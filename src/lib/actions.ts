'use server';

import {
  analyzeUserEmotion,
  AnalyzeUserEmotionInput,
} from '@/ai/flows/analyze-user-emotion';
import {
  generateContextualResponse,
  GenerateContextualResponseInput,
} from '@/ai/flows/generate-contextual-response';

export async function analyzeEmotionAction(input: AnalyzeUserEmotionInput) {
  return await analyzeUserEmotion(input);
}

export async function generateResponseAction(
  input: GenerateContextualResponseInput
) {
  return await generateContextualResponse(input);
}
