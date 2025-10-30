import ChatInterface from '@/components/chat-interface';
import Header from '@/components/header';

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 overflow-hidden">
        <ChatInterface />
      </main>
    </div>
  );
}
