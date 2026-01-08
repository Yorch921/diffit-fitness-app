import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  if (session.user.role === 'CLIENT') {
    redirect('/dashboard')
  }

  // Obtener clientes
  const clients = await prisma.user.findMany({
    where: {
      trainerId: session.user.id,
    },
    include: {
      _count: {
        select: {
          nutritionPlan: true,
          trainingPlan: true,
          workoutSessions: true,
          weightEntry: true,
        },
      },
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Diffit - Admin</h1>
            </div>
            <div className="flex items-center">
              <Link href="/api/auth/signout" className="text-gray-700 hover:text-gray-900">
                Cerrar Sesión
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Panel de Administración
            </h1>
            <p className="mt-2 text-gray-600">
              Gestiona tus clientes y sus planes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{clients.length}</CardTitle>
                <CardDescription>Total de Clientes</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {clients.reduce((acc, c) => acc + c._count.trainingPlan, 0)}
                </CardTitle>
                <CardDescription>Planes de Entrenamiento</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {clients.reduce((acc, c) => acc + c._count.nutritionPlan, 0)}
                </CardTitle>
                <CardDescription>Planes Nutricionales</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Clientes</CardTitle>
              <CardDescription>
                Lista de todos tus clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-xl font-semibold mb-2">
                    No tienes clientes asignados
                  </h3>
                  <p className="text-gray-600">
                    Los clientes aparecerán aquí cuando se les asigne como entrenador
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <h3 className="font-semibold text-lg">{client.name}</h3>
                        <p className="text-sm text-gray-600">{client.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-medium">Entrenamientos:</span>{' '}
                            {client._count.trainingPlan}
                          </div>
                          <div>
                            <span className="font-medium">Nutrición:</span>{' '}
                            {client._count.nutritionPlan}
                          </div>
                          <div>
                            <span className="font-medium">Sesiones:</span>{' '}
                            {client._count.workoutSessions}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Panel en Desarrollo
            </h3>
            <p className="text-blue-700 mb-4">
              El panel de administración completo está en desarrollo. Próximamente podrás:
            </p>
            <ul className="list-disc list-inside text-blue-700 space-y-2">
              <li>Crear y asignar planes de entrenamiento personalizados</li>
              <li>Subir y gestionar planes nutricionales en PDF</li>
              <li>Ver el progreso detallado de cada cliente</li>
              <li>Gestionar ejercicios y videos explicativos</li>
              <li>Enviar notificaciones y recordatorios</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
