import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-user-emotion.ts';
import '@/ai/flows/personalized-conversation.ts';
import '@/ai/flows/generate-contextual-response.ts';