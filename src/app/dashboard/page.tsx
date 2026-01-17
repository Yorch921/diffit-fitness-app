import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'

const menuItems = [
  {
    title: 'Plan Nutricional',
    description: 'Ver tu plan de alimentacion',
    href: '/dashboard/nutrition',
    icon: '🥗',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    title: 'Entrenamiento',
    description: 'Registrar y ver entrenamientos',
    href: '/dashboard/training',
    icon: '💪',
    gradient: 'from-blue-500 to-indigo-600',
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
    title: 'Notificaciones',
    description: 'Mensajes de tu entrenador',
    href: '/dashboard/notifications',
    icon: '🔔',
    gradient: 'from-rose-500 to-pink-600',
  },
]

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const firstName = session?.user?.name?.split(' ')[0] || 'Usuario'

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Saludo personalizado */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Hola, {firstName}
        </h1>
        <p className="mt-1 text-gray-600">
          ¿Que quieres hacer hoy?
        </p>
      </div>

      {/* Grid de tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all duration-200 h-full">
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-2xl mb-4 shadow-sm`}
              >
                {item.icon}
              </div>
              <h3 className="font-semibold text-lg text-gray-900">
                {item.title}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {item.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
