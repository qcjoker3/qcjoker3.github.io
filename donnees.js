// MODIFIEZ CE CHIFFRE QUAND VOUS LE DÉSIREZ (ex: une fois par mois)
const niveauActuelSP500 = 6528;

// La base de données centrale de Finoza pour les prédictions
const chartDataByYear = {
    "2020": { real: 3756, institutions: ["Goldman Sachs", "JP Morgan", "Bank of America", "Morgan Stanley", "UBS", "Wells Fargo", "Barclays", "RBC", "Deutsche Bank", "Credit Suisse", "BMO", "Oppenheimer"], previsions: [3400, 3400, 3300, 3000, 3000, 3300, 3300, 3350, 3250, 3425, 3400, 3500] },
    "2021": { real: 4766, institutions: ["Goldman Sachs", "JP Morgan", "Bank of America", "Morgan Stanley", "UBS", "Wells Fargo", "Barclays", "RBC", "Deutsche Bank", "Credit Suisse", "BMO", "Oppenheimer"], previsions: [4300, 4400, 3800, 3900, 4100, 4000, 4000, 4100, 3950, 4050, 4200, 4300] },
    "2022": { real: 3840, institutions: ["Goldman Sachs", "JP Morgan", "Bank of America", "Morgan Stanley", "UBS", "Wells Fargo", "Barclays", "RBC", "Deutsche Bank", "Credit Suisse", "BMO", "Oppenheimer"], previsions: [5100, 5050, 4600, 4400, 4850, 5300, 4800, 5050, 5250, 5200, 5300, 5330] },
    "2023": { real: 4770, institutions: ["Goldman Sachs", "JP Morgan", "Bank of America", "Morgan Stanley", "UBS", "Wells Fargo", "Barclays", "RBC", "Deutsche Bank", "Credit Suisse", "BMO", "Oppenheimer"], previsions: [4000, 4200, 4000, 3900, 3900, 4400, 4150, 4300, 4500, 4050, 4300, 4400] },
    "2024": { real: 5882, institutions: ["Goldman Sachs", "JP Morgan", "Bank of America", "Morgan Stanley", "UBS", "Wells Fargo", "Barclays", "RBC", "Deutsche Bank", "BCA Research", "BMO", "Oppenheimer"], previsions: [5100, 4200, 5000, 4500, 4700, 4700, 5300, 5000, 5100, 3300, 5100, 5200] },
};
