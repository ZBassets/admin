import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { fetchAssetById, Asset } from "@/lib/firebase"; // Use direct fetcher
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ViewAssetPage() {
  const [location] = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
      setError("No asset ID provided");
      setLoading(false);
      return;
    }

    async function loadAsset() {
      const foundAsset = await fetchAssetById(id!);
      
      if (!foundAsset) {
        setError("Asset not found");
        setLoading(false);
        return;
      }

      setAsset(foundAsset);
      setLoading(false);

      // If it's a link type, redirect immediately
      if (foundAsset.type === "link") {
        window.location.href = foundAsset.originalUrl;
      }
    }

    loadAsset();

  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
            <div className="h-6 w-6 bg-primary rounded-full"></div>
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">Resolving asset...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Error Loading Asset</h1>
          <p className="text-muted-foreground">{error || "The requested asset could not be found."}</p>
          <Button onClick={() => window.history.back()} variant="outline" className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (asset.type === "link") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Redirecting to {asset.originalUrl}...</p>
      </div>
    );
  }

  // Render content centered in viewport
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-0 m-0 overflow-hidden">
      {asset.type === "image" && (
        <img 
          src={asset.originalUrl} 
          alt={asset.name} 
          className="max-w-full max-h-screen object-contain"
        />
      )}
      
      {asset.type === "video" && (
        <iframe 
          src={asset.originalUrl} 
          title={asset.name}
          className="w-full h-screen border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
      )}
    </div>
  );
}
