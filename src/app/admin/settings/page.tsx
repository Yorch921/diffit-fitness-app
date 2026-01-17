'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    licenseNumber: '',
    logoUrl: '',
    photoUrl: '',
  })
  const [preferencesData, setPreferencesData] = useState({
    timezone: 'Europe/Madrid',
    notificationsOn: true,
  })

  useEffect(() => {
    if (session?.user) {
      fetchUserData()
    }
  }, [session])

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/admin/profile`)
      if (response.ok) {
        const data = await response.json()
        setProfileData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          specialty: data.specialty || '',
          licenseNumber: data.licenseNumber || '',
          logoUrl: data.logoUrl || '',
          photoUrl: data.photoUrl || '',
        })
        setPreferencesData({
          timezone: data.timezone || 'Europe/Madrid',
          notificationsOn: data.notificationsOn ?? true,
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)

    try {
      const formData = new FormData()
      formData.append('photo', file)

      const response = await fetch('/api/profile/photo', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setProfileData({ ...profileData, photoUrl: data.photoUrl })
        alert('Foto de perfil actualizada correctamente')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al subir la imagen')
      }
    } catch (error) {
      alert('Error al subir la imagen')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone,
          specialty: profileData.specialty,
          licenseNumber: profileData.licenseNumber,
        }),
      })

      if (response.ok) {
        alert('Perfil actualizado correctamente')
      } else {
        alert('Error al actualizar perfil')
      }
    } catch (error) {
      alert('Error al actualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferencesData),
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

  const tabs = [
    { id: 'profile', label: 'Perfil Profesional', icon: '👤' },
    { id: 'preferences', label: 'Preferencias', icon: '⚙️' },
  ]

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ajustes</h1>
        <p className="mt-2 text-gray-600">
          Configura tu perfil y preferencias de la aplicacion
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b mb-6">
        <div className="flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'profile' | 'preferences')}
              className={`pb-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Foto de Perfil */}
          <Card>
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
              <CardDescription>
                Sube una foto para personalizar tu perfil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {profileData.photoUrl ? (
                    <img
                      src={profileData.photoUrl}
                      alt="Foto de perfil"
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-100">
                      {profileData.name?.[0]?.toUpperCase() || 'E'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? 'Subiendo...' : 'Cambiar foto'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    JPG, PNG, WebP o GIF. Maximo 5MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Perfil Profesional */}
          <Card>
            <CardHeader>
              <CardTitle>Perfil Profesional</CardTitle>
              <CardDescription>
                Informacion sobre tu practica profesional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      placeholder="Tu nombre"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Profesional</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">
                      El email no se puede cambiar desde aqui
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="+34 600 000 000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialty">Especialidad</Label>
                    <Input
                      id="specialty"
                      value={profileData.specialty}
                      onChange={(e) => setProfileData({ ...profileData, specialty: e.target.value })}
                      placeholder="Nutricion Deportiva"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="licenseNumber">Numero de Colegiado</Label>
                    <Input
                      id="licenseNumber"
                      value={profileData.licenseNumber}
                      onChange={(e) => setProfileData({ ...profileData, licenseNumber: e.target.value })}
                      placeholder="12345"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de la Aplicacion</CardTitle>
              <CardDescription>
                Personaliza tu experiencia en Diffit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePreferences} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Zona Horaria</Label>
                    <select
                      id="timezone"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={preferencesData.timezone}
                      onChange={(e) => setPreferencesData({ ...preferencesData, timezone: e.target.value })}
                    >
                      <option value="Europe/Madrid">Europa/Madrid (GMT+1)</option>
                      <option value="Europe/London">Europa/Londres (GMT+0)</option>
                      <option value="America/New_York">America/Nueva York (GMT-5)</option>
                      <option value="America/Mexico_City">America/Ciudad de Mexico (GMT-6)</option>
                      <option value="America/Los_Angeles">America/Los Angeles (GMT-8)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Notificaciones</h4>
                      <p className="text-sm text-gray-600">
                        Recibe notificaciones sobre la actividad de tus clientes
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferencesData.notificationsOn}
                        onChange={(e) =>
                          setPreferencesData({ ...preferencesData, notificationsOn: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Preferencias'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informacion de la Cuenta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Rol</span>
                  <span className="text-sm text-gray-600">{session?.user?.role || 'TRAINER'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Email</span>
                  <span className="text-sm text-gray-600">{session?.user?.email}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">ID de Usuario</span>
                  <span className="text-sm text-gray-600 font-mono">{session?.user?.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
