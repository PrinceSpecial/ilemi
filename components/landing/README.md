# Landing Page Components

Cette collection de composants implémente une landing page moderne et responsive pour l'assistant IA géospatial.

## Composants

### LandingPage
Composant principal qui combine tous les autres composants pour créer la page d'accueil complète.

### Header
- Navigation fixe avec menu responsive
- Logo et liens de navigation
- Bouton CTA vers le chat
- Support mobile avec menu hamburger

### HomeSection
- Section héro avec titre principal
- Description de l'assistant IA
- Boutons d'action (commencer, en savoir plus)
- Illustration avec gradient

### AboutSection
- Présentation de la solution
- Fonctionnalités clés avec icônes
- Illustration explicative

### ServicesSection
- Présentation des services offerts
- Cartes de services avec icônes
- Boutons d'action pour chaque service

### ContactSection  
- Informations de contact
- Formulaire de contact
- Liens sociaux et coordonnées

### Footer
- Liens organisés par catégories
- Informations de l'entreprise
- Liens sociaux
- Copyright

### ScrollUp
- Bouton de retour en haut
- Apparaît après défilement
- Animation smooth scroll

## Utilisation

```tsx
import { LandingPage } from '@/components/landing'

function HomePage() {
  return <LandingPage />
}
```

## Styles

Les composants utilisent Tailwind CSS pour le styling avec des classes utilitaires modernes. Les icônes sont fournies par Boxicons.

## Dépendances

- React 19+
- Next.js 15+
- Tailwind CSS
- Boxicons (CDN)
- Composants UI personnalisés (@/components/ui)