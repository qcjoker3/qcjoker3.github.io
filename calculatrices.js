Réflexion pendant 12sdocument.addEventListener('DOMContentLoaded', () => {
// ==========================================================
// 🧰 Fonctions utilitaires
// ==========================================================
const fmtCurrency = n =>
new Intl.NumberFormat('fr-CA', {
style: 'currency',
currency: 'CAD',
maximumFractionDigits: 2
}).format(n);
const toFloat = v => {
const n = parseFloat(v);
return Number.isFinite(n) ? n : NaN;
};
const parseNum = v =>
parseFloat(String(v ?? '').replace(/\s/g, '').replace(',', '.')) || 0;
const pctToMonthly = p => {
const a = parseNum(p) / 100;
return Math.pow(1 + a, 1 / 12) - 1;
};
const annualToMonthlyRate = a => {
const r = parseNum(a) / 100;
return Math.pow(1 + r, 1 / 12) - 1;
};
// ==========================================================
// 🎯 Références Chart.js
// ==========================================================
let chartRetraite = null;
let chartVF = null;
let chartHypo = null;
let chartTrex = null;
let chartAVL = null;
// ==========================================================
// 📌 Navigation entre calculatrices
// ==========================================================
const calcCards = document.querySelectorAll('.card.card-link[data-calc]');
const calcSections = document.querySelectorAll('.calculator-card');
calcCards.forEach(card => {
card.addEventListener('click', () => {
calcCards.forEach(c => {
c.classList.remove('selected');
c.setAttribute('aria-selected', 'false');
});
card.classList.add('selected');
card.setAttribute('aria-selected', 'true');
const key = card.dataset.calc;
calcSections.forEach(sec => {
sec.classList.remove('active');
sec.setAttribute('aria-hidden', 'true');
});
const target = document.getElementById(calc-${key});
if (target) {
target.classList.add('active');
target.setAttribute('aria-hidden', 'false');
target.scrollIntoView({ behavior: 'smooth', block: 'start' });
try { localStorage.setItem('calc:selected', key); } catch {}
history.replaceState(null, '', #${key});
}
});
card.addEventListener('keydown', e => {
if (e.key === 'Enter' || e.key === ' ') {
e.preventDefault();
card.click();
}
});
});
// Sélection initiale depuis le hash ou localStorage
const hashKey = location.hash.replace('#', '');
const storedKey = localStorage.getItem('calc:selected');
const initialKey = hashKey || storedKey;
if (initialKey) {
const card = Array.from(calcCards).find(c => c.dataset.calc === initialKey);
card?.click();
}
// ==========================================================
// 🧮 Calculatrice — Retraite
// ==========================================================
const formRetraite = document.getElementById('form-retraite');
const resultatRetraite = document.getElementById('resultat-retraite');
const ctxRetraite = document.getElementById('chart-retraite')?.getContext('2d');
formRetraite?.addEventListener('submit', e => {
e.preventDefault();
const ageActuel = parseInt(formRetraite['age-actuel'].value);
const ageRetraite = parseInt(formRetraite['age-retraite'].value);
const epargneMensuelle = toFloat(formRetraite['epargne-mensuelle'].value);
const rendementAnnuel = toFloat(formRetraite['rendement'].value) / 100;
if (!Number.isFinite(ageActuel) || !Number.isFinite(ageRetraite) ||
!Number.isFinite(epargneMensuelle) || !Number.isFinite(rendementAnnuel)) {
resultatRetraite.textContent = 'Veuillez remplir tous les champs correctement.';
return;
}
if (ageRetraite <= ageActuel) {
resultatRetraite.textContent = "L'âge de retraite doit être supérieur à l'âge actuel.";
return;
}
const annees = ageRetraite - ageActuel;
const rMensuel = Math.pow(1 + rendementAnnuel, 1 / 12) - 1;
const FV = Math.abs(rMensuel) < 1e-12
? epargneMensuelle * 12 * annees
: epargneMensuelle * ((Math.pow(1 + rMensuel, annees * 12) - 1) / rMensuel);
resultatRetraite.textContent =
En économisant ${fmtCurrency(epargneMensuelle)} par mois pendant ${annees} ans avec un rendement annuel moyen de ${(rendementAnnuel * 100).toFixed(2)}%, vous aurez environ ${fmtCurrency(FV)}.;
const labels = [], dataEpargne = [], dataInteret = [];
for (let year = 0; year <= annees; year++) {
const mois = year * 12;
const fvAnnee = Math.abs(rMensuel) < 1e-12
? epargneMensuelle * mois
: epargneMensuelle * ((Math.pow(1 + rMensuel, mois) - 1) / rMensuel);
const epargneSansInteret = epargneMensuelle * 12 * year;
labels.push(year.toString());
dataEpargne.push(epargneSansInteret);
dataInteret.push(Math.max(0, fvAnnee - epargneSansInteret));
}
if (chartRetraite) chartRetraite.destroy();
chartRetraite = new Chart(ctxRetraite, {
type: 'bar',
data: {
labels,
datasets: [
{ label: 'Épargne', data: dataEpargne, backgroundColor: '#00c48c' },
{ label: 'Intérêts', data: dataInteret, backgroundColor: '#00a678' }
]
},
options: {
responsive: true,
plugins: {
legend: { position: 'top' },
title: { display: true, text: "Épargne avec intérêts" }
},
scales: { y: { beginAtZero: true } }
}
});
});
});
// ============================================================================
// Valeur future (avec cotisations)
// ============================================================================
// ==========================================================
// 📈 Calculatrice — Valeur future
// ==========================================================
const formVF = document.getElementById('form-vf');
const resultatVF = document.getElementById('resultat-vf');
const ctxVF = document.getElementById('chart-vf')?.getContext('2d');
formVF?.addEventListener('submit', e => {
e.preventDefault();
const montantInitial = toFloat(formVF['montant-initial'].value);
const duree = parseInt(formVF['duree-vf'].value);
const taux = toFloat(formVF['taux-vf'].value) / 100;
const cotisation = toFloat(formVF['cotisation-vf']?.value) || 0;
const freq = formVF['frequence-vf']?.value || 'annuelle';
if (!Number.isFinite(montantInitial) || !Number.isFinite(duree) || !Number.isFinite(taux)) {
resultatVF.textContent = 'Veuillez remplir tous les champs correctement.';
return;
}
const m = freq === 'mensuelle' ? 12 : freq === 'hebdomadaire' ? 52 : 1;
const rP = Math.pow(1 + taux, 1 / m) - 1;
const FV_initial = montantInitial * Math.pow(1 + taux, duree);
const nP = duree * m;
const FV_cot = Math.abs(rP) < 1e-12
? cotisation * nP
: cotisation * ((Math.pow(1 + rP, nP) - 1) / rP);
const FV_total = FV_initial + FV_cot;
const totalCotisations = cotisation * nP;
const labelFreq = freq === 'mensuelle' ? 'mensuelle' :
freq === 'hebdomadaire' ? 'hebdomadaire' : 'annuelle';
resultatVF.textContent =
Après ${duree} ans, votre investissement de ${fmtCurrency(montantInitial)} avec une cotisation ${labelFreq} de ${fmtCurrency(cotisation)} vaudra environ ${fmtCurrency(FV_total)}. (${fmtCurrency(totalCotisations)} de cotisations);
const labels = [], dataCapital = [];
for (let year = 0; year <= duree; year++) {
const periodsY = year * m;
const FV_init_y = montantInitial * Math.pow(1 + taux, year);
const FV_cot_y = Math.abs(rP) < 1e-12
? cotisation * periodsY
: cotisation * ((Math.pow(1 + rP, periodsY) - 1) / rP);
labels.push(year.toString());
dataCapital.push(FV_init_y + FV_cot_y);
}
if (chartVF) chartVF.destroy();
chartVF = new Chart(ctxVF, {
type: 'line',
data: {
labels,
datasets: [{
label: 'Valeur future (avec cotisations)',
data: dataCapital,
borderColor: '#00c48c',
backgroundColor: 'rgba(0,196,140,0.2)',
fill: true,
tension: 0.3
}]
},
options: {
responsive: true,
plugins: {
legend: { position: 'top' },
title: { display: true, text: 'Évolution de la valeur future' }
},
scales: { y: { beginAtZero: true } }
}
});
});
// ==========================================================
// 🏠 Calculatrice — Hypothèque
// ==========================================================
const formHypo = document.getElementById('form-hypo');
const resultatHypo = document.getElementById('resultat-hypo');
const ctxHypo = document.getElementById('chart-hypo')?.getContext('2d');
formHypo?.addEventListener('submit', e => {
e.preventDefault();
const montantPret = toFloat(formHypo['montant-pret'].value);
const tauxHypo = toFloat(formHypo['taux-hypo'].value) / 100;
const dureeHypo = parseInt(formHypo['duree-hypo'].value);
if (!Number.isFinite(montantPret) || !Number.isFinite(tauxHypo) || !Number.isFinite(dureeHypo)) {
resultatHypo.textContent = 'Veuillez remplir tous les champs correctement.';
return;
}
const rMensuel = tauxHypo / 12;
const n = dureeHypo * 12;
const mensualite = Math.abs(rMensuel) < 1e-12
? montantPret / n
: montantPret * (rMensuel * Math.pow(1 + rMensuel, n)) / (Math.pow(1 + rMensuel, n) - 1);
resultatHypo.textContent = Mensualité estimée: ${fmtCurrency(mensualite)} sur ${dureeHypo} ans.;
let capitalRestant = montantPret;
const labels = [], dataInteretsCumul = [], dataCapitalPayes = [];
let interetsCumules = 0;
for (let mois = 0; mois <= n; mois++) {
labels.push((mois / 12).toFixed(1));
const interetMois = capitalRestant * rMensuel;
const capitalMois = Math.min(mensualite - interetMois, capitalRestant);
interetsCumules += Math.max(0, interetMois);
capitalRestant = Math.max(0, capitalRestant - capitalMois);
dataInteretsCumul.push(interetsCumules);
dataCapitalPayes.push(montantPret - capitalRestant);
}
if (chartHypo) chartHypo.destroy();
chartHypo = new Chart(ctxHypo, {
type: 'line',
data: {
labels,
datasets: [
{
label: 'Capital remboursé',
data: dataCapitalPayes,
borderColor: '#00c48c',
backgroundColor: 'rgba(0,196,140,0.4)',
fill: true,
tension: 0.3
},
{
label: 'Intérêts cumulés',
data: dataInteretsCumul,
borderColor: '#00a678',
backgroundColor: 'rgba(0,166,120,0.4)',
fill: true,
tension: 0.3
}
]
},
options: {
responsive: true,
plugins: {
legend: { position: 'top' },
title: { display: true, text: 'Évolution du prêt hypothécaire' }
},
scales: { y: { beginAtZero: true } }
}
});
});
// ============================================================================
// T‑Rex Score
// ============================================================================
// ==========================================================
// 🦖 Calculatrice — T‑Rex Score
// ==========================================================
const formTrex = document.getElementById('form-trex');
const resultatTrex = document.getElementById('resultat-trex');
const ctxTrex = document.getElementById('chart-trex')?.getContext('2d');
formTrex?.addEventListener('submit', e => {
e.preventDefault();
const montantInitial = toFloat(formTrex['montant-initial'].value);
const cotisationAnnuelle = toFloat(formTrex['cotisation-annuelle'].value) || 0;
const duree = parseInt(formTrex['duree-trex'].value);
const rendementBrut = toFloat(formTrex['rendement-brut'].value) / 100;
const fraisAnnuel = toFloat(formTrex['frais-annuels'].value) / 100;
if (!Number.isFinite(montantInitial) || !Number.isFinite(duree) ||
!Number.isFinite(rendementBrut) || !Number.isFinite(fraisAnnuel)) {
resultatTrex.textContent = 'Veuillez remplir tous les champs correctement.';
return;
}
const rendementNet = rendementBrut - fraisAnnuel;
const fv = (P, r, n, C) => {
if (Math.abs(r) < 1e-12) return P + C * n;
return P * Math.pow(1 + r, n) + C * ((Math.pow(1 + r, n) - 1) / r);
};
const capitalAvecFrais = fv(montantInitial, rendementNet, duree, cotisationAnnuelle);
const capitalSansFrais = fv(montantInitial, rendementBrut, duree, cotisationAnnuelle);
const scoreTrex = capitalAvecFrais / (capitalSansFrais || 1);
const perteDueAuxFrais = capitalSansFrais - capitalAvecFrais;
resultatTrex.textContent =
Votre score est de ${(scoreTrex * 100).toFixed(1)}%.\nValeur finale avec frais : ${fmtCurrency(capitalAvecFrais)}\nValeur sans frais : ${fmtCurrency(capitalSansFrais)} → Frais payés : ${fmtCurrency(perteDueAuxFrais)}.;
if (chartTrex) chartTrex.destroy();
chartTrex = new Chart(ctxTrex, {
type: 'bar',
data: {
labels: ['Avec frais', 'Sans frais'],
datasets: [{
label: 'Valeur finale',
data: [capitalAvecFrais, capitalSansFrais],
backgroundColor: ['#00a678', '#00c48c']
}]
},
options: {
responsive: true,
plugins: {
legend: { display: false },
title: { display: true, text: "Impact des frais sur la valeur finale" }
},
scales: { y: { beginAtZero: true } }
}
});
});
// ============================================================================
// Louer vs Acheter
// ============================================================================
const formAvsL = document.getElementById('form-achat-vs-location');
const resultatAvsL = document.getElementById('resultat-achat-vs-location');
// Optionnel: <canvas id="chart-achat-vs-location"></canvas> si tu veux un graphe
let chartAvsL;
formAvsL?.addEventListener('submit', e => {
e.preventDefault();
// --- Lecture des champs (avec valeurs par défaut robustes)
const mise = toFloat(formAvsL['mise-de-fond']?.value);
const empruntBase = toFloat(formAvsL['montant-emprunt']?.value);
const dureeAns = parseInt(formAvsL['duree-avsl']?.value);
const tauxPretAnn = toFloat(formAvsL['taux-emprunt']?.value) / 100;
const loyer0 = toFloat(formAvsL['loyer-mensuel']?.value);
const croissanceLoyerAnn = (toFloat(formAvsL['croissance-loyer']?.value) / 100) || 0.02;
const rendementAnn = toFloat(formAvsL['rendement-placement']?.value) / 100;
const coutAnnuelProprio0 = toFloat(formAvsL['cout-annuel-proprio']?.value) || 0;
const inflationCoutsAnn = (toFloat(formAvsL['inflation-couts']?.value) / 100) || 0.02;
const entretienPctAnn = (toFloat(formAvsL['entretien-pourcent']?.value) / 100) || 0.01;
const appreciationAnn =
(toFloat(formAvsL['taux-appreciation']?.value) / 100) ||
(toFloat(formAvsL['taux-revente']?.value) / 100) || 0.02;
const fraisAchatPct = (toFloat(formAvsL['frais-achat-pourcent']?.value) / 100) || 0.015;
const fraisVentePct = (toFloat(formAvsL['frais-vente-pourcent']?.value) / 100) || 0.06;
const assurancePretPct = (toFloat(formAvsL['assurance-pret-pourcent']?.value) / 100) || 0;
// --- Validations minimales
if (![mise, empruntBase, dureeAns, tauxPretAnn, loyer0, rendementAnn].every(Number.isFinite)) {
resultatAvsL.textContent = 'Veuillez remplir tous les champs obligatoires correctement.';
return;
}
if (mise < 0 || empruntBase <= 0 || dureeAns <= 0) {
resultatAvsL.textContent = 'Vérifiez la mise de fonds (>0), le montant emprunté (>0) et la durée (>0).';
return;
}
// --- Paramètres dérivés
const prix = mise + empruntBase;
let solde = empruntBase * (1 + assurancePretPct); // prime d’assurance ajoutée au solde si précisée
const n = dureeAns * 12;
const r_m = tauxPretAnn / 12;
const r_inv_m = rendementAnn / 12;
const g_rent_m = Math.pow(1 + croissanceLoyerAnn, 1 / 12) - 1;
const g_cost_m = Math.pow(1 + inflationCoutsAnn, 1 / 12) - 1;
const g_home_m = Math.pow(1 + appreciationAnn, 1 / 12) - 1;
// Paiement mensuel (gestion r=0)
const mensualite = (Math.abs(r_m) < 1e-12)
? (solde / n)
: solde * (r_m) / (1 - Math.pow(1 + r_m, -n));
// --- Portefeuilles & états initiaux
let valeurMaison = prix;
let loyer = loyer0;
let coutAnnuelBase = coutAnnuelProprio0; // évolue mensuellement avec g_cost_m
// Le locataire investit la mise de fonds + frais d’achat évités
const fraisAchat = prix * fraisAchatPct;
let portefeuilleLocataire = mise + fraisAchat;
// L’acheteur peut aussi investir un éventuel surplus mensuel
let portefeuilleAcheteur = 0;
let interetsTotaux = 0;
let principalTotal = 0;
// (Optionnel) séries pour graphe
const serieAcheteur = [];
const serieLocataire = [];
const labels = [];
for (let m = 1; m <= n; m++) {
// Intérêt/principal ce mois
const interet = solde * r_m;
let principal = mensualite - interet;
// Ajustement dernière échéance si besoin
if (principal > solde || m === n) {
principal = solde;
}
solde -= principal;
interetsTotaux += interet;
principalTotal += principal;
// Valeur du bien et coûts propriétaires
valeurMaison *= (1 + g_home_m);
const maintenanceMensuelle = (entretienPctAnn > 0) ? (valeurMaison * entretienPctAnn) / 12 : 0;
const coutsMensuelsBase = (coutAnnuelBase / 12);
const coutsProprioMensuels = coutsMensuelsBase + maintenanceMensuelle;
// Indexer le socle de coûts pour le mois suivant
coutAnnuelBase *= (1 + g_cost_m);
// Loyer indexé
loyer *= (1 + g_rent_m);
// Dépenses mensuelles de chaque camp
const depenseAcheteur = mensualite + coutsProprioMensuels;
const depenseLocataire = loyer;
// Différence investissable (scénario symétrique)
const diff = depenseAcheteur - depenseLocataire;
if (diff > 0) {
// Louer est moins cher ce mois-ci -> le locataire investit le surplus
portefeuilleLocataire += diff;
} else if (diff < 0) {
// Acheter est moins cher -> l’acheteur investit le surplus
portefeuilleAcheteur += (-diff);
}
// Croissance mensuelle des portefeuilles
portefeuilleLocataire *= (1 + r_inv_m);
portefeuilleAcheteur *= (1 + r_inv_m);
// (Optionnel) échantillonnage annuel pour graphe
if (m % 12 === 0) {
const an = m / 12;
const fraisVenteTh = valeurMaison * fraisVentePct; // hypothétique si on vendait maintenant
const equiteTheorique = Math.max(0, valeurMaison - fraisVenteTh - solde);
const patrimoineAcheteurTh = equiteTheorique + portefeuilleAcheteur;
const patrimoineLocataireTh = portefeuilleLocataire;
labels.push(Année ${an});
serieAcheteur.push(patrimoineAcheteurTh);
serieLocataire.push(patrimoineLocataireTh);
}
}
// --- Revente à l’horizon
const fraisVente = valeurMaison * fraisVentePct;
const equiteNette = Math.max(0, valeurMaison - fraisVente - solde);
const patrimoineAcheteur = equiteNette + portefeuilleAcheteur;
const patrimoineLocataire = portefeuilleLocataire;
const diffFinale = patrimoineAcheteur - patrimoineLocataire;
// --- Restitution
const lignes = [
🏡 Patrimoine (acheter) : ${fmtCurrency(patrimoineAcheteur)},
🏠 Patrimoine (louer) : ${fmtCurrency(patrimoineLocataire)},
📊 Différence : ${fmtCurrency(diffFinale)} ${diffFinale > 0 ? '(acheter > louer)' : diffFinale < 0 ? '(louer > acheter)' : ''},
💵 Mensualité prêt : ${fmtCurrency(mensualite)},
💸 Intérêts totaux payés : ${fmtCurrency(interetsTotaux)},
📈 Principal remboursé : ${fmtCurrency(principalTotal)},
🏷️ Frais d’achat initiaux (évités en location) : ${fmtCurrency(fraisAchat)},
🏠 Frais de vente à l’horizon : ${fmtCurrency(fraisVente)}
];
resultatAvsL.textContent = lignes.join('\n');
// --- (Optionnel) Graphe comparatif
const ctx = document.getElementById('chart-achat-vs-location')?.getContext('2d');
if (ctx) {
if (chartAvsL) chartAvsL.destroy();
chartAvsL = new Chart(ctx, {
type: 'line',
data: {
labels,
datasets: [
{ label: 'Acheter (patrimoine net)', data: serieAcheteur, borderColor: '#0ea5e9', fill: false },
{ label: 'Louer (patrimoine net)', data: serieLocataire, borderColor: '#22c55e', fill: false }
]
},
options: {
responsive: true,
interaction: { mode: 'index', intersect: false },
plugins: { legend: { display: true }, title: { display: true, text: 'Acheter vs Louer — Patrimoine net' } },
scales: { y: { beginAtZero: false } }
}
});
}
});
});
