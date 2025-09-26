const fs = require("fs");
const fetch = require("node-fetch"); // npm install node-fetch@2

const url = "https://e42feb93c11e.ngrok-free.app/synthesize";
const textToSynthesize = "Simplifiez vos démarches foncières au Bénin. Ilèmi est votre assistant virtuel intelligent qui révolutionne la gestion des démarches dans le domaine foncier au Bénin.";

(async () => {
  try {
    const params = new URLSearchParams({ text_fr: textToSynthesize });
    const response = await fetch(`${url}?${params.toString()}`, { method: "POST" });

    if (response.ok) {
      console.log("Requête réussie ✅. Audio reçu.");
      const buffer = await response.arrayBuffer();
      fs.writeFileSync("output.wav", Buffer.from(buffer));
      console.log("Fichier sauvegardé sous : output.wav");
    } else {
      console.error(`Erreur : ${response.status} - ${await response.text()}`);
    }
  } catch (err) {
    console.error("Erreur lors de la requête :", err);
  }
})();
