import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import TrainingPlansListWrapper from './TrainingPlansListWrapper'

export default async function TrainingPlansPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role === 'CLIENT') {
    redirect('/login')
  }

  const trainingPlans = await prisma.trainingPlan.findMany({
    where: {
      user: {
        trainerId: session.user.id,
      },
    },
    include: {
      user: true,
      weeks: {
        include: {
          sessions: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Obtener lista de clientes para el modal de duplicar
  const clients = await prisma.user.findMany({
    where: {
      role: 'CLIENT',
      trainerId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planes de Entrenamiento</h1>
          <p className="mt-2 text-gray-600">
            Gestiona los planes de entrenamiento de tus clientes
          </p>
        </div>
        <Link href="/admin/training-plans/new">
          <Button>Crear Plan</Button>
        </Link>
      </div>

      <TrainingPlansListWrapper
        initialPlans={trainingPlans}
        clients={clients}
      />
    </div>
  )
}
