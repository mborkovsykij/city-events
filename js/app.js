console.log('js/app.js підключено');

// Ендпоінт публічного API Nager.Date Public Holidays (Варіант 5)
const API_URL = 'https://date.nager.at/api/v3/PublicHolidays/2026/UA';

// Ключі для localStorage та параметри бази IndexedDB (Варіант 5: сховище savedEvents, keyPath: id)
const LS_SAVED_KEY = 'savedEvents_v5';
const LS_MIGRATED_FLAG = 'savedEvents_migrated';
const DB_NAME = 'EventsPosterDB';
const DB_VERSION = 1;
const STORE_NAME = 'savedEvents';

let events = [];
let savedEventsCache = [];

const eventsListContainer = document.querySelector('#events-list');
const eventsCountElement = document.querySelector('#events-count');
const addEventForm = document.querySelector('#add-event-form');
const titleInput = document.querySelector('#event-title');
const titleError = document.querySelector('#title-error');
const categoryFiltersContainer = document.querySelector('#category-filters');
const btnReload = document.querySelector('#btn-reload');
const statusMessage = document.querySelector('#status-message');

const savedEventsList = document.querySelector('#saved-events-list');
const savedCountElement = document.querySelector('#saved-count');
const dbErrorMessage = document.querySelector('#db-error-message');

const ukrainianMonths = [
  'січ', 'лют', 'бер', 'квіт', 'трав', 'черв',
  'лип', 'серп', 'вер', 'жовт', 'лист', 'груд'
];

const categoryMeta = {
  concert: { label: 'Концерт', img: 'assets/img/concert.jpg' },
  theatre: { label: 'Театр', img: 'assets/img/theatre.jpg' },
  exhibition: { label: 'Виставка / Свято', img: 'assets/img/art.jpg' }
};

// =========================================================================
// БЛОК 1: Робота з localStorage (Кроки 2-4, використовується для міграції)
// =========================================================================

// Синхронне збереження масиву обраних подій у localStorage у форматі JSON
function saveToLocalStorage(items) {
  localStorage.setItem(LS_SAVED_KEY, JSON.stringify(items));
}

// Безпечне зчитування та розбір даних із localStorage з перехопленням пошкодженого JSON
function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LS_SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Пошкоджені дані в localStorage:', error);
    return [];
  }
}

// =========================================================================
// БЛОК 2: Асинхронна робота з IndexedDB (Кроки 5-12)
// =========================================================================

// Відкриття або ініціалізація бази даних IndexedDB та створення object store "savedEvents"
function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Ваш браузер не підтримує IndexedDB.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Не вдалося відкрити IndexedDB'));
  });
}

