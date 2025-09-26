'use client'

import Link from 'next/link'

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="footer-content">
            <Link href="#" className="text-2xl font-bold mb-4 block">
              AI Géospatial
            </Link>
            <p className="text-gray-300 mb-6">
              Assistant IA spécialisé dans l'analyse géospatiale et l'extraction de données de parcelles.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                <i className="bx bxl-facebook text-lg"></i>
              </a>
              <a href="#" className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors">
                <i className="bx bxl-twitter text-lg"></i>
              </a>
              <a href="#" className="w-10 h-10 bg-[#008751] rounded-full flex items-center justify-center hover:bg-[#00663f] transition-colors">
                <i className="bx bxl-linkedin text-lg"></i>
              </a>
            </div>
          </div>
          
          <div className="footer-content">
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Analyse de Parcelles
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Extraction Coordonnées
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Traitement GeoJSON
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Analyse Géospatiale
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="footer-content">
            <h3 className="text-lg font-semibold mb-4">Entreprise</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#about" className="text-gray-300 hover:text-white transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Notre Mission
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Carrières
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="footer-content">
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-8 text-center">
          <p className="text-gray-300">
            © 2024 AI Géospatial. Tous droits réservés. Développé avec ❤️ pour l'analyse géospatiale.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer