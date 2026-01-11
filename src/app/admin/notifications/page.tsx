'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Client {
  id: string
  name: string
  email: string
}

type NotificationType = 'individual' | 'massive' | 'scheduled' | null

export default function NotificationsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [notificationType, setNotificationType] = useState<NotificationType>(null)
  const [formData, setFormData] = useState({
    userId: '',
    title: '',
    message: '',
    scheduledFor: '',
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients-list')
      const data = await response.json()

      if (Array.isArray(data)) {
        setClients(data)
      } else {
        setClients([])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClients([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Si es masivo, enviar a todos los clientes
      if (notificationType === 'massive') {
        await Promise.all(
          clients.map((client) =>
            fetch('/api/admin/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: client.id,
                title: formData.title,
                message: formData.message,
                scheduledFor: formData.scheduledFor || null,
              }),
            })
          )
        )
      } else {
        // Individual o programado
        await fetch('/api/admin/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: formData.userId,
            title: formData.title,
            message: formData.message,
            scheduledFor: formData.scheduledFor || null,
          }),
        })
      }

      alert('Notificación enviada correctamente')
      setNotificationType(null)
      setFormData({
        userId: '',
        title: '',
        message: '',
        scheduledFor: '',
      })
    } catch (error) {
      alert('Error al enviar notificación')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setNotificationType(null)
    setFormData({
      userId: '',
      title: '',
      message: '',
      scheduledFor: '',
    })
  }

  // Vista de selección de tipo de notificación
  if (!notificationType) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
          <p className="mt-2 text-gray-600">
            Envía mensajes y notificaciones a tus clientes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
          {/* Individual */}
          <button
            onClick={() => setNotificationType('individual')}
            className="group relative p-8 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                <span className="text-4xl group-hover:scale-110 transition-transform">👤</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Individual</h3>
              <p className="text-gray-600 text-sm">
                Envía mensajes personalizados a clientes específicos
              </p>
            </div>
          </button>

          {/* Masivo */}
          <button
            onClick={() => setNotificationType('massive')}
            className="group relative p-8 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-500 transition-colors">
                <span className="text-4xl group-hover:scale-110 transition-transform">📢</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Masivo</h3>
              <p className="text-gray-600 text-sm">
                Comunica a todos tus clientes simultáneamente
              </p>
            </div>
          </button>

          {/* Programado */}
          <button
            onClick={() => setNotificationType('scheduled')}
            className="group relative p-8 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-500 transition-colors">
                <span className="text-4xl group-hover:scale-110 transition-transform">⏰</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Programado</h3>
              <p className="text-gray-600 text-sm">
                Programa mensajes para enviar en el futuro
              </p>
            </div>
          </button>
        </div>

        <Card className="mt-8 max-w-5xl">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">💡</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">¿Cómo funciona?</h3>
                <p className="text-gray-600 text-sm">
                  Selecciona el tipo de notificación que deseas enviar. Los mensajes se almacenan en el sistema
                  y los clientes podrán verlos en su panel de notificaciones.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Vista de formulario
  const titles = {
    individual: 'Mensaje Individual',
    massive: 'Mensaje Masivo',
    scheduled: 'Mensaje Programado',
  }

  const descriptions = {
    individual: 'Envía un mensaje personalizado a un cliente específico',
    massive: 'Envía el mismo mensaje a todos tus clientes',
    scheduled: 'Programa un mensaje para que se envíe en una fecha y hora específica',
  }

  return (
    <div className="px-4 py-6 sm:px-0 max-w-3xl">
      <div className="mb-6">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          ← Volver
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">{titles[notificationType]}</h1>
        <p className="mt-2 text-gray-600">{descriptions[notificationType]}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Componer Mensaje</CardTitle>
          <CardDescription>
            Completa los campos para enviar tu notificación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selector de cliente (solo para individual y programado) */}
            {notificationType !== 'massive' && (
              <div className="space-y-2">
                <Label htmlFor="userId">Cliente</Label>
                <select
                  id="userId"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                >
                  <option value="">Selecciona un cliente...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Destinatarios (solo mostrar para masivo) */}
            {notificationType === 'massive' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📢</span>
                  <p className="font-semibold text-green-900">
                    Se enviará a {clients.length} cliente{clients.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <p className="text-sm text-green-700">
                  Este mensaje se enviará a todos los clientes del sistema
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título del mensaje"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensaje</Label>
              <textarea
                id="message"
                className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Escribe tu mensaje aquí..."
                required
              />
            </div>

            {/* Programación (para scheduled o como opcional en otros) */}
            {notificationType === 'scheduled' ? (
              <div className="space-y-2">
                <Label htmlFor="scheduledFor">Fecha y hora de envío *</Label>
                <Input
                  id="scheduledFor"
                  type="datetime-local"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                  required
                />
                <p className="text-sm text-gray-500">
                  El mensaje se enviará automáticamente en la fecha y hora seleccionada
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="scheduledFor">Programar envío (opcional)</Label>
                <Input
                  id="scheduledFor"
                  type="datetime-local"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                />
                <p className="text-sm text-gray-500">
                  Deja vacío para enviar inmediatamente
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleBack}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Enviando...' : notificationType === 'scheduled' ? 'Programar Mensaje' : 'Enviar Ahora'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
