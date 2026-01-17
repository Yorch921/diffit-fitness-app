'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface MenuItem {
  title: string
  description: string
  href: string
  icon: string
  gradient: string
  updateKey?: 'notifications' | 'reviews' | 'nutrition' | 'training'
}

const menuItems: MenuItem[] = [
  {
    title: 'Plan Nutricional',
    description: 'Ver tu plan de alimentacion',
    href: '/dashboard/nutrition',
    icon: '🥗',
    gradient: 'from-green-500 to-emerald-600',
    updateKey: 'nutrition',
  },
  {
    title: 'Entrenamiento',
    description: 'Registrar y ver entrenamientos',
    href: '/dashboard/training',
    icon: '💪',
    gradient: 'from-blue-500 to-indigo-600',
    updateKey: 'training',
  },
  {
    title: 'Bascula',
    description: 'Registrar tu peso',
    href: '/dashboard/weight',
    icon: '⚖️',
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    title: 'Archivos',
    description: 'Fotos y documentos',
    href: '/dashboard/files',
    icon: '📁',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    title: 'Progreso',
    description: 'Ver tu evolucion',
    href: '/dashboard/progress',
    icon: '📈',
    gradient: 'from-teal-500 to-cyan-600',
  },
  {
    title: 'Revisiones',
    description: 'Feedback de tu entrenador',
    href: '/dashboard/reviews',
    icon: '📋',
    gradient: 'from-indigo-500 to-purple-600',
    updateKey: 'reviews',
  },
  {
    title: 'Notificaciones',
    description: 'Mensajes de tu entrenador',
    href: '/dashboard/notifications',
    icon: '🔔',
    gradient: 'from-rose-500 to-pink-600',
    updateKey: 'notifications',
  },
]

interface Updates {
  notifications: number
  reviews: number
  nutrition: number
  training: number
}

export default function DashboardCards() {
  const [updates, setUpdates] = useState<Updates>({
    notifications: 0,
    reviews: 0,
    nutrition: 0,
    training: 0,
  })

  useEffect(() => {
    fetchUpdates()
  }, [])

  const fetchUpdates = async () => {
    try {
      const response = await fetch('/api/client/updates')
      if (response.ok) {
        const data = await response.json()
        setUpdates(data)
      }
    } catch (error) {
      console.error('Error fetching updates:', error)
    }
  }

  const getUpdateCount = (updateKey?: string): number => {
    if (!updateKey) return 0
    return updates[updateKey as keyof Updates] || 0
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {menuItems.map((item) => {
        const updateCount = getUpdateCount(item.updateKey)

        return (
          <Link key={item.href} href={item.href}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all duration-200 h-full relative">
              {/* Badge de novedades */}
              {updateCount > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg animate-pulse">
                  {updateCount > 9 ? '9+' : updateCount}
                </div>
              )}

              <div className="relative">
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-2xl mb-4 shadow-sm`}
                >
                  {item.icon}
                </div>
                {/* Indicador de novedad en el icono */}
                {updateCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                )}
              </div>

              <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                {item.title}
                {updateCount > 0 && (
                  <span className="text-xs font-normal text-red-500">Nuevo</span>
                )}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {item.description}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
