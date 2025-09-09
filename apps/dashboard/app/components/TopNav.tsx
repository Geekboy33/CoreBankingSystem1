'use client';
import CommandMenu from './CommandMenu';
import React from 'react';
import { Button } from './ui/button';
import { SunIcon, MoonIcon } from '@radix-ui/react-icons';
import { useTheme } from 'next-themes';

export default function TopNav() {
  const { theme, setTheme } = useTheme();
  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  return (
    <div className="sticky top-0 z-40 backdrop-blur bg-white/60 dark:bg-black/40 border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="font-semibold">Core Banking</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={toggle} aria-label="toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </Button>
          <Button>Acciones</Button>
          <CommandMenu />
        </div>
      </div>
    </div>
  );
}
