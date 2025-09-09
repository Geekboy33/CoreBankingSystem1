'use client';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Command } from 'cmdk';

export default function CommandMenu() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); setOpen((o) => !o); }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);
  return (
    <>
      {open && (<div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)} />)}
      <Command.Dialog open={open} onOpenChange={setOpen} label="Command Menu" className="fixed z-50 top-[20%] left-1/2 -translate-x-1/2 w-[600px] rounded-2xl border border-border/60 bg-card shadow-xl">
        <Command.Input placeholder="Acciones, cuentas, transacciones..." />
        <Command.List>
          <Command.Empty>Sin resultados.</Command.Empty>
          <Command.Group heading="Acciones">
            <Command.Item onSelect={() => { document.getElementById('promote-btn')?.click(); setOpen(false); }}>Promover staging → ledger</Command.Item>
            <Command.Item onSelect={() => { document.getElementById('transfer-form')?.scrollIntoView({ behavior: 'smooth' }); setOpen(false); }}>Nueva transferencia</Command.Item>
            <Command.Item onSelect={() => { location.assign('/'); }}>Ir al dashboard</Command.Item>
          </Command.Group>
        </Command.List>
      </Command.Dialog>
    </>
  );
}
