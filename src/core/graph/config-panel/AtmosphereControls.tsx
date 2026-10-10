import { Label } from '@/shared/ui/label';
import { Slider } from '@/shared/ui/slider-noinput';
import { Switch } from '@/shared/ui/switch';
import { Button } from '@/shared/ui/button';
import { Sparkles, Activity, Layers, SunMedium, Compass, Wind } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import type { NodeConfig, LinkConfig } from '@/shared/stores/useGraphStore';

export interface AtmosphereConfig {
  cosmicParticles: number; // 0..100
  cosmicSpeed: number;     // 0.5..2.5
  linkGlow: boolean;       // Dynamic flowing particles
  nodeElevation: boolean;  // Soft glow / glassmorphism
  elevationIntensity: number; // 0..1
}

interface AtmosphereControlsProps {
  atmosphere: AtmosphereConfig;
  linkConfig: LinkConfig;
  nodeConfig: NodeConfig;
  onAtmosphereUpdate: (updates: Partial<AtmosphereConfig>) => void;
  onLinkUpdate: (updates: Partial<LinkConfig>) => void;
  onNodeUpdate: (updates: Partial<NodeConfig>) => void;
}

export function AtmosphereControls({
  atmosphere,
  linkConfig,
  nodeConfig,
  onAtmosphereUpdate,
  onLinkUpdate,
  onNodeUpdate,
}: AtmosphereControlsProps) {
  return (
    <div className="space-y-4">
      {/* 1. COSMIC PARTICLES & DUST */}
      <div className="rounded-lg border border-border/70 bg-card/60 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <div>
              <Label className="text-xs font-semibold tracking-wide uppercase">
                Cosmic Particles & Dust
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Latar canvas hidup dengan partikel debu kosmik dan nebula
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
            {atmosphere.cosmicParticles}%
          </span>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-3 gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={atmosphere.cosmicParticles === 0 ? 'secondary' : 'outline'}
            className="h-7 text-[11px]"
            onClick={() => onAtmosphereUpdate({ cosmicParticles: 0 })}
          >
            Off
          </Button>
          <Button
            type="button"
            size="sm"
            variant={atmosphere.cosmicParticles === 50 ? 'secondary' : 'outline'}
            className="h-7 text-[11px]"
            onClick={() => onAtmosphereUpdate({ cosmicParticles: 50 })}
          >
            Subtle Star Dust
          </Button>
          <Button
            type="button"
            size="sm"
            variant={atmosphere.cosmicParticles === 100 ? 'secondary' : 'outline'}
            className="h-7 text-[11px]"
            onClick={() => onAtmosphereUpdate({ cosmicParticles: 100 })}
          >
            Cyber Nebula
          </Button>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Intensitas Partikel</span>
            <span>
              {atmosphere.cosmicParticles === 0
                ? 'Nonaktif'
                : atmosphere.cosmicParticles <= 50
                ? 'Star Dust'
                : 'Cyber Grid Nebula'}
            </span>
          </div>
          <Slider
            value={[atmosphere.cosmicParticles]}
            min={0}
            max={100}
            step={5}
            onValueChange={([v]) => onAtmosphereUpdate({ cosmicParticles: v })}
          />
        </div>

        {atmosphere.cosmicParticles > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Wind className="h-3 w-3" /> Kecepatan Drift Partikel
              </span>
              <span>{(atmosphere.cosmicSpeed ?? 1.0).toFixed(1)}x</span>
            </div>
            <Slider
              value={[atmosphere.cosmicSpeed ?? 1.0]}
              min={0.2}
              max={3.0}
              step={0.2}
              onValueChange={([v]) => onAtmosphereUpdate({ cosmicSpeed: v })}
            />
          </div>
        )}
      </div>

      {/* 2. LINK DYNAMIC GLOW (FLOW PARTICLES) */}
      <div className="rounded-lg border border-border/70 bg-card/60 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <div>
              <Label className="text-xs font-semibold tracking-wide uppercase">
                Link Dynamic Glow
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Animasi partikel bercahaya mengalir di sepanjang garis relasi
              </p>
            </div>
          </div>
          <Switch
            checked={linkConfig.showParticles && linkConfig.particles > 0}
            onCheckedChange={(checked) => {
              onAtmosphereUpdate({ linkGlow: checked });
              onLinkUpdate({
                showParticles: checked,
                particles: checked ? Math.max(2, linkConfig.particles || 3) : 0,
                particleSpeed: linkConfig.particleSpeed || 0.015,
              });
            }}
          />
        </div>

        {linkConfig.showParticles && linkConfig.particles > 0 && (
          <div className="space-y-3 pt-1 border-t border-border/50">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Jumlah Partikel per Relasi</span>
                <span>{linkConfig.particles}</span>
              </div>
              <Slider
                value={[linkConfig.particles]}
                min={1}
                max={6}
                step={1}
                onValueChange={([v]) => onLinkUpdate({ particles: v })}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Kecepatan Arus (Flow Speed)</span>
                <span>{(linkConfig.particleSpeed * 100).toFixed(1)}%</span>
              </div>
              <Slider
                value={[linkConfig.particleSpeed]}
                min={0.002}
                max={0.04}
                step={0.002}
                onValueChange={([v]) => onLinkUpdate({ particleSpeed: v })}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Ketebalan Partikel Bercahaya</span>
                <span>{linkConfig.particleWidth}px</span>
              </div>
              <Slider
                value={[linkConfig.particleWidth]}
                min={1.5}
                max={8}
                step={0.5}
                onValueChange={([v]) => onLinkUpdate({ particleWidth: v })}
              />
            </div>

            <ColorPicker
              label="Warna Partikel Aliran"
              value={linkConfig.particleColor}
              onChange={(val) => onLinkUpdate({ particleColor: val })}
            />
          </div>
        )}
      </div>

      {/* 3. NODE DEPTH & ELEVATION */}
      <div className="rounded-lg border border-border/70 bg-card/60 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-400" />
            <div>
              <Label className="text-xs font-semibold tracking-wide uppercase">
                Node Depth & Elevation
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Bayangan lembut, specular highlight & glassmorphism saat hover/focus
              </p>
            </div>
          </div>
          <Switch
            checked={atmosphere.nodeElevation || nodeConfig.glow}
            onCheckedChange={(checked) => {
              onAtmosphereUpdate({ nodeElevation: checked });
              onNodeUpdate({ glow: checked });
            }}
          />
        </div>

        {(atmosphere.nodeElevation || nodeConfig.glow) && (
          <div className="space-y-3 pt-1 border-t border-border/50">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <SunMedium className="h-3 w-3" /> Intensitas Soft Glow & Elevation
                </span>
                <span>{Math.round((nodeConfig.glowIntensity ?? 0.6) * 100)}%</span>
              </div>
              <Slider
                value={[nodeConfig.glowIntensity ?? 0.6]}
                min={0.1}
                max={1.0}
                step={0.05}
                onValueChange={([v]) => {
                  onAtmosphereUpdate({ elevationIntensity: v });
                  onNodeUpdate({ glowIntensity: v });
                }}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Compass className="h-3 w-3" /> Kecepatan Pulsing Aksen
                </span>
                <span>{(nodeConfig.glowSpeed ?? 1).toFixed(1)}x</span>
              </div>
              <Slider
                value={[nodeConfig.glowSpeed ?? 1]}
                min={0.2}
                max={2.5}
                step={0.1}
                onValueChange={([v]) => onNodeUpdate({ glowSpeed: v })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}