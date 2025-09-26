'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

function HomeSection() {
  return (
    <section className="min-h-screen flex items-center py-20" id="home">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div className="home-data">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
            Assistant IA pour l'Analyse Géospatiale
          </h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Découvrez notre chatbot intelligent spécialisé dans l'analyse de données géospatiales, 
            l'extraction de coordonnées et l'analyse de parcelles. Une solution innovante pour 
            vos besoins en géomatique.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/chat">
              <Button size="lg" className="bg-[#008751] hover:bg-[#00663f] text-white px-8 py-3 rounded-2xl">
                Commencer maintenant
              </Button>
            </Link>
            <Link href="#about">
              <Button variant="outline" size="lg" className="bg-[#FCD116] hover:brightness-95 text-black px-8 py-3 rounded-2xl">
                En savoir plus
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="home-image md:order-first">
          <div className="w-full h-96 bg-gradient-to-br from-[#008751] via-[#FCD116] to-[#E8112D] rounded-2xl shadow-2xl border-2 border-[rgba(0,0,0,0.06)] flex items-center justify-center">
            <div className="text-center text-white">
              <i className="bx bx-map text-6xl mb-4"></i>
              <h3 className="text-2xl font-bold">Analyse Géospatiale</h3>
              <p className="text-yellow-100 mt-2">Powered by AI</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomeSection