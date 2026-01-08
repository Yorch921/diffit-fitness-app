'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'

const clientNavItems = [
  { href: '/dashboard', label: 'Inicio', icon: '🏠' },
  { href: '/dashboard/nutrition', label: 'Plan Nutricional', icon: '🥗' },
  { href: '/dashboard/training', label: 'Entrenamiento', icon: '💪' },
  { href: '/dashboard/weight', label: 'Báscula', icon: '⚖️' },
  { href: '/dashboard/files', label: 'Archivos', icon: '📁' },
  { href: '/dashboard/stats', label: 'Estadísticas', icon: '📊' },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
                Diffit
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {clientNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                    pathname === item.href
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  )}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Panel Admin
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
