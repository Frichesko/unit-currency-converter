// Об'єкт курсів
const rates = {
    USD:1,
    EUR:0.92,
    UAH:41.5
}

const lengthRates = {
    MM:0.001,
    SM:0.01,
    MT:1,
    KM:1000
}

const massRates = {
    GR:0.001,
    KG:1,
    TN:1000
}

//Функція для виводу курсів
function printRates(ratesObj) {
  for (const currency of Object.keys(ratesObj)) {
    console.log(`1 USD = ${ratesObj[currency]} ${currency}`);
  }
}

printRates(rates);

//Функція для конвертації валюти
const convert = (amount, rate) => amount * rate;

//Функція для конвертації довжини та маси
const convertUnit = (amountUnit, input, output) => amountUnit * (input / output);

const amount=100;

const lenght=10;

const weight=5;

const resultConvertation=convert(amount, rates.UAH);
console.log(`${amount} USD = ${resultConvertation} UAH`);

console.log(convertUnit(5, lengthRates.KM, lengthRates.MT));
console.log(convertUnit(2500, massRates.GR, massRates.KG));

const bigsum=1000;
if (resultConvertation >=bigsum ){
    console.log("Вийшла велика сума");
}
else if (resultConvertation >=500){
    console.log("Вийшла середня сума");
}
else {
    console.log("Вийшла мала сума");
}