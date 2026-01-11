import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      email,
      password,
      age,
      gender,
      height,
      initialWeight,
      goal,
      clinicalNotes,
      nextReviewDate
    } = body

    // Validar campos requeridos
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    // Verificar que el email no exista
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 400 }
      )
    }

    // Crear cliente con todos los campos
    const hashedPassword = await hash(password, 10)
    const client = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'CLIENT',
        trainerId: session.user.id,
        // Campos opcionales
        age: age || null,
        gender: gender || null,
        height: height || null,
        initialWeight: initialWeight || null,
        goal: goal || null,
        clinicalNotes: clinicalNotes || null,
        nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : null,
      },
    })

    return NextResponse.json({
      id: client.id,
      name: client.name,
      email: client.email,
    })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    )
  }
}
