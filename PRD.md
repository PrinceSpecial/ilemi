## 1. Introduction

Ce document définit les exigences pour le développement d'un chatbot interactif d'analyse de données foncières. L'objectif principal est de fournir aux utilisateurs un moyen simple et conversationnel de vérifier le statut de leur parcelle de terrain en téléchargeant un document contenant les coordonnées de celle-ci. Le système traitera ces informations en les superposant à des couches de données géospatiales pour générer un rapport détaillé et visuel.

---

## 2. Objectifs du projet

* **Simplifier l'accès à l'information foncière :** Rendre les données complexes sur les titres fonciers accessibles et compréhensibles pour le grand public via une interface de chat intuitive.
* **Automatiser l'analyse de parcelle :** Automatiser le processus de vérification en croisant les coordonnées d'une parcelle utilisateur avec les couches de données géospatiales existantes.
* **Fournir un rapport complet :** Générer un rapport clair et détaillé, incluant des visualisations cartographiques, pour informer l'utilisateur sur le statut de sa parcelle.
* **Intégrer la communication et l'analyse :** Combiner un chatbot conversationnel avec un moteur d'analyse géospatial et des composants d'interface utilisateur (UI) génératifs.

---

## 3. Fonctionnalités et exigences

### 3.1. Expérience utilisateur (UX)

L'interaction sera entièrement basée sur une interface de chat conversationnelle. Le flux utilisateur se déroule comme suit :

#### Phase 1 : Conversation initiale et guidage
1.  **Accueil et orientation :** L'utilisateur interagit avec Ilèmi (le chatbot) pour exprimer son besoin de vérification foncière.
2.  **Explication du processus :** Le bot explique qu'il faut fournir un document contenant le relevé topographique du terrain (coordonnées géographiques).
3.  **Demande de document :** Le bot invite l'utilisateur à télécharger un document (PDF, image) contenant les coordonnées de sa parcelle.

#### Phase 2 : Traitement automatisé avec feedback visuel
4.  **Upload et validation :** Une fois le document téléchargé, le système affiche un indicateur de progression animé.
5.  **Extraction des coordonnées :** 
    - Affichage : "🔄 Traitement du document en cours..."
    - Le module de traitement extrait les coordonnées en arrière-plan
6.  **Analyse géospatiale :**
    - Affichage : "🗺️ Comparaison avec les données géospatiales en cours..."
    - Les coordonnées sont superposées aux couches GeoJSON
    - Attribution automatique des labels selon les correspondances trouvées
7.  **Génération du rapport :**
    - Affichage : "📊 Génération de votre rapport personnalisé..."
    - Compilation des résultats d'analyse

#### Phase 3 : Présentation des résultats et suivi
8.  **Affichage des résultats :** Le chatbot présente les résultats avec :
    - Carte interactive montrant la parcelle et les superpositions
    - Rapport structuré avec statuts et recommandations
    - Labels attribués (ex: "Zone litigieuse", "Domaine public", etc.)
9.  **Interaction post-analyse :** L'utilisateur peut poser des questions de clarification sur les résultats obtenus.
10. **Persistance des données :** Le système conserve les résultats d'analyse pour permettre à l'agent de répondre aux questions ultérieures de l'utilisateur.

### 3.2. Exigences fonctionnelles

#### 3.2.1. Système conversationnel et guidage
* **Interface de chat intelligente :** Le chatbot doit pouvoir :
  * Comprendre les demandes de vérification foncière en français
  * Expliquer clairement le processus à l'utilisateur
  * Guider l'utilisateur pour obtenir le bon type de document
  * Répondre aux questions de clarification tout au long du processus

#### 3.2.2. Traitement de documents et extraction
* **Extraction de coordonnées :** Le système doit être capable d'extraire les coordonnées d'une parcelle à partir de divers formats de documents (PDF, images).
* **Validation des données :** Vérifier la cohérence et la validité des coordonnées extraites avant traitement.

