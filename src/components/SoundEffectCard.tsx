import React from 'react';
import type { SFXFile } from "@/lib/api";
import { useOperatingSystem } from "@/hooks/useOperatingSystem";

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
  const { os } = useOperatingSystem();

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setIsDragging(true);
    
    // Choose the correct file path based on OS
    let filePath: string;
    if (os === 'windows') {
      filePath = sound.winpath;
    } else {
      // Mac and Linux both use Unix-style paths
      filePath = sound.filepath;
    }
    
    // Convert to file:// URI format
    let fileUri = '';
    if (filePath.startsWith('\\\\') || filePath.startsWith('//')) {
      // Windows UNC path: \\server\share\path
      // Convert to file://server/share/path
      fileUri = 'file:' + filePath.replace(/\\/g, '/');
    } else if (filePath.startsWith('/')) {
      // Unix path: /mnt/nas/path
      fileUri = 'file://' + filePath;
    } else {
      // Fallback to HTTP if no valid file path
      fileUri = `http://localhost:5000/api/audio/${sound.id}`;
    }
    
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
    
    // Set drag data with file path
    e.dataTransfer.effectAllowed = 'copy';
    
    // Use file:// URI directly - this is what makes it work like File Explorer!
    e.dataTransfer.setData('text/uri-list', fileUri);
    e.dataTransfer.setData('text/plain', fileUri);
    
    // Also set DownloadURL as fallback
    const downloadUrl = `${mimeType}:${sound.filename}:${fileUri}`;
    e.dataTransfer.setData('DownloadURL', downloadUrl);
    
    // Set a custom drag image
    const dragImage = document.createElement('div');
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border-radius: 4px;
      font-size: 14px;
      pointer-events: none;
      white-space: nowrap;
    `;
    dragImage.textContent = `🔊 ${sound.filename}`;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    setTimeout(() => dragImage.remove(), 0);
    
    console.log('OS:', os);
    console.log('Using file path:', filePath);
    console.log('File URI:', fileUri);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable="true"
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