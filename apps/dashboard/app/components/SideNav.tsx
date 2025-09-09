'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { twMerge } from 'tailwind-merge';

function Item({ label, href, active=false }: {label: string, href: string, active?: boolean}) {
  return (
    <Link href={href}>
      <div className={twMerge('px-3 py-2 rounded-xl cursor-pointer text-sm hover:bg-muted transition-colors', active && 'bg-muted font-medium')}>
        {label}
      </div>
    </Link>
  );
}

export default function SideNav() {
  const pathname = usePathname();
  
  const navItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Cuentas', href: '/cuentas' },
    { label: 'Transacciones', href: '/transacciones' },
    { label: 'Integraciones', href: '/integraciones' },
    { label: 'Ajustes', href: '/ajustes' }
  ];

  return (
    <aside className="hidden md:block w-64 p-4 space-y-2">
      {navItems.map((item) => (
        <Item 
          key={item.href}
          label={item.label} 
          href={item.href}
          active={pathname === item.href} 
        />
      ))}
    </aside>
  );
}
