'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EmotionDebugPanelProps {
  facialEmotion?: { emotion: string; confidence: number } | null;
  voiceEmotion?: string | null;
  textEmotion?: string | null;
  fusedEmotion?: string | null;
}

/**
 * Debug panel to display detailed emotion detection results
 * Useful for testing and debugging the multi-modal emotion system
 */
export function EmotionDebugPanel({
  facialEmotion,
  voiceEmotion,
  textEmotion,
  fusedEmotion,
}: EmotionDebugPanelProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm">Emotion Detection Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Facial</p>
            {facialEmotion ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {facialEmotion.emotion}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {Math.round(facialEmotion.confidence * 100)}%
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Not detected</p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Voice</p>
            {voiceEmotion ? (
              <Badge variant="outline" className="text-xs">
                {voiceEmotion}
              </Badge>
            ) : (
              <p className="text-xs text-muted-foreground">Not detected</p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Text</p>
            {textEmotion ? (
              <Badge variant="outline" className="text-xs">
                {textEmotion}
              </Badge>
            ) : (
              <p className="text-xs text-muted-foreground">Not detected</p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Fused</p>
            {fusedEmotion ? (
              <Badge variant="default" className="text-xs">
                {fusedEmotion}
              </Badge>
            ) : (
              <p className="text-xs text-muted-foreground">Not detected</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
