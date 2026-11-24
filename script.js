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

const unitOptions = {
    currency: [
        { value: 'USD', label: 'USD (Долар США)' },
        { value: 'EUR', label: 'EUR (Євро)' },
        { value: 'UAH', label: 'UAH (Гривня)' }
    ],
    length: [
        { value: 'MM', label: 'Міліметри (мм)' },
        { value: 'SM', label: 'Сантиметри (см)' },
        { value: 'MT', label: 'Метри (м)' },
        { value: 'KM', label: 'Кілометри (км)' }
    ],
    weight: [
        { value: 'GR', label: 'Грами (г)' },
        { value: 'KG', label: 'Кілограми (кг)' },
        { value: 'TN', label: 'Тони (т)' }
    ]
};

const ratesContainer = document.querySelector('#rates-list');
const ratesCountSummary = document.querySelector('#rates-count');

const form = document.querySelector('#converter-form');
const amountInput = document.querySelector('#set_convertation');
const fromSelect = document.querySelector('#set_type');
const toSelect = document.querySelector('#get_type');
const outputResult = document.querySelector('#get_convertation');
const categorySelect = document.querySelector('#conversion_category');
const historyContainer = document.querySelector('#history-list');
const historyCountSummary = document.querySelector('#history-count');
const conversionHistory = [];
// Функція для відображення списку курсів валют у DOM та оновлення підсумку
function renderRates(ratesObj) {
    if (!ratesContainer || !ratesCountSummary) return;
    // Очищення списку перед додаванням нових елементів
    ratesContainer.innerHTML = '';
    // Перебір об'єкта із курсами валют
    for (const [currency, rate] of Object.entries(ratesObj)) {
        const li = document.createElement('li');
        li.textContent = `${currency}: ${rate}`;
        li.dataset.rate = rate;

        // Додавання класу для курсів, більших за 1
        if (rate > 1) {
            li.classList.add('big-rate');
        }

        ratesContainer.append(li);
    }

    ratesCountSummary.textContent = `Кількість валют: ${Object.keys(ratesObj).length}`;
}

//Функція для виводу курсів
function printRates(ratesObj) {
  for (const currency of Object.keys(ratesObj)) {
    console.log(`1 USD = ${ratesObj[currency]} ${currency}`);
  }
}

renderRates(rates);
printRates(rates);

const convertUnit = (amountUnit, input, output) => amountUnit * (input / output);

function calculateConversion(amount, fromUnit, toUnit, category) {
    if (!amount || isNaN(amount) || amount <= 0) return 0;

    if (category === 'currency') {
        const rateFrom = rates[fromUnit] || 1;
        const rateTo = rates[toUnit] || 1;
        return (amount / rateFrom) * rateTo;
    } else if (category === 'length') {
        return convertUnit(amount, lengthRates[fromUnit], lengthRates[toUnit]);
    } else if (category === 'weight') {
        return convertUnit(amount, massRates[fromUnit], massRates[toUnit]);
    }
    return 0;
}

function updateUnitSelects(category) {
    const options = unitOptions[category] || unitOptions.currency;
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';

    options.forEach((opt, index) => {
        const optFrom = document.createElement('option');
        optFrom.value = opt.value;
        optFrom.textContent = opt.label;
        fromSelect.appendChild(optFrom);

        const optTo = document.createElement('option');
        optTo.value = opt.value;
        optTo.textContent = opt.label;
        if (index === 1 || (options.length === 1 && index === 0)) {
            optTo.selected = true;
        }
        toSelect.appendChild(optTo);
    });
}

function updateLiveResult() {
    const amountVal = parseFloat(amountInput.value);
    const category = categorySelect.value;
    const fromUnit = fromSelect.value;
    const toUnit = toSelect.value;

    if (!isNaN(amountVal) && amountVal > 0) {
        const res = calculateConversion(amountVal, fromUnit, toUnit, category);
        const formatted = Number.isInteger(res) ? res : parseFloat(res.toFixed(4));
        outputResult.textContent = `${formatted} ${toUnit}`;
        return formatted;
    } else {
        outputResult.textContent = '0';
        return 0;
    }
}

function renderHistory(historyArray) {
    if (!historyContainer || !historyCountSummary) return;
    historyContainer.innerHTML = '';

    historyArray.forEach((item, index) => {
        const li = document.createElement('li');
        li.classList.add('history-item');
        li.dataset.id = item.id;

        if (item.result >= 1000) {
            li.classList.add('big-rate');
        }

        const mainText = document.createElement('span');
        mainText.classList.add('history-text');
        mainText.textContent = `${index + 1}. ${item.amount} ${item.fromUnit} = ${item.result} ${item.toUnit}`;

        const metaText = document.createElement('span');
        metaText.classList.add('history-meta');
        metaText.textContent = item.time;

        li.append(mainText, metaText);
        historyContainer.append(li);
    });

    historyCountSummary.textContent = `Кількість конвертацій в історії: ${historyArray.length}`;
}

// Крок 8: Додаткова клієнтська валідація на подію input
// Валідація: при amount <= 0 setCustomValidity('Сума має бути додатною')
amountInput.addEventListener('input', () => {
    const val = parseFloat(amountInput.value);
    if (amountInput.value !== '' && (isNaN(val) || val <= 0)) {
        amountInput.setCustomValidity('Сума має бути додатною');
    } else {
        amountInput.setCustomValidity('');
    }
    updateLiveResult();
});

// Крок 9: Друга подія варіанта — change на select одиниці (from/to)
// Миттєво перераховує й оновлює результат без сабміту форми
fromSelect.addEventListener('change', () => {
    updateLiveResult();
});

toSelect.addEventListener('change', () => {
    updateLiveResult();
});

categorySelect.addEventListener('change', () => {
    updateUnitSelects(categorySelect.value);
    updateLiveResult();
});

//Обробник надсилання форми (submit)
form.addEventListener('submit', (event) => {
    event.preventDefault();

    // Перевірка валідності перед сабмітом
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const amount = Number(amountInput.value);
    const fromUnit = fromSelect.value;
    const toUnit = toSelect.value;
    const category = categorySelect.value;

    const result = calculateConversion(amount, fromUnit, toUnit, category);
    const formattedResult = Number.isInteger(result) ? result : parseFloat(result.toFixed(4));

    const record = {
        id: Date.now(),
        amount: amount,
        fromUnit: fromUnit,
        toUnit: toUnit,
        result: formattedResult,
        category: category,
        time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    conversionHistory.push(record);

    renderHistory(conversionHistory);

    form.reset();
    outputResult.textContent = '0';
    updateUnitSelects(categorySelect.value);
});

updateUnitSelects(categorySelect.value);