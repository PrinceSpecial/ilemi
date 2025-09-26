import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Géospatial - Assistant IA pour l'Analyse Géospatiale",
  description:
    "Assistant IA spécialisé dans l'analyse géospatiale, l'extraction de coordonnées et l'analyse de parcelles. Solution innovante pour vos besoins en géomatique.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://unpkg.com/boxicons@2.0.9/css/boxicons.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
