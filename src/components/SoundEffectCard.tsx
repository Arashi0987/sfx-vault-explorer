import React from 'react';
import type { SFXFile } from "@/lib/api";

interface SoundEffectCardProps {
  sound: SFXFile;
  children: React.ReactNode;
  className?: string;
}

const SoundEffectCard: React.FC<SoundEffectCardProps> = ({ 
  sound, 
  children, 
  className = '' 
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [fileBlob, setFileBlob] = React.useState<Blob | null>(null);
  const dragTimeoutRef = React.useRef<NodeJS.Timeout>();

  // Pre-fetch file when user hovers over the card
  const handleMouseEnter = async () => {
    // Only fetch if we haven't already
    if (fileBlob) return;
    
    // Use a small delay to avoid fetching on quick mouse movements
    dragTimeoutRef.current = setTimeout(async () => {
      try {
        const fileUrl = `http://fox.home:5000/api/audio/${sound.id}`;
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        setFileBlob(blob);
        console.log('Pre-fetched:', sound.filename);
      } catch (error) {
        console.error('Error pre-fetching file:', error);
      }
    }, 300); // 300ms delay
  };

  const handleMouseLeave = () => {
    // Cancel pre-fetch if user moves away quickly
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    
    const fileUrl = `http://fox:5000/api/audio/${sound.id}`;
    
    // Determine MIME type
    const extension = sound.filename.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: { [key: string]: string } = {
      'wav': 'audio/wav',
      'mp3': 'audio/mpeg',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      'm4a': 'audio/mp4',
      'aac': 'audio/aac',
      'aiff': 'audio/aiff',
      'aif': 'audio/aiff',
    };
    const mimeType = mimeTypes[extension] || 'audio/mpeg';
    
    // If we have the pre-fetched blob, use it
    if (fileBlob) {
      const file = new File([fileBlob], sound.filename, { type: mimeType });
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.items.add(file);
      console.log('Dragging cached file:', sound.filename);
    }
    
    // Always set URL formats as fallback
    const downloadUrl = `${mimeType}:${sound.filename}:${fileUrl}`;
    e.dataTransfer.setData('DownloadURL', downloadUrl);
    e.dataTransfer.setData('text/plain', fileUrl);
    e.dataTransfer.setData('text/uri-list', fileUrl);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      draggable="true"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`cursor-grab active:cursor-grabbing transition-opacity ${isDragging ? 'opacity-50' : ''} ${className}`}
      title="Drag to other applications (DAWs, video editors, file explorer)"
    >
      {children}
    </div>
  );
};

export default SoundEffectCard;