#### 3.2.3. Moteur d'analyse géospatial
* **Chargement des données :** Charger et indexer les couches GeoJSON fournies (AIF, aires protégées, DPL, DPM, TF démembrés, TF reconstitués, TF en cours, parcelles individuelles, TF de l'État, zones litigieuses, restrictions).
* **Superposition (Overlay) :** Superposer les coordonnées extraites de la parcelle utilisateur avec chacune des couches.
* **Détection de correspondance :** Identifier les couches qui correspondent ou chevauchent la parcelle de l'utilisateur.
* **Attribution de labels :** Attribuer des labels de statut à la parcelle en fonction des correspondances trouvées (ex: "en litige", "restreinte", "domaine public maritime").

#### 3.2.4. Feedback visuel et progression
* **Indicateurs de progression animés :** Affichage en temps réel des étapes :
  * "🔄 Traitement du document en cours..." (extraction coordonnées)
  * "🗺️ Comparaison avec les données géospatiales en cours..." (analyse spatiale)
  * "📊 Génération de votre rapport personnalisé..." (compilation résultats)
* **Estimations de temps :** Fournir des estimations approximatives pour chaque étape.

#### 3.2.5. Composants UI génératifs
* **Visualisation cartographique :** Une carte interactive affichant la parcelle de l'utilisateur avec des *overlays* des couches GeoJSON correspondantes. Chaque couche doit être clairement distinguée par une couleur ou une symbologie.
* **Rapport structuré :** Un rapport textuel détaillé, décomposé en plusieurs sections (ex: statut juridique, restrictions, informations cadastrales), basé sur les labels attribués. Ce rapport doit être présenté de manière claire et concise.

#### 3.2.6. Persistance et récupération des analyses
* **Stockage des résultats :** Le système doit conserver les résultats d'analyse pour chaque utilisateur.
* **Outil de récupération :** L'agent conversationnel doit pouvoir accéder aux résultats d'analyses précédentes pour répondre aux questions ultérieures de l'utilisateur.
* **Contexte conversationnel :** Maintenir le contexte de l'analyse pour permettre des questions de suivi et d'approfondissement.

---

## 4. Données et systèmes externes

### 4.1. Données d'entrée

* **Fichiers de l'utilisateur :** Documents divers (ex: images, PDF) contenant les coordonnées de la parcelle.

### 4.2. Données géospatiales (GeoJSON)

Les couches de données suivantes seront utilisées :
* **Couche des AIF :** Association d'Intérêts Fonciers.
* **Couche des airs protégées :** Nécessite une attention particulière en raison de sa fiabilité variable.
* **Couches DPL et DPM :** Domaine Public Lagunaire et Maritime.
* **Couche des Titres Fonciers démembrés :** Parcelle morcelée ou recasée.
* **Couche des Titres Fonciers reconstitués :** Similaire aux TF démembrés, mais pour de grandes superficies.
* **Couche des TF en cours :** Parcelles en cours de traitement.
* **Couche des parcelles objets d’enregistrement individuel :** Parcelles enregistrées au cadastre.
* **Couche des Titres Fonciers de l’État (tf_etat) :** Échantillon des TF de l'État.
* **Couche des zones litigieuses :** Entités en litige devant les juridictions.
* **Couche des restrictions :** Inclut les zones déclarées d'utilités publiques (ZDUP ou PAG). Le système devra utiliser les champs `type` et `désignation`.

---

## 5. Spécifications techniques

* **Architecture :** Le système sera composé de trois modules principaux :
    1.  **Module Chatbot :** Gère la conversation et l'interface utilisateur.
    2.  **Module de Traitement des Documents :** Responsable de l'extraction des données.
    3.  **Module d'Analyse Géospatiale :** Effectue les calculs de superposition et d'analyse.
* **API :** Une API interne sera nécessaire pour permettre la communication entre les différents modules. Le module de traitement enverra les données au module d'analyse, qui renverra la *payload* au chatbot.
* **Technologies potentielles :**
    * **Extraction de coordonnées :** Module existant appelé via API avec le document uploadé.
    * **Chatbot :** Aucun framework utilisé ; implémentation directe dans la codebase (Next.js avec Vercel AI SDK et Google Gemini).
    * **Analyse Géospatiale :** Script JavaScript utilisant Turf.js pour l'analyse des coordonnées extraites et des fichiers GeoJSON.
    * **Visualisation Cartographique :** Bibliothèques front-end comme **Leaflet** ou **Mapbox GL JS** pour afficher la carte interactive et les *overlays*.
* **Performance :** 
  * Extraction de coordonnées : maximum 5-8 secondes
  * Analyse géospatiale : maximum 8-10 secondes  
  * Génération du rapport : maximum 3-5 secondes
  * **Temps total :** Le processus global ne doit pas dépasser 20-25 secondes pour garantir une bonne expérience utilisateur.
* **Feedback utilisateur :** Pendant les phases de traitement, l'utilisateur doit toujours voir un indicateur de progression pour maintenir l'engagement.

---

## 6. Critères de réussite

### 6.1. Expérience utilisateur
* Le chatbot guide efficacement l'utilisateur à travers tout le processus de vérification.
* Les indicateurs de progression sont clairs et informatifs à chaque étape.
* L'utilisateur comprend chaque phase du processus grâce aux messages explicatifs.
* Le temps d'attente perçu est réduit grâce aux animations et feedback visuels.

### 6.2. Performance technique
* Le système extrait correctement les coordonnées de la parcelle dans 95% des cas.
* Le moteur d'analyse identifie correctement les correspondances avec les couches GeoJSON.
* Le temps de traitement total respecte les limites définies (< 25 secondes).
* Les composants UI (carte et rapport) sont fonctionnels et s'affichent correctement.

### 6.3. Qualité des résultats
* Le rapport généré est clair, précis et compréhensible pour un utilisateur non-expert.
* Les labels attribués correspondent fidèlement aux superpositions détectées.
* L'agent conversationnel peut répondre aux questions de suivi sur les résultats.
* Les analyses précédentes sont correctement récupérées et contextualisées.

### 6.4. Sécurité et confidentialité
* Le système est sécurisé et garantit la confidentialité des données de l'utilisateur.
* Les documents uploadés sont traités de manière sécurisée et supprimés après analyse.
* Les résultats d'analyse sont associés de manière sécurisée à la session utilisateur.