import { useRef, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music, Clock, FolderOpen, PlayCircle, PauseCircle } from "lucide-react";
import SoundEffectCard from "@/components/SoundEffectCard";
import type { SFXFile } from "@/lib/api";

interface SoundCardProps {
  file: SFXFile;
  onClick: () => void;
}

const SUPPORTED_AUDIO_TYPES: Record<string, string> = {
  wav: "audio/wav",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  flac: "audio/flac",
  m4a: "audio/mp4",
  aac: "audio/aac",
  aiff: "audio/aiff",
  aif: "audio/aiff",
};

export function SoundCard({ file, onClick }: SoundCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Lazy initialize
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Stop any other currently playing audio elements globally
      document
        .querySelectorAll("audio")
        .forEach((a) => a !== audioRef.current && a.pause());

      audioRef.current.play().then(() => setIsPlaying(true));
    }
  };

  const handleEnded = () => setIsPlaying(false);
  const handlePause = () => setIsPlaying(false);
  const handlePlayEvent = () => setIsPlaying(true);

  // Construct playable URL.
  // Assumes backend serves /media/<relative_path>
  // Convert absolute path like /data/VA_Videos/Project/sfx/file.wav → Project/sfx/file.wav
  const relativePath = file.filepath.replace(/^.*VA_Videos[\\/]/, "");
  const audioUrl = `${import.meta.env.VITE_API_BASE_URL}/media/${encodeURIComponent(relativePath)}`;

  // Determine MIME type
  const ext = file.filename.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = SUPPORTED_AUDIO_TYPES[ext];

  return (
    //<SoundEffectCard sound={file}>
      <Card
        className="group cursor-pointer transition-all duration-300 hover:shadow-hover border-border bg-card"
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Music className="h-5 w-5 text-primary flex-shrink-0" />
              <h3 className="font-semibold text-card-foreground truncate">
                {file.filename}
              </h3>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                const audio = new Audio(`/api/sfx/${file.id}/play`);
                audio.play();
              }}
            >
              <PlayCircle className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{file.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <FolderOpen className="h-4 w-4" />
              <span className="truncate">{file.project}</span>
            </div>
          </div>

          {file.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {file.tags.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {file.tags.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{file.tags.length - 5}
                </Badge>
              )}
            </div>
          )}

          {file.notes && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {file.notes}
            </p>
          )}
        </CardContent>

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          type={mimeType}
          onEnded={handleEnded}
          onPause={handlePause}
          onPlay={handlePlayEvent}
        />
      </Card>
    //</SoundEffectCard>
  );
}
