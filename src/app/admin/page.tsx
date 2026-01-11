import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const isTrainerOrAdmin = session.user.role === 'TRAINER' || session.user.role === 'ADMIN'

  // Calcular fechas para filtros
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  // KPI 1: Clientes activos (tienen plan activo o estado ACTIVE)
  const activeClientsCount = await prisma.user.count({
    where: isTrainerOrAdmin
      ? {
          trainerId: session.user.id,
          status: 'ACTIVE',
        }
      : {
          role: 'CLIENT',
          status: 'ACTIVE',
        },
  })

  // KPI 2: Clientes nuevos este mes
  const newClientsCount = await prisma.user.count({
    where: isTrainerOrAdmin
      ? {
          trainerId: session.user.id,
          createdAt: { gte: startOfMonth },
        }
      : {
          role: 'CLIENT',
          createdAt: { gte: startOfMonth },
        },
  })

  // KPI 3: Planes nutricionales activos
  const activePlansCount = await prisma.nutritionPlan.count({
    where: {
      isActive: true,
      user: isTrainerOrAdmin
        ? {
            trainerId: session.user.id,
          }
        : {
            role: 'CLIENT',
          },
    },
  })

  // Alerta 1: Clientes sin seguimiento reciente (>14 días sin peso o entrenamiento)
  const clientsWithoutTracking = await prisma.user.findMany({
    where: isTrainerOrAdmin
      ? {
          trainerId: session.user.id,
          status: 'ACTIVE',
          AND: [
            {
              weightEntry: {
                none: {
                  date: { gte: fourteenDaysAgo },
                },
              },
            },
          ],
        }
      : {
          role: 'CLIENT',
          status: 'ACTIVE',
          AND: [
            {
              weightEntry: {
                none: {
                  date: { gte: fourteenDaysAgo },
                },
              },
            },
          ],
        },
    take: 5,
  })

  // Alerta 2: Próximas revisiones (próximos 7 días)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingReviews = await prisma.user.findMany({
    where: isTrainerOrAdmin
      ? {
          trainerId: session.user.id,
          nextReviewDate: {
            gte: now,
            lte: nextWeek,
          },
        }
      : {
          role: 'CLIENT',
          nextReviewDate: {
            gte: now,
            lte: nextWeek,
          },
        },
    orderBy: {
      nextReviewDate: 'asc',
    },
    take: 5,
  })

  // Últimos 5 clientes con actividad reciente
  const recentActivity = await prisma.user.findMany({
    where: isTrainerOrAdmin
      ? {
          trainerId: session.user.id,
        }
      : {
          role: 'CLIENT',
        },
    include: {
      weightEntry: {
        orderBy: { date: 'desc' },
        take: 1,
      },
      clientMesocycles: {
        where: { isActive: true },
        take: 1,
        include: {
          _count: {
            select: {
              microcycles: true,
            },
          },
        },
      },
    },
    take: 5,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Resumen de actividad y métricas clave
            </p>
          </div>

          {/* KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-blue-600">
                  {activeClientsCount}
                </CardTitle>
                <CardDescription>Clientes Activos</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-green-600">
                  {newClientsCount}
                </CardTitle>
                <CardDescription>Nuevos Este Mes</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-purple-600">
                  {activePlansCount}
                </CardTitle>
                <CardDescription>Planes Nutricionales Activos</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Alertas Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🚨 Alertas
              </CardTitle>
              <CardDescription>
                Clientes que requieren atención
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Clientes sin seguimiento */}
              {clientsWithoutTracking.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-orange-800 mb-3">
                    Sin seguimiento reciente (más de 14 días)
                  </h3>
                  <div className="space-y-2">
                    {clientsWithoutTracking.map((client) => (
                      <Link
                        key={client.id}
                        href={`/admin/clients/${client.id}`}
                        className="block p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{client.name}</p>
                            <p className="text-sm text-gray-600">{client.email}</p>
                          </div>
                          <span className="text-orange-600 text-sm">
                            Ver perfil →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Próximas revisiones */}
              {upcomingReviews.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-blue-800 mb-3">
                    Revisiones programadas (próximos 7 días)
                  </h3>
                  <div className="space-y-2">
                    {upcomingReviews.map((client) => (
                      <Link
                        key={client.id}
                        href={`/admin/clients/${client.id}`}
                        className="block p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{client.name}</p>
                            <p className="text-sm text-gray-600">
                              Revisión: {client.nextReviewDate ? formatDate(client.nextReviewDate.toISOString()) : 'No programada'}
                            </p>
                          </div>
                          <span className="text-blue-600 text-sm">
                            Ver perfil →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {clientsWithoutTracking.length === 0 && upcomingReviews.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  ✓ No hay alertas pendientes
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actividad Reciente */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>
                Últimos clientes con actividad registrada
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay actividad reciente
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((client) => {
                    const lastWeight = client.weightEntry[0]
                    const activeMesocycle = client.clientMesocycles[0]

                    return (
                      <Link
                        key={client.id}
                        href={`/admin/clients/${client.id}`}
                        className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{client.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {lastWeight && (
                                <span>
                                  Peso registrado: {lastWeight.weight} kg • {formatDate(lastWeight.date.toISOString())}
                                </span>
                              )}
                              {!lastWeight && activeMesocycle && (
                                <span>
                                  Mesociclo activo • {activeMesocycle._count.microcycles} semanas
                                </span>
                              )}
                              {!lastWeight && !activeMesocycle && (
                                <span className="text-gray-400">Sin actividad reciente</span>
                              )}
                            </p>
                          </div>
                          <span className="text-blue-600 text-sm">→</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
