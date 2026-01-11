import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Solo los clientes pueden ver sus notificaciones
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { sentAt: { not: null } }, // Mensajes ya enviados
          {
            AND: [
              { scheduledFor: { not: null } },
              { scheduledFor: { lte: new Date() } }
            ]
          }, // Mensajes programados que ya llegó su hora
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Error al obtener notificaciones' },
      { status: 500 }
    )
  }
}
