import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ClientsTable from '@/components/ClientsTable'

export default async function ClientsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Todos los admins (TRAINER o ADMIN) ven todos los clientes
  const clients = await prisma.user.findMany({
    where: {
      role: 'CLIENT',
    },
    include: {
      trainer: {
        select: {
          id: true,
          name: true,
          specialty: true,
        },
      },
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

  return <ClientsTable clients={clients} />
}
