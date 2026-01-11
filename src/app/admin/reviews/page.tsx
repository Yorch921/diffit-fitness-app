'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Review {
  id: string
  userId: string
  reviewDate: string
  changes: string
  notes: string | null
  nextReviewDate: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface Client {
  id: string
  name: string
  email: string
  nextReviewDate: string | null
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [upcomingReviews, setUpcomingReviews] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    userId: '',
    reviewDate: new Date().toISOString().split('T')[0],
    changes: '',
    notes: '',
    nextReviewDate: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [reviewsRes, clientsRes] = await Promise.all([
        fetch('/api/admin/reviews'),
        fetch('/api/admin/clients-list'),
      ])

      const reviewsData = await reviewsRes.json()
      const clientsData = await clientsRes.json()

      // Validar que sean arrays antes de actualizar el estado
      if (Array.isArray(reviewsData)) {
        setReviews(reviewsData)
      } else {
        console.error('reviewsData no es un array:', reviewsData)
        setReviews([])
      }

      if (Array.isArray(clientsData)) {
        setClients(clientsData)
      } else {
        console.error('clientsData no es un array:', clientsData)
        setClients([])
      }

      // Filtrar clientes con próximas revisiones (próximos 7 días)
      const now = new Date()
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const upcoming = clientsData.filter((client: Client) => {
        if (!client.nextReviewDate) return false
        const reviewDate = new Date(client.nextReviewDate)
        return reviewDate >= now && reviewDate <= nextWeek
      })

      setUpcomingReviews(upcoming)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({
          userId: '',
          reviewDate: new Date().toISOString().split('T')[0],
          changes: '',
          notes: '',
          nextReviewDate: '',
        })
        fetchData()
      } else {
        alert('Error al crear revisión')
      }
    } catch (error) {
      alert('Error al crear revisión')
    } finally {
      setLoading(false)
    }
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <p className="text-center text-gray-500">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seguimientos y Revisiones</h1>
          <p className="mt-2 text-gray-600">
            Gestiona las revisiones de tus clientes
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Registrar Revisión'}
        </Button>
      </div>

      {/* Formulario de nueva revisión */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Registrar Nueva Revisión</CardTitle>
            <CardDescription>
              Documenta los cambios realizados y programa la próxima revisión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId">Cliente</Label>
                <select
                  id="userId"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                >
                  <option value="">Selecciona un cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewDate">Fecha de Revisión</Label>
                <Input
                  id="reviewDate"
                  type="date"
                  value={formData.reviewDate}
                  onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="changes">Cambios Realizados</Label>
                <textarea
                  id="changes"
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.changes}
                  onChange={(e) => setFormData({ ...formData, changes: e.target.value })}
                  placeholder="Describe los cambios realizados en el plan, medidas tomadas, ajustes..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas Adicionales (opcional)</Label>
                <textarea
                  id="notes"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observaciones, comentarios del cliente, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextReviewDate">Próxima Revisión</Label>
                <Input
                  id="nextReviewDate"
                  type="date"
                  value={formData.nextReviewDate}
                  onChange={(e) => setFormData({ ...formData, nextReviewDate: e.target.value })}
                />
                <p className="text-sm text-gray-500">
                  Programa la fecha para la siguiente revisión del cliente
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Revisión'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Próximas revisiones */}
      {upcomingReviews.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📅 Próximas Revisiones (7 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingReviews.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{client.name}</h4>
                    <p className="text-sm text-gray-600">
                      Revisión programada: {client.nextReviewDate ? formatDate(client.nextReviewDate) : '—'}
                    </p>
                  </div>
                  <Link href={`/admin/clients/${client.id}`}>
                    <Button variant="outline" size="sm">
                      Ver Cliente
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de revisiones */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Revisiones</CardTitle>
          <CardDescription>
            Registro de todas las revisiones realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No hay revisiones registradas
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Link
                        href={`/admin/clients/${review.userId}`}
                        className="text-lg font-semibold text-blue-600 hover:underline"
                      >
                        {review.user.name}
                      </Link>
                      <p className="text-sm text-gray-600">{review.user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatDate(review.reviewDate)}</p>
                      {review.nextReviewDate && (
                        <p className="text-xs text-gray-500">
                          Próxima: {formatDate(review.nextReviewDate)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Cambios realizados:</p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{review.changes}</p>
                    </div>

                    {review.notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Notas:</p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{review.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
