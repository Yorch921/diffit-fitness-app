import { redirect } from 'next/navigation'

export default async function Home() {
  // Acceso directo sin autenticación - modo desarrollo
  redirect('/dashboard')
}
