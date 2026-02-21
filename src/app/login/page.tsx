'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

 async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  const res = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
    headers: { 'Content-Type': 'application/json' },
  })
  if (res.ok) {
    const from = searchParams.get('from') || '/'
    console.log('Login OK, redirection vers:', from)
    window.location.href = from // ← remplace router.push par ça
  } else {
    setError(true)
  }
}

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2>Accès privé</h2>
      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ padding: 8, fontSize: 16 }}
      />
      {error && <p style={{ color: 'red' }}>Mot de passe incorrect</p>}
      <button type="submit" style={{ padding: 8 }}>Entrer</button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Suspense fallback={<p>Chargement...</p>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}