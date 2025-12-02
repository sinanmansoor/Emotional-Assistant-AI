
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Mic, Send, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ChatMessage from './chat-message';
import { useToast } from '@/hooks/use-toast';
import {
  analyzeEmotionAction,
  generateResponseAction,
} from '@/lib/actions';
import { LoadingSpinner } from './icons';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import {
  loadFaceApiModels,
  detectFacialExpression,
  mapFaceApiEmotion,
} from '@/lib/facial-emotion-detector';
import {
  fuseEmotions,
  formatEmotionResult,
  type EmotionScore,
} from '@/lib/emotion-fusion';

type Message = {
  role: 'user' | 'ai';
  content: string;
};

export default function ChatInterface() {
  const [isMounted, setIsMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content:
        "Hello! I'm EmotiMate. Press and hold the microphone button to start talking, or type a message below.",
    },
  ]);
  const [conversationHistory, setConversationHistory] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState<string | null>(null);
  const [facialEmotion, setFacialEmotion] = useState<EmotionScore | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isRecordingVisual, setIsRecordingVisual] = useState(false);
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const transcriptRef = useRef<string>('');

  const { toast } = useToast();

  const setupMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsRecordingVisual(false);
        const videoBlob = new Blob(recordedChunksRef.current, {
          type: 'video/webm',
        });
        const audioBlob = new Blob(recordedChunksRef.current, {
            type: 'audio/webm',
        });
        recordedChunksRef.current = [];
        const videoDataUri = await blobToBase64(videoBlob);
        const audioDataUri = await blobToBase64(audioBlob);


        const text = transcriptRef.current;
        transcriptRef.current = '';

        if (!text.trim()) {
            setIsLoading(false);
            return;
        }
        
        processInteraction(
          videoDataUri,
          audioDataUri, 
          text
        );
      };
    } catch (error) {
      console.error('Error accessing media devices.', error);
      toast({
        title: 'Media Error',
        description:
          'Could not access camera and microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const setupSpeechRecognition = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let final_transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final_transcript += event.results[i][0].transcript;
          }
        }
        if (final_transcript) {
          transcriptRef.current = final_transcript;
        }
      };
      speechRecognitionRef.current = recognition;
    } else {
      toast({
        title: 'Browser Not Supported',
        description: 'Speech recognition is not supported in your browser.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      setupMedia();
      setupSpeechRecognition();
      // Load face-api models
      loadFaceApiModels()
        .then(() => {
          setFaceApiLoaded(true);
          console.log('Face-api models loaded');
        })
        .catch((error) => {
          console.error('Failed to load face-api models:', error);
          toast({
            title: 'Face Detection Error',
            description: 'Could not load facial emotion detection models. Facial emotion detection will be disabled.',
            variant: 'destructive',
          });
        });
    }
  }, [isMounted, setupMedia, setupSpeechRecognition, toast]);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
  
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isLoading) return;

    await processInteraction(null, null, textInput);
    setTextInput('');
  }

  const processInteraction = async (
    videoDataUri: string | null,
    audioDataUri: string | null,
    text: string
  ) => {
    if (!text.trim()) {
        setIsLoading(false);
        return;
    };

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsLoading(true);
    setDetectedEmotion(null);

    try {
      // Detect facial emotion from video element
      let detectedFacialEmotion: EmotionScore | null = null;
      if (faceApiLoaded && videoRef.current) {
        try {
          const faceResult = await detectFacialExpression(videoRef.current);
          if (faceResult) {
            detectedFacialEmotion = {
              emotion: mapFaceApiEmotion(faceResult.emotion),
              confidence: faceResult.confidence,
            };
            setFacialEmotion(detectedFacialEmotion);
            console.log('Facial emotion detected:', detectedFacialEmotion);
          }
        } catch (error) {
          console.error('Error detecting facial emotion:', error);
        }
      }

      const emotionPayload: any = { text };
      if (videoDataUri) {
        emotionPayload.videoDataUri = videoDataUri;
      }
      if (audioDataUri) {
        emotionPayload.audioDataUri = audioDataUri;
      }
      if (detectedFacialEmotion) {
        emotionPayload.facialEmotion = detectedFacialEmotion;
      }
      
      const emotionResult = await analyzeEmotionAction(emotionPayload);
      
      // Fuse emotions from all modalities
      const fusedResult = fuseEmotions({
        facialEmotion: detectedFacialEmotion,
        voiceEmotion: emotionResult.voiceEmotion || null,
        textEmotion: emotionResult.textEmotion || null,
      });
      
      const displayEmotion = formatEmotionResult(fusedResult);
      setDetectedEmotion(displayEmotion);
      console.log('Fused emotion result:', fusedResult);

      const responseResult = await generateResponseAction({
        text,
        emotion: fusedResult.finalEmotion,
        conversationHistory,
      });
      
      const aiResponse = responseResult.response;
      const aiAudio = responseResult.audio;

      setMessages((prev) => [...prev, { role: 'ai', content: aiResponse }]);

      const newHistory = `${conversationHistory}\nUser: ${text}\nAI: ${aiResponse}`;
      setConversationHistory(newHistory);

      if (audioPlayerRef.current && aiAudio) {
        audioPlayerRef.current.src = aiAudio;
        audioPlayerRef.current.play();
      }

    } catch (error) {
      console.error('Error with AI interaction:', error);
      toast({
        title: 'AI Error',
        description: 'Failed to get a response from the AI.',
        variant: 'destructive',
      });
       setMessages((prev) => [...prev, { role: 'ai', content: "I'm having trouble connecting. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordButtonPress = () => {
    if (isLoading || !mediaRecorderRef.current || !speechRecognitionRef.current) return;
    if (mediaRecorderRef.current.state === 'recording') return;
    setIsRecording(true);
    setIsRecordingVisual(true);
    mediaRecorderRef.current.start();
    speechRecognitionRef.current.start();
  };

  const handleRecordButtonRelease = () => {
    if (!isRecording || !mediaRecorderRef.current || !speechRecognitionRef.current) return;
    if (mediaRecorderRef.current.state !== 'recording') return;
    setIsRecording(false);
    mediaRecorderRef.current.stop();
    speechRecognitionRef.current.stop();
  };

  return (
    <div className="h-full p-4 grid lg:grid-cols-2 gap-4">
      <div className="flex flex-col gap-4 min-h-0">
        <Card>
          <CardHeader>
            <CardTitle>Your Video</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted aspect-video rounded-md overflow-hidden relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
               {isRecordingVisual && (
                <div className="absolute top-2 right-2 flex items-center gap-2 bg-destructive text-destructive-foreground rounded-full px-3 py-1 text-sm">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  REC
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Emotion Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center min-h-20 bg-muted rounded-md p-4 gap-2">
                {isLoading && !detectedEmotion && <p className="text-sm text-muted-foreground">Analyzing...</p>}
                {detectedEmotion && (
                  <div className="flex flex-col items-center gap-2">
                    <Badge variant="secondary" className="text-lg font-medium">{detectedEmotion}</Badge>
                    {facialEmotion && (
                      <p className="text-xs text-muted-foreground">
                        Facial: {facialEmotion.emotion} ({Math.round(facialEmotion.confidence * 100)}%)
                      </p>
                    )}
                  </div>
                )}
                {!isLoading && !detectedEmotion && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Press and hold to record</p>
                    {!faceApiLoaded && (
                      <p className="text-xs text-muted-foreground mt-1">Loading facial detection...</p>
                    )}
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col min-h-0">
        <Card className="flex flex-col flex-1 min-h-0">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto min-h-0">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <ChatMessage key={index} role={msg.role} content={msg.content} />
              ))}
              {isLoading && (
                <div className="flex items-start gap-3 justify-start">
                  <Bot className="w-8 h-8 p-1.5 rounded-full bg-secondary text-secondary-foreground" />
                  <div className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground">
                    <LoadingSpinner className="w-5 h-5 animate-spin"/>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <div className="p-4 border-t flex-shrink-0">
            <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
              <Textarea
                placeholder="Type your message..."
                className="flex-1 resize-none"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleTextSubmit(e as any);
                  }
                }}
                rows={1}
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !textInput.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                onMouseDown={handleRecordButtonPress}
                onMouseUp={handleRecordButtonRelease}
                onTouchStart={handleRecordButtonPress}
                onTouchEnd={handleRecordButtonRelease}
                disabled={isLoading || !isMounted}
                variant={isRecording ? 'destructive' : 'default'}
              >
                {isRecording ? <Square /> : <Mic />}
              </Button>
            </form>
          </div>
        </Card>
      </div>
      <audio ref={audioPlayerRef} className="hidden" />
    </div>
  );
}
