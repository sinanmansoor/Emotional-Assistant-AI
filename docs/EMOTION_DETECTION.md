# Multi-Modal Emotion Detection System

## Overview

This project implements a comprehensive multi-modal emotion detection system that analyzes emotions from three different sources:

1. **Facial Expressions** - Using face-api.js for real-time facial emotion detection
2. **Voice/Audio** - Using Gemini AI to analyze vocal tone and patterns
3. **Text** - Using Gemini AI to analyze text sentiment and emotional content

The system then **fuses** these emotions using a weighted voting algorithm to determine the most accurate emotional state.

## Architecture

### Components

#### 1. Facial Emotion Detection (`src/lib/facial-emotion-detector.ts`)
- Uses **face-api.js** library with TinyFaceDetector model
- Detects 7 basic emotions: Happy, Sad, Angry, Fearful, Surprised, Disgusted, Neutral
- Runs in real-time on the client-side from video feed
- Provides confidence scores for each detection

#### 2. Voice Emotion Analysis (`src/ai/flows/analyze-user-emotion.ts`)
- Uses **Gemini 2.5 Flash** model
- Analyzes audio tone, pitch, pace, and intensity
- Detects extended emotion set including: Anxious, Excited, Calm, Frustrated, Confused

#### 3. Text Emotion Analysis (`src/ai/flows/analyze-user-emotion.ts`)
- Uses **Gemini 2.5 Flash** model
- Analyzes word choice, sentiment, and context
- Provides emotion classification from text content

#### 4. Emotion Fusion System (`src/lib/emotion-fusion.ts`)
- **Weighted Voting Strategy** (default):
  - Facial emotion: 50% weight (if confidence > 60%), otherwise 30%
  - Voice emotion: 30% weight
  - Text emotion: 20% weight
- **Majority Voting Strategy** (alternative):
  - Simple majority vote across all modalities
- Normalizes emotions to standard labels
- Provides detailed breakdown of each modality's contribution

### Data Flow

```
User Interaction
    ↓
┌───────────────────────────────────────┐
│  Video Feed → Facial Detection        │ → Facial Emotion + Confidence
│  Audio Recording → Voice Analysis     │ → Voice Emotion
│  Text Input → Text Analysis           │ → Text Emotion
└───────────────────────────────────────┘
    ↓
Emotion Fusion (Weighted Voting)
    ↓
Final Emotion + Breakdown
    ↓
Contextual AI Response
```

## Usage

### Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Download Face-API Models** (already done during setup)
   ```bash
   node scripts/download-face-models.js
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

### How It Works

1. **User grants camera and microphone permissions**
2. **Face-api.js models load in the background**
3. **User interacts via:**
   - Voice (press and hold microphone button)
   - Text (type in text area)
4. **System captures:**
   - Video frame for facial analysis
   - Audio recording for voice analysis
   - Text transcript/input
5. **Parallel emotion detection:**
   - Facial emotion detected immediately from video
   - Voice and text sent to Gemini AI for analysis
6. **Emotions are fused** using weighted voting
7. **AI generates contextual response** based on fused emotion
8. **Results displayed** with breakdown showing each modality's contribution

## Emotion Labels

### Standard Emotions
- Happy
- Sad
- Angry
- Fearful
- Surprised
- Disgusted
- Neutral
- Anxious
- Excited
- Calm
- Frustrated
- Confused

## Configuration

### Fusion Strategy

You can change the fusion strategy in `src/components/chat-interface.tsx`:

```typescript
const fusedResult = fuseEmotions({
  facialEmotion: detectedFacialEmotion,
  voiceEmotion: emotionResult.voiceEmotion || null,
  textEmotion: emotionResult.textEmotion || null,
}, 'weighted'); // or 'majority'
```

### Emotion Weights

Modify weights in `src/lib/emotion-fusion.ts`:

```typescript
const facialWeight = input.facialEmotion.confidence > 0.6 ? 0.5 : 0.3;
const voiceWeight = 0.3;
const textWeight = 0.2;
```

## Troubleshooting

### Facial Detection Not Working

1. **Check browser permissions** - Camera must be allowed
2. **Verify models are loaded** - Check browser console for "Face-api models loaded"
3. **Check model files** - Ensure files exist in `public/models/`
4. **Lighting conditions** - Ensure face is well-lit and clearly visible

### Voice Analysis Not Working

1. **Check microphone permissions**
2. **Verify audio is being recorded** - Look for REC indicator
3. **Check Gemini API key** - Ensure `.env` has valid API key

### Text Analysis Not Working

1. **Check Gemini API key**
2. **Verify network connection**
3. **Check browser console** for errors

## Performance Optimization

- Facial detection runs at ~30 FPS on modern hardware
- Voice/text analysis typically takes 1-3 seconds
- Models are cached after first load
- Fusion algorithm is lightweight and runs instantly

## Future Enhancements

- [ ] Add emotion history tracking
- [ ] Implement temporal smoothing for facial emotions
- [ ] Add support for multiple faces
- [ ] Include physiological signals (heart rate, etc.)
- [ ] Add emotion intensity levels
- [ ] Support for custom emotion labels

## Technical Details

### Face-API.js Models Used
- **TinyFaceDetector** - Fast, lightweight face detection
- **FaceExpressionNet** - 7-emotion classification
- **FaceLandmark68Net** - 68-point facial landmark detection

### AI Models Used
- **Gemini 2.5 Flash** - Fast, multimodal AI for voice and text analysis

## License

This emotion detection system is part of the EmotiMate project.
