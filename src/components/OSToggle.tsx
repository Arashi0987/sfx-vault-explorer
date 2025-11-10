import { Monitor, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOperatingSystem, type OSType } from "@/hooks/useOperatingSystem";

export function OSToggle() {
  const { os, setOS } = useOperatingSystem();

  const osIcons = {
    windows: '🪟',
    mac: '🍎',
    linux: '🐧',
  };

  const osLabels = {
    windows: 'Windows',
    mac: 'macOS',
    linux: 'Linux',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <span>{osIcons[os]}</span>
          <span>{osLabels[os]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>File Path Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setOS('windows')}>
          <span className="mr-2">🪟</span>
          Windows (UNC Path)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setOS('mac')}>
          <span className="mr-2">🍎</span>
          macOS (Unix Path)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setOS('linux')}>
          <span className="mr-2">🐧</span>
          Linux (Unix Path)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}