/**
 * Multi-modal emotion fusion system
 * Combines emotions from facial expressions, voice/audio, and text analysis
 */

export interface EmotionScore {
  emotion: string;
  confidence: number;
}

export interface MultiModalEmotionInput {
  facialEmotion?: EmotionScore | null;
  voiceEmotion?: string | null;
  textEmotion?: string | null;
}

export interface FusedEmotionResult {
  finalEmotion: string;
  confidence: number;
  breakdown: {
    facial?: string;
    voice?: string;
    text?: string;
  };
  fusionMethod: string;
}

/**
 * Standardized emotion labels
 */
const STANDARD_EMOTIONS = [
  'Happy',
  'Sad',
  'Angry',
  'Fearful',
  'Surprised',
  'Disgusted',
  'Neutral',
  'Anxious',
  'Excited',
  'Calm',
  'Frustrated',
  'Confused',
];

/**
 * Normalize emotion string to standard format
 */
function normalizeEmotion(emotion: string): string {
  const normalized = emotion.trim();
  
  // Find best match in standard emotions (case-insensitive)
  const match = STANDARD_EMOTIONS.find(
    std => std.toLowerCase() === normalized.toLowerCase()
  );
  
  if (match) return match;
  
  // Check for partial matches or synonyms
  const lowerEmotion = normalized.toLowerCase();
  
  if (lowerEmotion.includes('happ') || lowerEmotion.includes('joy')) return 'Happy';
  if (lowerEmotion.includes('sad') || lowerEmotion.includes('depress')) return 'Sad';
  if (lowerEmotion.includes('ang') || lowerEmotion.includes('mad')) return 'Angry';
  if (lowerEmotion.includes('fear') || lowerEmotion.includes('scared')) return 'Fearful';
  if (lowerEmotion.includes('surpris') || lowerEmotion.includes('shock')) return 'Surprised';
  if (lowerEmotion.includes('disgust')) return 'Disgusted';
  if (lowerEmotion.includes('neutr') || lowerEmotion.includes('calm')) return 'Neutral';
  if (lowerEmotion.includes('anxi') || lowerEmotion.includes('worr')) return 'Anxious';
  if (lowerEmotion.includes('excit')) return 'Excited';
  if (lowerEmotion.includes('frustrat')) return 'Frustrated';
  if (lowerEmotion.includes('confus')) return 'Confused';
  
  // Return capitalized version if no match found
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Extract emotion from AI-generated text response
 */
function extractEmotionFromText(text: string): string | null {
  if (!text) return null;
  
  const lowerText = text.toLowerCase();
  
  // Look for explicit emotion mentions
  for (const emotion of STANDARD_EMOTIONS) {
    if (lowerText.includes(emotion.toLowerCase())) {
      return emotion;
    }
  }
  
  // Look for emotion-related keywords
  if (lowerText.includes('happy') || lowerText.includes('joy')) return 'Happy';
  if (lowerText.includes('sad') || lowerText.includes('unhappy')) return 'Sad';
  if (lowerText.includes('angry') || lowerText.includes('upset')) return 'Angry';
  if (lowerText.includes('afraid') || lowerText.includes('scared')) return 'Fearful';
  if (lowerText.includes('surprised') || lowerText.includes('amazed')) return 'Surprised';
  if (lowerText.includes('disgusted')) return 'Disgusted';
  if (lowerText.includes('neutral') || lowerText.includes('calm')) return 'Neutral';
  if (lowerText.includes('anxious') || lowerText.includes('worried')) return 'Anxious';
  if (lowerText.includes('excited')) return 'Excited';
  if (lowerText.includes('frustrated')) return 'Frustrated';
  if (lowerText.includes('confused')) return 'Confused';
  
  return null;
}

/**
 * Weighted voting fusion strategy
 * Facial expressions are given higher weight as they're more reliable
 */
function weightedVotingFusion(input: MultiModalEmotionInput): FusedEmotionResult {
  const emotionVotes: Record<string, number> = {};
  const breakdown: FusedEmotionResult['breakdown'] = {};
  
  // Facial emotion (weight: 0.5 if high confidence, 0.3 otherwise)
  if (input.facialEmotion) {
    const facialWeight = input.facialEmotion.confidence > 0.6 ? 0.5 : 0.3;
    const emotion = normalizeEmotion(input.facialEmotion.emotion);
    emotionVotes[emotion] = (emotionVotes[emotion] || 0) + facialWeight;
    breakdown.facial = emotion;
  }
  
  // Voice emotion (weight: 0.3)
  if (input.voiceEmotion) {
    const emotion = normalizeEmotion(extractEmotionFromText(input.voiceEmotion) || input.voiceEmotion);
    emotionVotes[emotion] = (emotionVotes[emotion] || 0) + 0.3;
    breakdown.voice = emotion;
  }
  
  // Text emotion (weight: 0.2)
  if (input.textEmotion) {
    const emotion = normalizeEmotion(extractEmotionFromText(input.textEmotion) || input.textEmotion);
    emotionVotes[emotion] = (emotionVotes[emotion] || 0) + 0.2;
    breakdown.text = emotion;
  }
  
  // Find emotion with highest vote
  const sortedEmotions = Object.entries(emotionVotes).sort((a, b) => b[1] - a[1]);
  
  if (sortedEmotions.length === 0) {
    return {
      finalEmotion: 'Neutral',
      confidence: 0.5,
      breakdown,
      fusionMethod: 'weighted-voting',
    };
  }
  
  const [finalEmotion, score] = sortedEmotions[0];
  
  return {
    finalEmotion,
    confidence: Math.min(score, 1.0),
    breakdown,
    fusionMethod: 'weighted-voting',
  };
}

/**
 * Majority voting fusion strategy
 * Simple majority vote across all modalities
 */
function majorityVotingFusion(input: MultiModalEmotionInput): FusedEmotionResult {
  const emotionVotes: Record<string, number> = {};
  const breakdown: FusedEmotionResult['breakdown'] = {};
  
  if (input.facialEmotion) {
    const emotion = normalizeEmotion(input.facialEmotion.emotion);
    emotionVotes[emotion] = (emotionVotes[emotion] || 0) + 1;
    breakdown.facial = emotion;
  }
  
  if (input.voiceEmotion) {
    const emotion = normalizeEmotion(extractEmotionFromText(input.voiceEmotion) || input.voiceEmotion);
    emotionVotes[emotion] = (emotionVotes[emotion] || 0) + 1;
    breakdown.voice = emotion;
  }
  
  if (input.textEmotion) {
    const emotion = normalizeEmotion(extractEmotionFromText(input.textEmotion) || input.textEmotion);
    emotionVotes[emotion] = (emotionVotes[emotion] || 0) + 1;
    breakdown.text = emotion;
  }
  
  const sortedEmotions = Object.entries(emotionVotes).sort((a, b) => b[1] - a[1]);
  
  if (sortedEmotions.length === 0) {
    return {
      finalEmotion: 'Neutral',
      confidence: 0.5,
      breakdown,
      fusionMethod: 'majority-voting',
    };
  }
  
  const [finalEmotion, votes] = sortedEmotions[0];
  const totalVotes = Object.values(emotionVotes).reduce((a, b) => a + b, 0);
  
  return {
    finalEmotion,
    confidence: votes / totalVotes,
    breakdown,
    fusionMethod: 'majority-voting',
  };
}

/**
 * Fuse emotions from multiple modalities
 * @param input - Emotions from different modalities
 * @param strategy - Fusion strategy ('weighted' or 'majority')
 */
export function fuseEmotions(
  input: MultiModalEmotionInput,
  strategy: 'weighted' | 'majority' = 'weighted'
): FusedEmotionResult {
  if (strategy === 'majority') {
    return majorityVotingFusion(input);
  }
  
  return weightedVotingFusion(input);
}

/**
 * Format fused emotion result for display
 */
export function formatEmotionResult(result: FusedEmotionResult): string {
  const parts: string[] = [result.finalEmotion];
  
  if (result.breakdown.facial || result.breakdown.voice || result.breakdown.text) {
    const breakdown: string[] = [];
    if (result.breakdown.facial) breakdown.push(`Face: ${result.breakdown.facial}`);
    if (result.breakdown.voice) breakdown.push(`Voice: ${result.breakdown.voice}`);
    if (result.breakdown.text) breakdown.push(`Text: ${result.breakdown.text}`);
    
    if (breakdown.length > 0) {
      parts.push(`(${breakdown.join(', ')})`);
    }
  }
  
  return parts.join(' ');
}
