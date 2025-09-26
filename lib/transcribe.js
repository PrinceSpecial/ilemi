const fs = require("fs");
const fetch = require("node-fetch"); // npm install node-fetch@2
const FormData = require("form-data"); // npm install form-data

const url = "https://e42feb93c11e.ngrok-free.app/transcribe";
const filePath = "./audio.wav";

(async () => {
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    const response = await fetch(url, { method: "POST", body: form });
    const data = await response.json();
    console.log("Réponse du serveur :", data);
  } catch (err) {
    console.error("Erreur lors de la requête :", err);
  }
})();
