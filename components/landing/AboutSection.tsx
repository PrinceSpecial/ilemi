'use client'

function AboutSection() {
  return (
    <section className="py-20 bg-gray-50" id="about">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="about-data">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 text-center md:text-left">
              À propos de notre solution
            </h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Notre assistant IA révolutionne l'analyse géospatiale en combinant l'intelligence artificielle 
              et les données géographiques. Développé spécifiquement pour les professionnels de la géomatique, 
              notre chatbot offre des capacités avancées d'analyse de parcelles, d'extraction de coordonnées 
              et de traitement de données géospatiales.
            </p>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Grâce à des algorithmes sophistiqués et une interface intuitive, nous rendons accessible 
              l'analyse complexe de données géographiques à tous les utilisateurs, qu'ils soient experts 
              ou débutants dans le domaine.
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="feature-item">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <i className="bx bx-map text-2xl" style={{ color: '#008751' }}></i>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Analyse Géospatiale</h3>
                <p className="text-sm text-gray-600">Traitement avancé des données géographiques</p>
              </div>
              
              <div className="feature-item">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <i className="bx bx-target-lock text-2xl" style={{ color: '#FCD116' }}></i>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Extraction Précise</h3>
                <p className="text-sm text-gray-600">Coordonnées et limites de parcelles</p>
              </div>
            </div>
          </div>
          
          <div className="about-image">
            <div className="w-full h-80 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl shadow-lg flex items-center justify-center">
              <div className="text-center text-white">
                <i className="bx bx-data text-5xl mb-4"></i>
                <h3 className="text-xl font-bold">Données Géospatiales</h3>
                <p className="text-green-100 mt-2">Analyse Intelligente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AboutSection