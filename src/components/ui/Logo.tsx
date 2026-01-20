// components/ui/Logo.tsx
import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link 
      href="/" 
      className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
      aria-label="Retour à l'accueil - LoiClair"
    >
      <div className="relative h-10 w-auto md:h-12">
        <Image
          src="/Logo/loiclair-logo.png"           // ← Change ici si ton nom de fichier est différent
          alt="LoiClair - Des lois complexes aux idées claires"
          fill
          sizes="(max-width: 768px) 160px, 220px"
          priority
          className="object-contain"
        />
      </div>
    </Link>
  );
}