'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

function ServicesSection() {
  const services = [
    {
      icon: 'bx-map-alt',
      title: 'Analyse de Parcelles',
      description: 'Analyse détaillée des parcelles avec extraction automatique des coordonnées et des limites géographiques.',
      color: 'blue'
    },
    {
      icon: 'bx-data',
      title: 'Traitement de Données',
      description: 'Traitement intelligent des fichiers géospatiaux (GeoJSON, Shapefile) avec analyse de chevauchements.',
      color: 'green'
    },
    {
      icon: 'bx-search-alt',
      title: 'Extraction d\'Informations',
      description: 'Extraction précise des coordonnées et métadonnées des parcelles à partir de documents complexes.',
      color: 'purple'
    }
  ]

  return (
    <section className="py-20 bg-white" id="services">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-16">
          Nos Services
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="service-card bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
              <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
                service.color === 'blue' ? 'bg-[#008751]/10' :
                service.color === 'green' ? 'bg-[#FCD116]/10' : 'bg-[#E8112D]/10'
              }`}>
                <i className={`bx ${service.icon} text-3xl`} style={{ color: service.color === 'blue' ? '#008751' : service.color === 'green' ? '#FCD116' : '#E8112D' }}></i>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {service.title}
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                {service.description}
              </p>
              
              <Link href="/chat">
                <Button variant="outline" className="w-full border-[#008751] text-[#008751] hover:bg-[#008751]/5">
                  Essayer maintenant
                </Button>
              </Link>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Link href="/chat">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
              Découvrir tous nos services
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default ServicesSection