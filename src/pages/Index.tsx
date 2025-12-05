import { StarField } from "@/components/StarField";

const Index = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <StarField />
      
      <main className="relative z-10 flex flex-col items-center justify-center px-6">
        <div className="animate-float">
          <div className="w-16 h-16 rounded-full border border-border flex items-center justify-center mb-12 glow-accent">
            <div className="w-2 h-2 rounded-full bg-accent" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-light tracking-tight text-center mb-4">
          Void
        </h1>
        
        <p className="text-muted-foreground text-lg font-light tracking-wide">
          minimal. infinite. space.
        </p>
      </main>
      
      <footer className="absolute bottom-8 left-0 right-0 flex justify-center">
        <span className="text-xs text-muted-foreground/50 font-mono tracking-widest uppercase">
          ∞
        </span>
      </footer>
    </div>
  );
};

export default Index;
