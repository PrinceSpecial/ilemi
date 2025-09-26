'use client'

import { useEffect, useState } from 'react'

function ScrollUp() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY >= 200)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 w-12 h-12 bg-[#008751] hover:bg-[#00663f] text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center z-40 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      title="Retour en haut"
    >
      <i className="bx bx-up-arrow-alt text-xl"></i>
    </button>
  )
}

export default ScrollUp