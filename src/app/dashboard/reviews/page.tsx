'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface Review {
  id: string
  reviewDate: string
  changes: string
  notes: string | null
  nextReviewDate: string | null
  createdAt: string
  trainer: {
    id: string
    name: string
    email: string
  } | null
}

export default function ClientReviewsPage() {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [nextReviewDate, setNextReviewDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/client/reviews')
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews)
        setNextReviewDate(data.nextReviewDate)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `Hace ${Math.abs(diffDays)} dias`
    } else if (diffDays === 0) {
      return 'Hoy'
    } else if (diffDays === 1) {
      return 'Manana'
    } else if (diffDays <= 7) {
      return `En ${diffDays} dias`
    } else {
      return formatDate(dateString)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header con boton volver */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al inicio
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Mis Revisiones</h1>
        <p className="mt-2 text-gray-600">
          Historial de revisiones de tu entrenador
        </p>
      </div>

      {/* Proxima revision programada */}
      {nextReviewDate && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-2xl">📅</span>
                </div>
                <div>
                  <p className="font-semibold text-blue-900">Proxima revision programada</p>
                  <p className="text-sm text-blue-700">
                    {formatDate(nextReviewDate)} ({formatRelativeDate(nextReviewDate)})
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de revisiones */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No tienes revisiones todavia</h3>
            <p className="text-gray-600">
              Tu entrenador aun no ha registrado ninguna revision de tu progreso.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <Card key={review.id} className={index === 0 ? 'border-green-200' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {index === 0 && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          Ultima
                        </span>
                      )}
                      Revision del {formatDate(review.reviewDate)}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Por {review.trainer?.name || 'Entrenador'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Cambios realizados */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="text-lg">🔄</span>
                    Cambios realizados
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">{review.changes}</p>
                  </div>
                </div>

                {/* Notas del entrenador */}
                {review.notes && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-lg">💬</span>
                      Notas del entrenador
                    </h4>
                    <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                      <p className="text-gray-800 whitespace-pre-wrap italic">{review.notes}</p>
                    </div>
                  </div>
                )}

                {/* Proxima revision (si fue programada en esta revision) */}
                {review.nextReviewDate && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Siguiente revision programada:</span>{' '}
                      {formatDate(review.nextReviewDate)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resumen */}
      {reviews.length > 0 && (
        <Card className="mt-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Total de revisiones: {reviews.length}</span>
              <span>
                Primera revision: {formatDate(reviews[reviews.length - 1].reviewDate)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
