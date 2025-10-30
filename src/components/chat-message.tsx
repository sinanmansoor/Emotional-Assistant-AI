import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'ai';
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isAi = role === 'ai';

  return (
    <div
      className={cn(
        'flex items-start gap-3',
        isAi ? 'justify-start' : 'justify-end'
      )}
    >
      {isAi && (
        <Avatar className="w-8 h-8">
          <AvatarFallback>
            <Bot className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'px-4 py-2 rounded-lg max-w-xs md:max-w-md lg:max-w-lg',
          isAi
            ? 'bg-secondary text-secondary-foreground'
            : 'bg-primary text-primary-foreground'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
