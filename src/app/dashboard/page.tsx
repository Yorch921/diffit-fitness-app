import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import DashboardCards from '@/components/DashboardCards'

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

      {/* Grid de tarjetas con indicadores de novedades */}
      <DashboardCards />
    </div>
  )
}
