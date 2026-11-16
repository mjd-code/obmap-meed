import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Compass, FolderKanban, Home } from "lucide-react";
import { Button } from "@/global/ui/button";
import { useBrandConfig } from "@/global/config/brand.config";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const brand = useBrandConfig();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card/80 backdrop-blur-md p-6 sm:p-8 text-center shadow-lg space-y-5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
          <Compass className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <p className="vk-text-xs font-mono uppercase tracking-widest text-muted-foreground">
            {brand.name} · 404
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Alamat{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              {location.pathname}
            </code>{" "}
            tidak tersedia. Untuk membuka catatan komunitas, gunakan format{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              /@username
            </code>{" "}
            atau buka Vault Dashboard Anda.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 pt-2">
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/">
              <Home className="h-3.5 w-3.5" />
              Kembali ke Beranda
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/vaults">
              <FolderKanban className="h-3.5 w-3.5" />
              Buka Vault Dashboard
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-center gap-4 pt-2 border-t border-border/50 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Halaman Sebelumnya
          </button>
          <Link to="/explore" className="hover:text-foreground transition-colors">
            Jelajahi Komunitas
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
