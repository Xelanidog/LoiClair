'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function LoginForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      window.location.href = searchParams.get('from') || '/'
    } else {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <Field>
        <FieldLabel htmlFor="login-password">Mot de passe</FieldLabel>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error
          ? <FieldDescription className="text-destructive">Mot de passe incorrect</FieldDescription>
          : <FieldDescription>Ce site est en accès privé.</FieldDescription>
        }
      </Field>
      <Button type="submit" disabled={loading}>
        {loading ? 'Connexion...' : 'Accéder au site'}
      </Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm flex flex-col items-center gap-8 px-6">
        {/* Logo + Tagline */}
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">LoiClair</h1>
          <p className="text-sm text-muted-foreground">
            Lois claires, République accessible
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs text-muted-foreground bg-muted/40 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Bêta privée
          </div>

        {/* Formulaire */}
        <Suspense fallback={<p>Chargement...</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}