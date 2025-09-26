'use client'

import { Button } from '@/components/ui/button'

function ContactSection() {
  return (
    <section className="py-20 bg-gray-50" id="contact">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-6">
            Contactez-nous
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12">
            Une question ? Besoin d'aide ? Notre équipe est là pour vous accompagner.
          </p>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="contact-info">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                Informations de contact
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-[#008751]/10 rounded-lg flex items-center justify-center mr-4">
                    <i className="bx bx-envelope text-xl" style={{ color: '#008751' }}></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Email</h4>
                    <p className="text-gray-600">contact@ai-geospatial.com</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <i className="bx bx-phone text-xl text-green-600"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Téléphone</h4>
                    <p className="text-gray-600">+33 1 23 45 67 89</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <i className="bx bx-map text-xl text-purple-600"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Adresse</h4>
                    <p className="text-gray-600">123 Rue de la Tech, 75001 Paris</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="contact-form">
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#008751] focus:border-transparent"
                    placeholder="Votre nom"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#008751] focus:border-transparent"
                    placeholder="votre@email.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#008751] focus:border-transparent"
                    placeholder="Votre message..."
                  ></textarea>
                </div>
                
                <Button type="submit" className="w-full bg-[#008751] hover:bg-[#00663f] text-white py-3 rounded-2xl">
                  Envoyer le message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContactSection