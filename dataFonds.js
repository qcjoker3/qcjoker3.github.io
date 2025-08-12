async function loadFunds() {
  const response = await fetch('funds.json');
  const funds = await response.json();
  
  loadData(funds.active, 'active-list');
  loadData(funds.passive, 'passive-list');
}

async function loadData(fundList, elementId) {
  const container = document.getElementById(elementId);
  
  for (const fund of fundList) {
    try {
      const apiUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${fund.symbol}`;
      const res = await fetch(apiUrl);
      const data = await res.json();
      const price = data.quoteResponse.result[0]?.regularMarketPrice || "N/A";
      
      const li = document.createElement('li');
      li.innerHTML = `<span>${fund.name}</span><span>${price}</span>`;
      container.appendChild(li);
    } catch (error) {
      console.error(`Erreur pour ${fund.symbol}:`, error);
    }
  }
}

loadFunds();
