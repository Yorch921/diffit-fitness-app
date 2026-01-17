'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'

export function DashboardNav() {
  const { data: session } = useSession()
  const [showDropdown, setShowDropdown] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)

  useEffect(() => {
    if (session) {
      fetchProfile()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      const data = await response.json()
      setProfileData(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
              Diffit
            </Link>
          </div>

          {/* User Profile Section */}
          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {profileData?.name || session?.user?.name || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500">Cliente</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-semibold">
                  {profileData?.photoUrl ? (
                    <img
                      src={profileData.photoUrl}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span>{(profileData?.name || session?.user?.name || 'U')[0].toUpperCase()}</span>
                  )}
                </div>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setShowDropdown(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    ⚙️ Configuración
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    🚪 Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
