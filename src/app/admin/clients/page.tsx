import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function ClientsPage() {
  const session = await getServerSession(authOptions)

  const clients = await prisma.user.findMany({
    where: {
      trainerId: session!.user.id,
    },
    include: {
      nutritionPlan: {
        where: { isActive: true },
        take: 1,
      },
      trainingPlan: {
        where: { isActive: true },
        take: 1,
      },
      workoutSessions: {
        orderBy: { completedAt: 'desc' },
        take: 1,
      },
      weightEntry: {
        orderBy: { date: 'desc' },
        take: 1,
      },
      _count: {
        select: {
          nutritionPlan: true,
          trainingPlan: true,
          workoutSessions: true,
          weightEntry: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="mt-2 text-gray-600">
            Administra tus clientes y sus planes
          </p>
        </div>
        <Link href="/admin/clients/new">
          <Button>Añadir Cliente</Button>
        </Link>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">
              No tienes clientes asignados
            </h3>
            <p className="text-gray-600 mb-4">
              Añade tu primer cliente para comenzar
            </p>
            <Link href="/admin/clients/new">
              <Button>Añadir Primer Cliente</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => {
            const lastWorkout = client.workoutSessions[0]
            const lastWeight = client.weightEntry[0]
            const activeNutrition = client.nutritionPlan[0]
            const activeTraining = client.trainingPlan[0]

            return (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{client.name}</CardTitle>
                    <div className="flex gap-2">
                      {activeNutrition && (
                        <span className="text-green-600" title="Plan nutricional activo">
                          🥗
                        </span>
                      )}
                      {activeTraining && (
                        <span className="text-blue-600" title="Plan de entrenamiento activo">
                          💪
                        </span>
                      )}
                    </div>
                  </div>
                  <CardDescription>{client.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Entrenamientos</p>
                        <p className="font-semibold">{client._count.workoutSessions}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Registros de peso</p>
                        <p className="font-semibold">{client._count.weightEntry}</p>
                      </div>
                    </div>

                    {lastWorkout && (
                      <div className="text-sm border-t pt-3">
                        <p className="text-gray-600">Último entrenamiento</p>
                        <p className="font-medium">{formatDate(lastWorkout.completedAt)}</p>
                      </div>
                    )}

                    {lastWeight && (
                      <div className="text-sm">
                        <p className="text-gray-600">Último peso</p>
                        <p className="font-medium">{lastWeight.weight.toFixed(1)} kg</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3">
                      <Link href={`/admin/clients/${client.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          Ver Detalle
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
