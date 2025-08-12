async function loadFunds() {
    const response = await fetch('fonds.json');
    const fondsList = await response.json();

    const tbody = document.querySelector('#fonds-table tbody');
    tbody.innerHTML = '';

    for (const fund of fondsList) {
        const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${fund.symbol}?range=5y&interval=1d`;

        try {
            const res = await fetch(apiUrl);
            const data = await res.json();

            if (!data.chart.result) {
                tbody.innerHTML += `<tr><td colspan="4">${fund.name} : Données non disponibles</td></tr>`;
                continue;
            }

            const prices = data.chart.result[0].indicators.adjclose[0].adjclose;
            const meta = data.chart.result[0].meta;
            const currentPrice = prices[prices.length - 1];
            const price1YearAgo = prices[prices.length - 252];
            const price5YearsAgo = prices[0];

            const perf1Y = (((currentPrice - price1YearAgo) / price1YearAgo) * 100).toFixed(2);
            const perf5Y = (((currentPrice - price5YearsAgo) / price5YearsAgo) * 100).toFixed(2);

            tbody.innerHTML += `
                <tr>
                    <td>${fund.name}</td>
                    <td>${currentPrice.toFixed(2)} $</td>
                    <td style="color:${perf1Y >= 0 ? 'green' : 'red'}">${perf1Y} %</td>
                    <td style="color:${perf5Y >= 0 ? 'green' : 'red'}">${perf5Y} %</td>
                </tr>
            `;
        } catch (error) {
            tbody.innerHTML += `<tr><td colspan="4">${fund.name} : Erreur de récupération</td></tr>`;
        }
    }
}

loadFunds();
