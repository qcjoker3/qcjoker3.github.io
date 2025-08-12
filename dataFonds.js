async function chargerFonds() {
    const reponse = await fetch('fonds.json');
    const fonds = await reponse.json();

    for (let f of fonds) {
        const prix = await getPerformance(f.symbole);
        console.log(`${f.nom} (${f.type}) : ${prix}`);
    }
}

async function getPerformance(ticker) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1mo&range=1y`;
    const reponse = await fetch(url);
    const data = await reponse.json();
    
    if (data.chart.result) {
        const prix = data.chart.result[0].meta.regularMarketPrice;
        return prix;
    } else {
        return "Données indisponibles";
    }
}

chargerFonds();
