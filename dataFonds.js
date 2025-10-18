document.addEventListener("DOMContentLoaded", async () => {

    // --- UTILITIES ---
    const formatCurrency = (value) => value.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
    const chartOptions = (yAxisTitle) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
            y: { ticks: { callback: value => `${value.toFixed(0)}${yAxisTitle.includes('%') ? '%' : '$'}` }, title: { display: true, text: yAxisTitle } },
            x: { grid: { display: false } }
        }
    });

    // --- DATA LOADING ---
    async function loadData() {
        try {
            const resp = await fetch('fonds.json');
            if (!resp.ok) throw new Error(`Erreur de chargement: ${resp.statusText}`);
            return await resp.json();
        } catch (error) {
            console.error("Impossible de charger les données des fonds:", error);
            return null;
        }
    }

    // --- CALCULATIONS ---
    function calculateGrowthAndFees(initial, monthlyReturns, annualFee) {
        let value = initial;
        let totalFeesPaid = 0;
        const growth = [{ x: 'Départ', y: initial }];
        const monthlyFeeRate = (annualFee ?? 0) / 100 / 12;

        const sortedMonths = Object.keys(monthlyReturns).sort();
        
        for (const month of sortedMonths) {
            if (monthlyReturns[month] === null) continue;
            
            const feeAmount = value * monthlyFeeRate;
            totalFeesPaid += feeAmount;
            value -= feeAmount;
            value *= (1 + monthlyReturns[month] / 100);
            growth.push({ x: month, y: value });
        }
        return { endValue: value, growth, totalFeesPaid };
    }

    function calculateAnnualizedReturn(growthData) {
        if (growthData.length <= 1) return 0;
        const endValue = growthData[growthData.length - 1].y;
        const startValue = growthData[0].y;
        const totalMonths = growthData.length - 1;
        if (startValue === 0 || totalMonths === 0) return 0;
        const totalYears = totalMonths / 12;
        return (Math.pow(endValue / startValue, 1 / totalYears) - 1) * 100;
    }

    function calculateAnnualReturns(monthlyReturns) {
        const annuals = {};
        for (const month in monthlyReturns) {
            if (monthlyReturns[month] === null) continue;
            const year = month.split('-')[0];
            if (!annuals[year]) annuals[year] = 1;
            annuals[year] *= (1 + monthlyReturns[month] / 100);
        }
        for (const year in annuals) {
            annuals[year] = (annuals[year] - 1) * 100;
        }
        return annuals;
    }

    // --- DOM & CHARTING ---
    let croissanceChartInstance, rendementAnnuelChartInstance;

    function displayComparison(data, fondKey) {
        const fondActif = data.fonds_actifs[fondKey];
        if (!fondActif) { console.error(`Fonds actif non trouvé: ${fondKey}`); return; }
        
        const keyFondPassif = fondActif.composition_passif?.[0];
        const fondPassif = data.fonds_passifs[keyFondPassif];
        if (!fondPassif) { console.error(`Fonds passif non trouvé: ${keyFondPassif}`); return; }

        const activeMonths = Object.keys(fondActif.rendements_mensuels);
        const passiveMonths = Object.keys(fondPassif.rendements_mensuels);
        const commonMonths = activeMonths.filter(month => passiveMonths.includes(month));
        
        const rendementsActif = {};
        const rendementsPassif = {};
        commonMonths.forEach(month => {
            rendementsActif[month] = fondActif.rendements_mensuels[month];
            rendementsPassif[month] = fondPassif.rendements_mensuels[month];
        });

        const initialInvestment = 10000;
        const activeFee = fondActif.frais ?? 2.1; 
        const passiveFee = fondPassif.frais ?? 0.2;

        const activeData = calculateGrowthAndFees(initialInvestment, rendementsActif, activeFee);
        const passiveData = calculateGrowthAndFees(initialInvestment, rendementsPassif, passiveFee);

        document.getElementById('active-fees').textContent = `${activeFee.toFixed(2)}%`;
        document.getElementById('passive-fees').textContent = `${passiveFee.toFixed(2)}%`;
        document.getElementById('active-return').textContent = `${calculateAnnualizedReturn(activeData.growth).toFixed(2)}%`;
        document.getElementById('passive-return').textContent = `${calculateAnnualizedReturn(passiveData.growth).toFixed(2)}%`;
        document.getElementById('active-capital').textContent = formatCurrency(activeData.endValue);
        document.getElementById('passive-capital').textContent = formatCurrency(passiveData.endValue);
        document.getElementById('active-fees-paid').textContent = formatCurrency(activeData.totalFeesPaid);
        document.getElementById('passive-fees-paid').textContent = formatCurrency(passiveData.totalFeesPaid);

        const years = (commonMonths.length) / 12;
        document.getElementById('croissanceChartTitle').textContent = `Croissance de 10 000 $ sur ${years.toFixed(1)} ans`;
        updateCroissanceChart(activeData.growth, passiveData.growth, fondActif.nom, keyFondPassif);
        
        const rendActifAnnuel = calculateAnnualReturns(rendementsActif);
        const rendPassifAnnuel = calculateAnnualReturns(rendementsPassif);
        const annees = Object.keys(rendActifAnnuel).sort();
        updateRendementAnnuelChart(annees.map(y => rendActifAnnuel[y]), annees.map(y => rendPassifAnnuel[y]), annees, fondActif.nom, keyFondPassif);

        document.getElementById('results-dashboard').style.display = 'block';
        document.getElementById('charts-container').style.display = 'block';
    }

    function updateCroissanceChart(activeData, passiveData, activeName, passiveName) {
        const ctx = document.getElementById('croissanceChart').getContext('2d');
        if (croissanceChartInstance) croissanceChartInstance.destroy();
        croissanceChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    { label: activeName, data: activeData, borderColor: 'rgba(79, 70, 229, 1)', backgroundColor: 'rgba(79, 70, 229, 0.1)', fill: 'origin', tension: 0.2, pointRadius: 0 },
                    { label: passiveName, data: passiveData, borderColor: 'rgba(13, 148, 136, 1)', backgroundColor: 'rgba(13, 148, 136, 0.1)', fill: 'origin', tension: 0.2, pointRadius: 0 }
                ]
            },
            options: chartOptions('Valeur du portefeuille')
        });
    }

    function updateRendementAnnuelChart(activeReturns, passiveReturns, labels, activeName, passiveName) {
        const ctx = document.getElementById('rendementAnnuelChart').getContext('2d');
        if (rendementAnnuelChartInstance) rendementAnnuelChartInstance.destroy();
        rendementAnnuelChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: activeName, data: activeReturns, backgroundColor: 'rgba(79, 70, 229, 0.8)' },
                    { label: passiveName, data: passiveReturns, backgroundColor: 'rgba(13, 148, 136, 0.8)' }
                ]
            },
            options: chartOptions('Rendement (%)')
        });
    }

    // --- INITIALIZATION ---
    const data = await loadData();
    if (!data) {
        console.error("Les données des fonds n'ont pas pu être initialisées.");
        return;
    }

    const institutionsContainer = document.getElementById('institutions');
    const fondsContainer = document.getElementById('fondsContainer');

    Object.keys(data.institutions).forEach(inst => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.textContent = inst;
        btn.dataset.institution = inst;
        institutionsContainer.appendChild(btn);
    });

    institutionsContainer.addEventListener('click', (e) => {
        if (!e.target.classList.contains('category-btn')) return;
        const selectedInst = e.target.dataset.institution;
        
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        fondsContainer.innerHTML = '';
        data.institutions[selectedInst].forEach(fondKey => {
            const pill = document.createElement('button');
            pill.className = 'fond-pill';
            pill.textContent = data.fonds_actifs[fondKey]?.nom || fondKey;
            pill.dataset.fondKey = fondKey;
            fondsContainer.appendChild(pill);
        });
        
        document.getElementById('results-dashboard').style.display = 'none';
        document.getElementById('charts-container').style.display = 'none';

        if (fondsContainer.firstChild) {
            fondsContainer.firstChild.click();
        }
    });

    fondsContainer.addEventListener('click', (e) => {
        if (!e.target.classList.contains('fond-pill')) return;
        const selectedFondKey = e.target.dataset.fondKey;
        document.querySelectorAll('.fond-pill').forEach(pill => pill.classList.remove('active'));
        e.target.classList.add('active');
        displayComparison(data, selectedFondKey);
    });
    
    if (institutionsContainer.firstChild) {
        institutionsContainer.firstChild.click();
    }
});
