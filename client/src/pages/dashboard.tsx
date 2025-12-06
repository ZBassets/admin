import { useEffect, useState } from "react";
import { useAssets, Asset, AssetType } from "@/lib/firebase";
import DashboardLayout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Search, Plus, MoreVertical, ExternalLink, Copy, Image as ImageIcon, Video, Link as LinkIcon, Pencil, Trash2, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// --- Form Schema ---
const assetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["image", "video", "link"] as const),
  originalUrl: z.string().url("Must be a valid URL"),
});

export default function DashboardPage() {
  const { assets, addAsset, updateAsset, deleteAsset, initialize, loading } = useAssets();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<AssetType | "all">("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Initialize Firebase listener on mount
  useEffect(() => {
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, [initialize]);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || asset.type === filterType;
    return matchesSearch && matchesType;
  });

  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}/view?id=${id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "The ZetuBridge link has been copied to your clipboard.",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      if (confirm("Are you sure you want to delete this asset?")) {
        await deleteAsset(id);
        toast({ title: "Asset Deleted", description: "The asset has been removed." });
      }
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "You need to update your Firestore Security Rules to delete assets.",
        });
      } else {
        toast({ title: "Error", description: "Failed to delete asset.", variant: "destructive" });
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground mt-1">Manage your external resources</p>
        </div>
        <Button onClick={() => { setEditingAsset(null); setIsAddOpen(true); }} className="shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Add New Asset
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search assets..." 
            className="pl-9 bg-card/50 backdrop-blur-sm border-muted"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {(["all", "image", "video", "link"] as const).map((type) => (
            <Button
              key={type}
              variant={filterType === type ? "secondary" : "outline"}
              onClick={() => setFilterType(type)}
              className="capitalize whitespace-nowrap"
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {loading && assets.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/10">
          <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No assets found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-1">
            {search ? "Try adjusting your search terms" : "Get started by adding your first asset"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredAssets.map((asset) => (
            <AssetCard 
              key={asset.id} 
              asset={asset} 
              onCopy={() => copyToClipboard(asset.id)}
              onEdit={() => { setEditingAsset(asset); setIsAddOpen(true); }}
              onDelete={() => handleDelete(asset.id)}
            />
          ))}
        </div>
      )}

      <AssetDialog 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen}
        initialData={editingAsset}
        onSubmit={async (data) => {
          try {
            if (editingAsset) {
              await updateAsset(editingAsset.id, data);
              toast({ title: "Asset Updated", description: "Changes have been saved successfully." });
            } else {
              await addAsset(data);
              toast({ title: "Asset Created", description: "New asset has been added to your library." });
            }
            setIsAddOpen(false);
          } catch (error: any) {
            console.error(error);
            if (error.code === 'permission-denied') {
              toast({
                variant: "destructive",
                title: "Permission Denied",
                description: "You need to update your Firestore Security Rules. Please check the chat for the rules to copy.",
                duration: 10000,
              });
            } else {
              toast({ title: "Error", description: "Failed to save asset.", variant: "destructive" });
            }
          }
        }}
      />
    </DashboardLayout>
  );
}

function AssetCard({ asset, onCopy, onEdit, onDelete }: { 
  asset: Asset, 
  onCopy: () => void, 
  onEdit: () => void, 
  onDelete: () => void 
}) {
  const Icon = asset.type === 'image' ? ImageIcon : asset.type === 'video' ? Video : LinkIcon;
  const typeColor = asset.type === 'image' ? 'text-blue-500 bg-blue-500/10' : asset.type === 'video' ? 'text-purple-500 bg-purple-500/10' : 'text-orange-500 bg-orange-500/10';

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-muted/60 overflow-hidden">
      <div className="h-32 bg-muted/30 flex items-center justify-center relative overflow-hidden">
        {asset.type === 'image' ? (
          <img src={asset.originalUrl} alt={asset.name} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${typeColor}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
        
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold truncate pr-2" title={asset.name}>{asset.name}</h3>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{asset.originalUrl}</p>
          </div>
        </div>
        <Badge variant="secondary" className={`capitalize font-normal ${typeColor} border-0`}>
          {asset.type}
        </Badge>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 bg-background/50" onClick={onCopy}>
          <Copy className="mr-2 h-3.5 w-3.5" /> Copy Link
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => window.open(asset.originalUrl, '_blank')}>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </Button>
      </CardFooter>
    </Card>
  );
}

function AssetDialog({ open, onOpenChange, initialData, onSubmit }: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  initialData: Asset | null,
  onSubmit: (data: z.infer<typeof assetSchema>) => Promise<void>
}) {
  const form = useForm<z.infer<typeof assetSchema>>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: "",
      type: "image",
      originalUrl: "",
    },
  });
  
  const [loading, setLoading] = useState(false);

  // Reset form when opening/closing or changing initialData
  useEffect(() => {
    if (open) {
      form.reset({
        name: initialData?.name || "",
        type: initialData?.type || "image",
        originalUrl: initialData?.originalUrl || "",
      });
    }
  }, [open, initialData, form]);

  const handleSubmit = async (values: z.infer<typeof assetSchema>) => {
    setLoading(true);
    await onSubmit(values);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Asset" : "Add New Asset"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update the details of your asset." : "Register a new external link, image, or video."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Promo Banner" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="link">External Link</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="originalUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Save Changes" : "Create Asset"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
