const fs = require("fs");
const path = require('path');

const csvPath = path.join(__dirname, "../../assets/data/csv/aotr/");
const csvOutPath = path.join(__dirname, "../../assets/data/csv/aotr 9.2.csv");

try {
    // Lecture du dossier
    const files = fs.readdirSync(csvPath);
    
    let combinedData = "";
    let isFirstFile = true;

    files.forEach((file) => {
        // On ne traite que les fichiers .csv
        if (path.extname(file).toLowerCase() === '.csv') {
            const filePath = path.join(csvPath, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            
            if (isFirstFile) {
                // Pour le premier fichier, on garde tout (y compris l'en-tête)
                combinedData += fileContent;
                isFirstFile = false;
            } else {
                // Pour les suivants, on retire la première ligne (l'en-tête)
                const lines = fileContent.split('\n');
                
                // On vérifie qu'il y a du contenu
                if (lines.length > 1) {
                    lines.shift(); // Supprime l'en-tête
                    
                    // Ajoute un saut de ligne si nécessaire avant d'ajouter le contenu
                    if (combinedData && !combinedData.endsWith('\n')) {
                        combinedData += '\n';
                    }
                    
                    combinedData += lines.join('\n');
                }
            }
            console.log(`Ajouté : ${file}`);
        }
    });

    // Écriture du fichier final
    fs.writeFileSync(csvOutPath, combinedData, 'utf8');
    console.log(`\nSuccès ! Fichier combiné créé ici : ${csvOutPath}`);

} catch (err) {
    console.error('Erreur lors du traitement :', err);
}