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
        photoUrl: true,
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

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Error al obtener perfil' },
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
      photoUrl,
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
        photoUrl: photoUrl !== undefined ? photoUrl : undefined,
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
        photoUrl: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    )
  }
}
