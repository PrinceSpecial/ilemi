'use client'

import Header from './Header'
import HomeSection from './HomeSection'
import AboutSection from './AboutSection'
import ServicesSection from './ServicesSection'
import ContactSection from './ContactSection'
import Footer from './Footer'
import ScrollUp from './ScrollUp'

function LandingPage() {
  return (
    <div className="landing-page">
      <Header />
      <main>
        <HomeSection />
        <AboutSection />
        <ServicesSection />
        <ContactSection />
      </main>
      <Footer />
      <ScrollUp />
    </div>
  )
}

export default LandingPage