// Додавання або оновлення обраної події в об'єктному сховищі savedEvents (транзакція readwrite)
async function saveEventToDB(eventRecord) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(eventRecord);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Отримання всіх збережених подій зі сховища savedEvents (транзакція readonly)
async function getAllSavedEvents() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Видалення події за ключем id зі сховища savedEvents (транзакція readwrite)
async function deleteSavedEventFromDB(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Одноразова міграція накопичених записів із localStorage в IndexedDB (Крок 8)
async function migrateFromLocalStorageIfNeeded() {
  const alreadyMigrated = localStorage.getItem(LS_MIGRATED_FLAG) === 'true';
  if (alreadyMigrated) return;

  const existingInDB = await getAllSavedEvents();
  const lsItems = loadFromLocalStorage();

  if (existingInDB.length === 0 && lsItems.length > 0) {
    for (const item of lsItems) {
      await saveEventToDB(item);
    }
    console.log(`Виконано одноразову міграцію ${lsItems.length} записів із localStorage в IndexedDB.`);
  }

  localStorage.setItem(LS_MIGRATED_FLAG, 'true');
}

// Відображення повідомлення про помилку доступу до IndexedDB (Крок 11)
function showDBError(text) {
  if (!dbErrorMessage) return;
  dbErrorMessage.textContent = text;
  dbErrorMessage.style.display = 'block';
}

// Рендеринг бічної панелі обраних подій, завантажених з IndexedDB
function renderSavedEvents(savedItems) {
  if (!savedEventsList || !savedCountElement) return;

  savedCountElement.textContent = `Збережено подій: ${savedItems.length}`;
  savedEventsList.innerHTML = '';

  if (savedItems.length === 0) {
    const emptyMsg = document.createElement('li');
    emptyMsg.className = 'saved-item__meta';
    emptyMsg.textContent = 'Список обраних подій порожній. Натисніть «Додати в обране» на будь-якій картці.';
    savedEventsList.append(emptyMsg);
    return;
  }

  savedItems.forEach(item => {
    const li = document.createElement('li');
    li.className = 'saved-item';

    const infoDiv = document.createElement('div');
    infoDiv.className = 'saved-item__info';

    const nameStrong = document.createElement('strong');
    nameStrong.textContent = item.name;

    const metaSpan = document.createElement('span');
    metaSpan.className = 'saved-item__meta';
    metaSpan.textContent = `${item.date} • ${item.location}`;

    infoDiv.append(nameStrong, metaSpan);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-remove-saved';
    removeBtn.textContent = 'Видалити';
    removeBtn.addEventListener('click', () => handleRemoveSaved(item.id));

    li.append(infoDiv, removeBtn);
    savedEventsList.append(li);
  });
}

// Синхронізація кешу обраних подій з IndexedDB та оновлення інтерфейсу
async function refreshSavedEventsFromDB() {
  try {
    savedEventsCache = await getAllSavedEvents();
    renderSavedEvents(savedEventsCache);
    renderEvents(getCurrentFilteredEvents());
  } catch (error) {
    console.error('Помилка читання IndexedDB:', error);
    showDBError('Не вдалося отримати доступ до локальної бази даних IndexedDB (можливо, увімкнено приватний режим).');
  }
}

// Перемикання стану «в обраному» для події (запис у IndexedDB або видалення)
async function handleToggleFavorite(eventItem) {
  try {
    const exists = savedEventsCache.some(saved => saved.id === eventItem.id);

    if (exists) {
      await deleteSavedEventFromDB(eventItem.id);
    } else {
      // Модель запису за варіантом 5: { id, date, name, location }
      const recordToSave = {
        id: eventItem.id,
        date: eventItem.rawDate,
        name: eventItem.title,
        location: eventItem.location
      };
      await saveEventToDB(recordToSave);
      // Дублювання у localStorage для демонстрації роботи обох сховищ
      saveToLocalStorage([...savedEventsCache, recordToSave]);
    }

    await refreshSavedEventsFromDB();
  } catch (error) {
    console.error('Помилка запису в IndexedDB:', error);
    showDBError('Помилка збереження події у локальне сховище.');
  }
}

// Видалення події зі списку обраних за кнопкою «Видалити»
async function handleRemoveSaved(id) {
  try {
    await deleteSavedEventFromDB(id);
    const updated = savedEventsCache.filter(item => item.id !== id);
    saveToLocalStorage(updated);
    await refreshSavedEventsFromDB();
  } catch (error) {
    console.error('Помилка видалення з IndexedDB:', error);
    showDBError('Не вдалося видалити подію зі сховища.');
  }
}

// =========================================================================
// БЛОК 3: Основна логіка афіші, рендер карток та Fetch API
// =========================================================================

function showStatus(text, type = 'loading') {
  if (!statusMessage) return;
  statusMessage.textContent = text;
  statusMessage.className = `status-message ${type}`;
}

function clearStatus() {
  if (!statusMessage) return;
  statusMessage.textContent = '';
  statusMessage.className = 'status-message';
}

function updateSummary(items) {
  if (eventsCountElement) {
    eventsCountElement.textContent = `Кількість подій: ${items.length}`;
  }
}

function getCurrentFilteredEvents() {
  const activeBtn = document.querySelector('.btn-filter.active');
  const selectedCategory = activeBtn ? activeBtn.dataset.filter : 'all';
  if (selectedCategory === 'all') return events;
  return events.filter(item => item.category === selectedCategory);
}

function renderEvents(items) {
  eventsListContainer.innerHTML = '';

  items.forEach(item => {
    const isSaved = savedEventsCache.some(saved => saved.id === item.id);

    const card = document.createElement('article');
    card.classList.add('event-card', `event-card--${item.category}`);
    card.dataset.category = item.category;

    const topDiv = document.createElement('div');
    topDiv.classList.add('event-card__top');

    const badge = document.createElement('span');
    badge.classList.add('badge', `badge--${item.category}`);
    badge.textContent = item.categoryLabel;

    const dateBox = document.createElement('div');
    dateBox.classList.add('event-date');

    const daySpan = document.createElement('span');
    daySpan.classList.add('event-date__day');
    daySpan.textContent = item.day;

    const monthSpan = document.createElement('span');
    monthSpan.classList.add('event-date__month');
    monthSpan.textContent = item.month;

    dateBox.append(daySpan, monthSpan);
    topDiv.append(badge, dateBox);

    const header = document.createElement('header');
    header.classList.add('event-card__header');

    const title = document.createElement('h3');
    title.textContent = item.title;

    const timePara = document.createElement('p');
    const timeElem = document.createElement('time');
    timeElem.textContent = item.time || '10:00';
    timePara.append(timeElem);

    header.append(title, timePara);

    const figure = document.createElement('figure');
    figure.classList.add('event-card__figure');

    const img = document.createElement('img');
    img.src = item.img;
    img.alt = item.title;
    img.classList.add('event-card__img');

    const figcaption = document.createElement('figcaption');
    figcaption.textContent = item.location || 'Міські локації';

    figure.append(img, figcaption);

    const descPara = document.createElement('p');
    descPara.textContent = item.description || 'Загальноміська культурна подія.';

    // Кнопка додавання / видалення події з IndexedDB (Варіант 5)
    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('event-card__actions');

    const favBtn = document.createElement('button');
    favBtn.type = 'button';
    favBtn.classList.add('btn-favorite');
    if (isSaved) {
      favBtn.classList.add('is-saved');
      favBtn.textContent = '★ В обраному';
    } else {
      favBtn.textContent = '☆ Додати в обране';
    }
    favBtn.addEventListener('click', () => handleToggleFavorite(item));

    actionsDiv.append(favBtn);

    card.append(topDiv, header, figure, descPara, actionsDiv);
    eventsListContainer.append(card);
  });
}

async function loadEventsFromAPI() {
  showStatus('Завантаження подій із сервера...', 'loading');
  if (btnReload) btnReload.disabled = true;

  events = [];
  renderEvents(events);
  updateSummary(events);

  try {
    const response = await fetch(API_URL, { cache: 'no-store' });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Дані про події не знайдено');
      }
      throw new Error(`Сервер відповів зі статусом ${response.status}`);
    }

    const data = await response.json();

    events = data.map((item, index) => {
      const parsedDate = new Date(item.date);
      const day = String(parsedDate.getDate()).padStart(2, '0');
      const month = ukrainianMonths[parsedDate.getMonth()];

      return {
        id: `ua-holiday-${item.date}-${index}`,
        rawDate: item.date,
        title: item.localName,
        category: 'exhibition',
        categoryLabel: 'Міське свято',
        day: day,
        month: month,
        time: '10:00',
        location: 'Центральні міські локації',
        img: 'assets/img/art.jpg',
        description: `Загальноміська подія: ${item.name} (${item.localName}). Святкові заходи та культурна програма.`
      };
    });

    const filtered = getCurrentFilteredEvents();
    renderEvents(filtered);
    updateSummary(filtered);
    clearStatus();
  } catch (error) {
    console.error('Помилка завантаження API:', error);
    if (!navigator.onLine) {
      showStatus('Не вдалося отримати дані. Перевірте з’єднання з інтернетом (Offline).', 'error');
    } else {
      showStatus(error.message || 'Дані про події не знайдено', 'error');
    }
  } finally {
    if (btnReload) btnReload.disabled = false;
  }
}

