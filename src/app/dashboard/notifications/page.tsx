'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  scheduledFor: string | null
  sentAt: string | null
  createdAt: string
}

export default function ClientNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications')
      const data = await response.json()

      if (Array.isArray(data)) {
        setNotifications(data)
      } else {
        console.error('La respuesta no es un array:', data)
        setNotifications([])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })

      // Actualizar estado local
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read)

    try {
      await Promise.all(
        unreadNotifications.map(n =>
          fetch(`/api/notifications/${n.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read: true }),
          })
        )
      )

      // Actualizar estado local
      setNotifications(notifications.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const totalCount = notifications.length

  // Filtrar notificaciones según el filtro seleccionado
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter === 'read') return n.read
    return true
  })

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <p className="text-center text-gray-500">Cargando notificaciones...</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
        <p className="mt-2 text-gray-600">
          Historial de mensajes de tu entrenador
        </p>
      </div>

      {/* Estadísticas */}
      {totalCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{totalCount}</div>
                <div className="text-sm text-gray-600 mt-1">Total de mensajes</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{unreadCount}</div>
                <div className="text-sm text-gray-600 mt-1">Sin leer</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{totalCount - unreadCount}</div>
                <div className="text-sm text-gray-600 mt-1">Leídas</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros y acciones */}
      {totalCount > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  Todas ({totalCount})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  No leídas ({unreadCount})
                </Button>
                <Button
                  variant={filter === 'read' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('read')}
                >
                  Leídas ({totalCount - unreadCount})
                </Button>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  ✓ Marcar todas como leídas
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de notificaciones */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">
                {filter === 'unread' ? '✅' : filter === 'read' ? '📭' : '🔔'}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === 'unread' && 'No tienes mensajes sin leer'}
                {filter === 'read' && 'No tienes mensajes leídos'}
                {filter === 'all' && 'No tienes notificaciones'}
              </h3>
              <p className="text-gray-600">
                {filter === 'all'
                  ? 'Aquí aparecerán los mensajes de tu entrenador'
                  : 'Cambia el filtro para ver otros mensajes'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Mostrando {filteredNotifications.length} de {totalCount} mensajes
          </div>
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200 shadow-md'}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {!notification.read && (
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                      )}
                      {notification.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span>📅</span>
                      {notification.sentAt
                        ? formatDate(notification.sentAt)
                        : notification.scheduledFor
                          ? `Programado para ${formatDate(notification.scheduledFor)}`
                          : formatDate(notification.createdAt)
                      }
                    </CardDescription>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                    >
                      ✓ Marcar leída
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-900 whitespace-pre-wrap">{notification.message}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
