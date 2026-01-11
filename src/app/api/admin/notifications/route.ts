import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, title, message, scheduledFor } = body

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'Usuario, título y mensaje son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el cliente pertenece al trainer
    const client = await prisma.user.findFirst({
      where: {
        id: userId,
        role: 'CLIENT',
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: 'message',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        sentAt: scheduledFor ? null : new Date(),
      },
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Error al crear notificación' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Si es trainer, obtener notificaciones de sus clientes
    if (session.user.role !== 'CLIENT') {
      const notifications = await prisma.notification.findMany({
        where: {
          user: {
            trainerId: session.user.id,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })

      return NextResponse.json(notifications)
    }

    // Si es cliente, obtener sus propias notificaciones
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: { createdAt: 'desc' },
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
