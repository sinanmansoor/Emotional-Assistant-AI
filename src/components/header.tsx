import { Flame } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center h-14 px-4 border-b border-border shrink-0">
      <div className="flex items-center gap-2">
        <Flame className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">EmotiMate</h1>
      </div>
    </header>
  );
}
