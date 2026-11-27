// Обрано Vue 3 через простий синтаксис шаблонів, вбудовану реактивність (v-model, computed, v-for) та підключення через CDN без збірки.

const API_URL = 'https://api.frankfurter.app/latest?from=USD';
const STORAGE_KEY = 'converterHistory';
const MIGRATED_KEY = 'converterMigrated';
const DB_NAME = 'ConverterDB';
const DB_VERSION = 1;
const STORE_NAME = 'history';

function saveToLocalStorage(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function loadFromLocalStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error('Пошкоджені дані в localStorage:', error);
        return [];
    }
}

// Відкриття або ініціалізація локальної бази даних IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error('IndexedDB не підтримується браузером'));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Додавання або оновлення запису конвертації в IndexedDB
async function addItem(item) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Отримання всіх записів історії з IndexedDB
async function getAllItems() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Видалення запису історії за його ідентифікатором id
async function deleteItem(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

const ConverterForm = {
    props: ['category', 'options', 'rates', 'lengthRates', 'massRates'],
    emits: ['add-history'],
    data() {
        return {
            amount: 1,
            fromUnit: this.options[0].value,
            toUnit: this.options[1] ? this.options[1].value : this.options[0].value
        };
    },
    watch: {
        options(newOpts) {
            this.fromUnit = newOpts[0].value;
            this.toUnit = newOpts[1] ? newOpts[1].value : newOpts[0].value;
        }
    },
    computed: {
        result() {
            const val = parseFloat(this.amount);
            if (!val || isNaN(val) || val <= 0) return 0;

            let res = 0;
            if (this.category === 'currency') {
                const rateFrom = this.rates[this.fromUnit] || 1;
                const rateTo = this.rates[this.toUnit] || 1;
                res = (val / rateFrom) * rateTo;
            } else if (this.category === 'length') {
                res = val * (this.lengthRates[this.fromUnit] / this.lengthRates[this.toUnit]);
            } else if (this.category === 'weight') {
                res = val * (this.massRates[this.fromUnit] / this.massRates[this.toUnit]);
            }
            return Number.isInteger(res) ? res : parseFloat(res.toFixed(4));
        }
    },
    methods: {
        saveConversion() {
            if (!this.amount || this.amount <= 0) return;
            this.$emit('add-history', {
                from: this.fromUnit,
                to: this.toUnit,
                amount: Number(this.amount),
                result: this.result,
                timestamp: Date.now()
            });
        }
    },
    template: `
        <section>
            <h2>Форма конвертації</h2>
            <form id="converter-form" @submit.prevent="saveConversion">
                <div class="converter-row">
                    <div class="field-col">
                        <div class="form-group">
                            <label for="set_type">Оберіть вхідну одиницю:</label>
                            <select id="set_type" v-model="fromUnit">
                                <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="set_convertation">Уведіть суму або значення (amount):</label>
                            <input
                                type="number"
                                id="set_convertation"
                                v-model.number="amount"
                                min="0.01"
                                step="any"
                                required
                                placeholder="Введіть число > 0"
                            >
                        </div>
                    </div>

                    <div class="action-col">
                        <button type="submit" id="cnvrt_btn">Зберегти в історію</button>
                    </div>

                    <div class="field-col">
                        <div class="form-group">
                            <label for="get_type">Оберіть вихідну одиницю:</label>
                            <select id="get_type" v-model="toUnit">
                                <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="get_convertation">Отримана сума або значення:</label>
                            <output id="get_convertation">{{ result }} {{ toUnit }}</output>
                        </div>
                    </div>
                </div>
            </form>
        </section>
    `
};

/* Ручний рендер списку через DOM API (querySelector/innerHTML) з практикуму 7 замінено декларативними директивами v-for у Vue 3
function renderRates(ratesObj) {
    ratesContainer.innerHTML = '';
    for (const [currency, rate] of Object.entries(ratesObj)) {
        const li = document.createElement('li');
        li.textContent = `${currency}: ${rate}`;
        ratesContainer.append(li);
    }
}
*/

Vue.createApp({
    components: {
        ConverterForm
    },
    data() {
        return {
            category: 'currency',
            rates: {
                USD: 1,
                EUR: 0.92,
                UAH: 41.5
            },
            apiRates: {},
            lengthRates: {
                MM: 0.001,
                SM: 0.01,
                MT: 1,
                KM: 1000
            },
            massRates: {
                GR: 0.001,
                KG: 1,
                TN: 1000
            },
            unitOptions: {
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
            },
            conversionHistory: [],
            ratesLoading: false,
            ratesError: '',
            ratesDate: '',
            dbError: ''
        };
    },
    methods: {
        formatTime(timestamp) {
            return new Date(timestamp).toLocaleTimeString('uk-UA', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        },
        async initStorage() {
            try {
                const existing = await getAllItems();
                const isMigrated = localStorage.getItem(MIGRATED_KEY) === 'true';

                if (existing.length === 0 && !isMigrated) {
                    const lsItems = loadFromLocalStorage();
                    for (const item of lsItems) {
                        const { id, ...cleanItem } = item;
                        await addItem(cleanItem);
                    }
                    localStorage.setItem(MIGRATED_KEY, 'true');
                }

                await this.refreshHistory();
            } catch (error) {
                console.error('Помилка відкриття IndexedDB:', error);
                this.dbError = 'Локальне сховище IndexedDB недоступне. Використовується резервне збереження в localStorage.';
                this.conversionHistory = loadFromLocalStorage()
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 10);
            }
        },
        async refreshHistory() {
            const allItems = await getAllItems();
            this.conversionHistory = allItems
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 10);
        },
        async addToHistory(record) {
            try {
                await addItem(record);
                await this.refreshHistory();
            } catch (error) {
                console.error('Помилка збереження в IndexedDB:', error);
                this.dbError = 'Не вдалося зберегти запис у IndexedDB. Дані збережено у localStorage.';
                this.conversionHistory.unshift(record);
                this.conversionHistory = this.conversionHistory.slice(0, 10);
                saveToLocalStorage(this.conversionHistory);
            }
        },
        async removeHistoryItem(id) {
            try {
                await deleteItem(id);
                await this.refreshHistory();
            } catch (error) {
                console.error('Помилка видалення з IndexedDB:', error);
                this.dbError = 'Не вдалося видалити запис із IndexedDB.';
            }
        },
        // Отримання курсів валют через Frankfurter API (курси Європейського центрального банку): https://api.frankfurter.app/
        async loadRates() {
            this.ratesLoading = true;
            this.ratesError = '';

            try {
                const response = await fetch(API_URL);

                if (!response.ok) {
                    if (response.status === 422 || response.status === 404) {
                        throw new Error('Перевірте код валюти');
                    }
                    throw new Error(`Сервер відповів кодом ${response.status}`);
                }

                const data = await response.json();
                if (data.rates) {
                    Object.assign(this.rates, data.rates);
                    this.apiRates = data.rates;
                }
                if (data.date) {
                    this.ratesDate = `Дата курсів: ${data.date} (Базова валюта: ${data.base})`;
                }
            } catch (error) {
                console.error('Помилка завантаження даних:', error);
                this.ratesError = error.message.includes('Перевірте код валюти')
                    ? 'Перевірте код валюти'
                    : 'Не вдалося завантажити дані. Спробуйте пізніше.';
            } finally {
                this.ratesLoading = false;
            }
        }
    },
    mounted() {
        this.initStorage();
        this.loadRates();
    }
}).mount('#app');
