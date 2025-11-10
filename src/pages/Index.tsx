import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  RefreshCw, 
  Music2, 
  Filter,
  X,
  AlertCircle
} from "lucide-react";
import { api, type SFXFile } from "@/lib/api";
import { SoundCard } from "@/components/SoundCard";
import { FileDetailDialog } from "@/components/FileDetailDialog";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<SFXFile | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const { data: files = [], refetch, isLoading, error } = useQuery({
    queryKey: ['files', searchQuery, selectedTags, selectedProject],
    queryFn: () => api.getFiles({
      q: searchQuery || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      project: selectedProject || undefined,
    }),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const allTags = Array.from(
    new Set(files.flatMap(file => file.tags))
  ).sort();

  const allProjects = Array.from(
    new Set(files.map(file => file.project))
  ).sort();

  const handleScan = async () => {
    setIsScanning(true);
    try {
      await api.scanNow();
      toast.success("Scan triggered successfully");
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      toast.error("Failed to trigger scan");
    } finally {
      setIsScanning(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setSelectedProject("");
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || selectedProject;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Music2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">SFX Library</h1>
                <p className="text-sm text-muted-foreground">
                  {files.length} sound{files.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
            
            <Button 
              onClick={handleScan}
              disabled={isScanning}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning...' : 'Scan Now'}
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by filename or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters:</span>
            </div>
            
            {/* Project Filter */}
            {allProjects.length > 0 && (
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Projects</SelectItem>
                  {allProjects.map(project => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Tag Filter */}
            <div className="flex flex-wrap gap-1.5">
              {allTags.slice(0, 10).map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
              {allTags.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{allTags.length - 10} more
                </Badge>
              )}
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="ml-auto"
              >
                <X className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to connect to the backend. Make sure the Flask server is running on http://localhost:5000
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Music2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No sounds found</h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters 
                ? "Try adjusting your filters or search query"
                : "Trigger a scan to populate your library"
              }
            </p>
            {!hasActiveFilters && (
              <Button onClick={handleScan} disabled={isScanning}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                Scan Now
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.map((file) => (
              <SoundCard
                key={file.id}
                file={file}
                onClick={() => {
                  setSelectedFile(file);
                  setIsDetailOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Detail Dialog */}
      <FileDetailDialog
        file={selectedFile}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onUpdate={() => {
          refetch();
          if (selectedFile) {
            api.getFile(selectedFile.id).then(setSelectedFile);
          }
        }}
      />
    </div>
  );
};

export default Index;
