import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function NutritionPlansPage() {
  const session = await getServerSession(authOptions)

  const nutritionPlans = await prisma.nutritionPlan.findMany({
    where: {
      user: {
        trainerId: session!.user.id,
      },
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planes Nutricionales</h1>
          <p className="mt-2 text-gray-600">
            Gestiona los planes de nutrición de tus clientes
          </p>
        </div>
        <Link href="/admin/nutrition-plans/new">
          <Button>Subir Plan</Button>
        </Link>
      </div>

      {nutritionPlans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">🥗</div>
            <h3 className="text-xl font-semibold mb-2">
              No hay planes nutricionales
            </h3>
            <p className="text-gray-600 mb-4">
              Sube el primer plan nutricional para tus clientes
            </p>
            <Link href="/admin/nutrition-plans/new">
              <Button>Subir Primer Plan</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nutritionPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.title}</CardTitle>
                  {plan.isActive && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      Activo
                    </span>
                  )}
                </div>
                <CardDescription>Cliente: {plan.user.name}</CardDescription>
              </CardHeader>
              <CardContent>
                {plan.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {plan.description}
                  </p>
                )}
                <div className="space-y-2 text-sm text-gray-500">
                  <div>📅 Inicio: {formatDate(plan.startDate)}</div>
                  {plan.endDate && <div>Fin: {formatDate(plan.endDate)}</div>}
                </div>
                <div className="flex gap-2 mt-4">
                  <a
                    href={plan.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full" size="sm">
                      Ver PDF
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