titleInput.addEventListener('input', () => {
  const value = titleInput.value.trim();
  if (value.length > 0 && value.length < 3) {
    const errorText = 'Назва заходу занадто коротка (мінімум 3 символи)';
    titleInput.setCustomValidity(errorText);
    titleError.textContent = errorText;
  } else {
    titleInput.setCustomValidity('');
    titleError.textContent = '';
  }
});

addEventForm.addEventListener('submit', event => {
  event.preventDefault();

  if (!addEventForm.checkValidity()) {
    if (titleInput.value.trim().length < 3) {
      const errorText = 'Будь ласка, вкажіть назву заходу (від 3 символів)';
      titleInput.setCustomValidity(errorText);
      titleError.textContent = errorText;
    }
    addEventForm.reportValidity();
    return;
  }

  const title = titleInput.value.trim();
  const category = document.querySelector('#event-category').value;
  const rawDate = document.querySelector('#event-date').value;

  const parsedDate = new Date(rawDate);
  const day = String(parsedDate.getDate()).padStart(2, '0');
  const month = ukrainianMonths[parsedDate.getMonth()];

  const newEvent = {
    id: `custom-${Date.now()}`,
    rawDate: rawDate,
    title: title,
    category: category,
    categoryLabel: categoryMeta[category].label,
    day: day,
    month: month,
    time: '19:00',
    location: 'Центральна зала',
    img: categoryMeta[category].img,
    description: 'Нова подія, додана користувачем через форму афіші.'
  };

  events.push(newEvent);

  document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
  document.querySelector('[data-filter="all"]')?.classList.add('active');

  renderEvents(events);
  updateSummary(events);

  addEventForm.reset();
  titleError.textContent = '';
});

categoryFiltersContainer.addEventListener('click', event => {
  const button = event.target.closest('.btn-filter');
  if (!button) return;

  document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');

  const filteredEvents = getCurrentFilteredEvents();
  renderEvents(filteredEvents);
  updateSummary(filteredEvents);
});

btnReload.addEventListener('click', loadEventsFromAPI);

// Послідовна ініціалізація при завантаженні сторінки: міграція -> читання IndexedDB -> завантаження API
async function initApp() {
  try {
    await migrateFromLocalStorageIfNeeded();
    await refreshSavedEventsFromDB();
  } catch (error) {
    console.error('Помилка ініціалізації IndexedDB:', error);
    showDBError('Локальна база даних IndexedDB недоступна у поточному режимі браузера.');
  }
  await loadEventsFromAPI();
}

initApp();