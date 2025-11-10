import React from 'react';

interface SoundEffect {
  id: string;
  name: string;
  filename: string;
  path: string;
  type?: string; // e.g., 'wav', 'mp3', 'ogg'
  // Add other properties as needed
}

interface SoundEffectCardProps {
  sound: SoundEffect;
  children?: React.ReactNode;
  className?: string;
}

const SoundEffectCard: React.FC<SoundEffectCardProps> = ({ 
  sound, 
  children, 
  className = '' 
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    // Get the audio file URL - adjust this based on your backend setup
    const fileUrl = `${window.location.origin}/api/audio/${sound.filename}`;
    
    // Determine MIME type based on file extension
    const extension = sound.filename.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: { [key: string]: string } = {
      'wav': 'audio/wav',
      'mp3': 'audio/mpeg',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      'm4a': 'audio/mp4',
      'aac': 'audio/aac',
    };
    const mimeType = mimeTypes[extension] || 'audio/mpeg';
    
    // Format for DownloadURL: mime-type:filename:url
    const downloadUrl = `${mimeType}:${sound.filename}:${fileUrl}`;
    
    // Set multiple data formats for compatibility
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('DownloadURL', downloadUrl);
    e.dataTransfer.setData('text/plain', fileUrl);
    e.dataTransfer.setData('text/uri-list', fileUrl);
    
    // Optional: Add a custom drag image
    // You can create a preview element here if desired
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // Optional: Add visual feedback when drag ends
    console.log('Drag ended');
  };

  return (
    <div
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`cursor-grab active:cursor-grabbing ${className}`}
      title="Drag to other applications"
    >
      {children}
    </div>
  );
};

export default SoundEffectCard;