'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ClientSettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'personal' | 'preferences'>('personal')
  const [personalData, setPersonalData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    height: '',
    weight: '',
    goal: '',
  })
  const [preferences, setPreferences] = useState({
    notificationsOn: true,
    timezone: 'Europe/Madrid',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      const data = await response.json()

      if (data) {
        setPersonalData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          age: data.age?.toString() || '',
          height: data.height?.toString() || '',
          weight: data.initialWeight?.toString() || '',
          goal: data.goal || '',
        })
        setPreferences({
          notificationsOn: data.notificationsOn ?? true,
          timezone: data.timezone || 'Europe/Madrid',
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: personalData.name,
          phone: personalData.phone,
          age: personalData.age ? parseInt(personalData.age) : undefined,
          height: personalData.height ? parseFloat(personalData.height) : undefined,
          initialWeight: personalData.weight ? parseFloat(personalData.weight) : undefined,
          goal: personalData.goal,
        }),
      })

      if (response.ok) {
        alert('Datos personales actualizados correctamente')
      } else {
        alert('Error al actualizar datos personales')
      }
    } catch (error) {
      alert('Error al actualizar datos personales')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (response.ok) {
        alert('Preferencias actualizadas correctamente')
      } else {
        alert('Error al actualizar preferencias')
      }
    } catch (error) {
      alert('Error al actualizar preferencias')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-2 text-gray-600">
          Gestiona tu información personal y preferencias
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('personal')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'personal'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Datos Personales
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'preferences'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Preferencias
            </button>
          </nav>
        </div>
      </div>

      {/* Tab: Datos Personales */}
      {activeTab === 'personal' && (
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              Actualiza tus datos personales y objetivos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePersonal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    value={personalData.name}
                    onChange={(e) => setPersonalData({ ...personalData, name: e.target.value })}
                    placeholder="Tu nombre"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalData.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">El email no se puede modificar</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={personalData.phone}
                    onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                    placeholder="+34 600 000 000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Edad</Label>
                  <Input
                    id="age"
                    type="number"
                    value={personalData.age}
                    onChange={(e) => setPersonalData({ ...personalData, age: e.target.value })}
                    placeholder="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    value={personalData.height}
                    onChange={(e) => setPersonalData({ ...personalData, height: e.target.value })}
                    placeholder="175"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Peso inicial (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={personalData.weight}
                    onChange={(e) => setPersonalData({ ...personalData, weight: e.target.value })}
                    placeholder="75.0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Objetivo</Label>
                <textarea
                  id="goal"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={personalData.goal}
                  onChange={(e) => setPersonalData({ ...personalData, goal: e.target.value })}
                  placeholder="Describe tus objetivos de entrenamiento y nutrición..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab: Preferencias */}
      {activeTab === 'preferences' && (
        <Card>
          <CardHeader>
            <CardTitle>Preferencias</CardTitle>
            <CardDescription>
              Configura tus preferencias de la aplicación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePreferences} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications">Notificaciones</Label>
                    <p className="text-sm text-gray-500">
                      Recibe notificaciones de tu entrenador
                    </p>
                  </div>
                  <input
                    id="notifications"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={preferences.notificationsOn}
                    onChange={(e) => setPreferences({ ...preferences, notificationsOn: e.target.checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <select
                    id="timezone"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                    value={preferences.timezone}
                    onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  >
                    <option value="Europe/Madrid">Madrid (GMT+1)</option>
                    <option value="Europe/London">Londres (GMT+0)</option>
                    <option value="America/New_York">Nueva York (GMT-5)</option>
                    <option value="America/Los_Angeles">Los Ángeles (GMT-8)</option>
                    <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                    <option value="America/Buenos_Aires">Buenos Aires (GMT-3)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Preferencias'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
