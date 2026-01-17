import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        specialty: true,
        licenseNumber: true,
        logoUrl: true,
        image: true,
        primaryColor: true,
        timezone: true,
        notificationsOn: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Devolver con image como null si no existe
    return NextResponse.json({
      ...user,
      image: user.image || null,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching admin profile:', errorMessage, error)
    return NextResponse.json(
      { error: 'Error al obtener perfil', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      phone,
      specialty,
      licenseNumber,
      timezone,
      notificationsOn,
    } = body

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        specialty: specialty || undefined,
        licenseNumber: licenseNumber || undefined,
        timezone: timezone || undefined,
        notificationsOn: notificationsOn !== undefined ? notificationsOn : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialty: true,
        licenseNumber: true,
        timezone: true,
        notificationsOn: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error updating admin profile:', errorMessage, error)
    return NextResponse.json(
      { error: 'Error al actualizar perfil', details: errorMessage },
      { status: 500 }
    )
  }
}
