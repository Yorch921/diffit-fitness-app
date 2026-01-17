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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        age: true,
        height: true,
        initialWeight: true,
        goal: true,
        timezone: true,
        notificationsOn: true,
        image: true,
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
    console.error('Error fetching profile:', errorMessage, error)
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
      age,
      height,
      initialWeight,
      goal,
      timezone,
      notificationsOn,
      image,
    } = body

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        age: age ? parseInt(age) : undefined,
        height: height ? parseFloat(height) : undefined,
        initialWeight: initialWeight ? parseFloat(initialWeight) : undefined,
        goal: goal || undefined,
        timezone: timezone || undefined,
        notificationsOn: notificationsOn !== undefined ? notificationsOn : undefined,
        image: image !== undefined ? image : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        age: true,
        height: true,
        initialWeight: true,
        goal: true,
        timezone: true,
        notificationsOn: true,
        image: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error updating profile:', errorMessage, error)
    return NextResponse.json(
      { error: 'Error al actualizar perfil', details: errorMessage },
      { status: 500 }
    )
  }
}
