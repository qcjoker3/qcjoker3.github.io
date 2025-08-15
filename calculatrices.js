function calculateRetirement() {
    const currentAge = parseFloat(document.getElementById('currentAge').value);
    const retirementAge = parseFloat(document.getElementById('retirementAge').value);
    const monthlySavings = parseFloat(document.getElementById('monthlySavings').value);
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value);

    if (isNaN(currentAge) || isNaN(retirementAge) || isNaN(monthlySavings) || isNaN(expectedReturn)) {
        document.getElementById('result').innerText = 'Veuillez remplir tous les champs correctement.';
        return;
    }

    if (retirementAge <= currentAge) {
        document.getElementById('result').innerText = 'L\'âge de retraite doit être supérieur à l\'âge actuel.';
        return;
    }

    const yearsToRetirement = retirementAge - currentAge;
    const monthsToRetirement = yearsToRetirement * 12;
    const monthlyRate = (expectedReturn / 100) / 12;

    if (monthlyRate === 0) {
        const futureValue = monthlySavings * monthsToRetirement;
        document.getElementById('result').innerText = `Montant estimé à la retraite : ${futureValue.toFixed(2)} €`;
        return;
    }

    const futureValue = monthlySavings * ((Math.pow(1 + monthlyRate, monthsToRetirement) - 1) / monthlyRate);
    document.getElementById('result').innerText = `Montant estimé à la retraite : ${futureValue.toFixed(2)} €`;
}
