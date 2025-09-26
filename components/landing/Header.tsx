'use client'

import { useState, useEffect } from 'react'
import useWindowDimensions from '@/hooks/useWindowDimensions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface HeaderProps {}

function Header({}: HeaderProps) {
  const [toggle, setToggle] = useState(false)
  const { width } = useWindowDimensions()

  useEffect(() => {
    const handleScroll = () => {
      const header = document.getElementById('header')
      if (header) {
        if (window.scrollY >= 80) {
          header.classList.add('scroll-header')
        } else {
          header.classList.remove('scroll-header')
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const sectionList = document.querySelectorAll('section[id]')
      sectionList.forEach((section) => {
        const sectionId = section.getAttribute('id')
        const menuItem = document.querySelector(`a[href*='${sectionId}']`)
        if (menuItem) {
          const scrollY = window.scrollY
          const sectionTop = (section as HTMLElement).offsetTop - 50
          if (
            scrollY > sectionTop &&
            scrollY <= sectionTop + (section as HTMLElement).offsetHeight
          ) {
            menuItem.classList.add('nav-link-active')
          } else {
            menuItem.classList.remove('nav-link-active')
          }
        }
      })
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const clickHandler = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'A') {
      setToggle(!toggle)
    }
  }

  return (
    <header className="header fixed top-0 left-0 z-50 w-full bg-white transition-all duration-400 shadow-sm" id="header">
      <nav className="nav h-16 flex justify-between items-center max-w-6xl mx-auto px-4">
        <Link href="#" className="nav-logo text-gray-800 font-semibold">
          <span className="text-2xl font-bold text-[#008751]">AI Géospatial</span>
        </Link>
        
        <div className={`nav-menu ${toggle || (width && width >= 767) ? 'menu-show' : ''} md:static fixed bg-white md:bg-transparent md:shadow-none shadow-lg md:p-0 p-10 md:w-auto w-11/12 md:top-auto -top-full left-0 right-0 mx-auto transition-all duration-400 md:rounded-none rounded-2xl z-40`}>
          <ul className="nav-list flex md:flex-row flex-col md:items-center items-center md:gap-8 gap-6" onClick={clickHandler}>
            <li className="nav-item">
              <a
                href="#home"
                className="nav-link text-gray-800 font-semibold hover:text-blue-600 transition-colors"
              >
                Accueil
              </a>
            </li>
            <li className="nav-item">
              <a
                href="#about"
                className="nav-link text-gray-800 font-semibold hover:text-blue-600 transition-colors"
              >
                À propos
              </a>
            </li>
            <li className="nav-item">
              <a
                href="#services"
                className="nav-link text-gray-800 font-semibold hover:text-blue-600 transition-colors"
              >
                Services
              </a>
            </li>
            <li className="nav-item">
              <a
                href="#contact"
                className="nav-link text-gray-800 font-semibold hover:text-blue-600 transition-colors"
              >
                Contact
              </a>
            </li>
          </ul>
        </div>
        
        <div className="nav-toggle md:hidden text-xl cursor-pointer" onClick={() => setToggle(!toggle)}>
          <i className="bx bx-grid-alt" />
        </div>
        
        <Link href="/chat" className={`${width && width < 960 ? 'hidden' : ''}`}>
          <Button className="bg-[#008751] hover:bg-[#00663f] text-white rounded-full">
            Démarrer le Chat
          </Button>
        </Link>
      </nav>
    </header>
  )
}

export default Header