import Link from 'next/link'
import { BookOpen, Lightbulb, FlaskConical } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const sections = [
  {
    href: '/documentation/guide',
    icon: BookOpen,
    title: 'Guide d\'utilisation',
    description: 'Comment lire et utiliser les tableaux de bord, indicateurs et dossiers législatifs de LoiClair.',
  },
  {
    href: '/documentation/glossaire',
    icon: Lightbulb,
    title: 'Glossaire',
    description: 'Définitions des termes législatifs utilisés sur le site : statuts, procédures, étapes d\'examen.',
  },
  {
    href: '/documentation/methode',
    icon: FlaskConical,
    title: 'Méthodologie',
    description: 'Comment sont calculés les indicateurs, d\'où viennent les données et quelles sont leurs limites.',
  },
]

export default function DocumentationPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4 text-center">Documentation</h1>
      <p className="text-lg text-muted-foreground mb-12 text-center">
        Tout ce qu&apos;il faut savoir pour lire LoiClair avec confiance.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {sections.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href}>
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <Icon className="h-6 w-6 text-primary mb-2" />
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
