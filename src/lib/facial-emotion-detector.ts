'use client';

import * as faceapi from 'face-api.js';

let modelsLoaded = false;

/**
 * Load face-api.js models for facial expression detection
 */
export async function loadFaceApiModels(): Promise<void> {
  if (modelsLoaded) return;

  try {
    const MODEL_URL = '/models'; // Models will be in public/models folder
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    ]);
    
    modelsLoaded = true;
    console.log('Face-api models loaded successfully');
  } catch (error) {
    console.error('Error loading face-api models:', error);
    throw error;
  }
}

/**
 * Detect facial expressions from a video element
 */
export async function detectFacialExpression(
  videoElement: HTMLVideoElement
): Promise<{ emotion: string; confidence: number } | null> {
  try {
    if (!modelsLoaded) {
      await loadFaceApiModels();
    }

    const detections = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    if (!detections) {
      console.log('No face detected');
      return null;
    }

    const expressions = detections.expressions;
    
    // Get the dominant emotion
    const emotionEntries = Object.entries(expressions);
    const dominantEmotion = emotionEntries.reduce((prev, current) => 
      current[1] > prev[1] ? current : prev
    );

    return {
      emotion: dominantEmotion[0],
      confidence: dominantEmotion[1],
    };
  } catch (error) {
    console.error('Error detecting facial expression:', error);
    return null;
  }
}

/**
 * Detect facial expressions from multiple frames and average the results
 */
export async function detectFacialExpressionMultiFrame(
  videoElement: HTMLVideoElement,
  numFrames: number = 5,
  intervalMs: number = 200
): Promise<{ emotion: string; confidence: number; allEmotions: Record<string, number> } | null> {
  const detections: Array<{ emotion: string; confidence: number }> = [];

  for (let i = 0; i < numFrames; i++) {
    const detection = await detectFacialExpression(videoElement);
    if (detection) {
      detections.push(detection);
    }
    
    if (i < numFrames - 1) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  if (detections.length === 0) {
    return null;
  }

  // Aggregate emotions across all frames
  const emotionCounts: Record<string, number[]> = {};
  
  detections.forEach(detection => {
    if (!emotionCounts[detection.emotion]) {
      emotionCounts[detection.emotion] = [];
    }
    emotionCounts[detection.emotion].push(detection.confidence);
  });

  // Calculate average confidence for each emotion
  const avgEmotions: Record<string, number> = {};
  Object.entries(emotionCounts).forEach(([emotion, confidences]) => {
    avgEmotions[emotion] = confidences.reduce((a, b) => a + b, 0) / confidences.length;
  });

  // Get dominant emotion
  const dominantEmotion = Object.entries(avgEmotions).reduce((prev, current) =>
    current[1] > prev[1] ? current : prev
  );

  return {
    emotion: dominantEmotion[0],
    confidence: dominantEmotion[1],
    allEmotions: avgEmotions,
  };
}

/**
 * Map face-api emotions to standardized emotion labels
 */
export function mapFaceApiEmotion(faceApiEmotion: string): string {
  const emotionMap: Record<string, string> = {
    'neutral': 'Neutral',
    'happy': 'Happy',
    'sad': 'Sad',
    'angry': 'Angry',
    'fearful': 'Fearful',
    'disgusted': 'Disgusted',
    'surprised': 'Surprised',
  };
  
  return emotionMap[faceApiEmotion] || faceApiEmotion;
}
