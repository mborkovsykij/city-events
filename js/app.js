console.log('js/app.js підключено');

// Ендпоінт публічного API Nager.Date Public Holidays (Варіант 5)
const API_URL = 'https://date.nager.at/api/v3/PublicHolidays/2026/UA';

// Ключі для localStorage та параметри бази IndexedDB
const LS_SAVED_KEY = 'savedEvents_v5';
const LS_MIGRATED_FLAG = 'savedEvents_migrated';
const DB_NAME = 'EventsPosterDB';
const DB_VERSION = 1;
const STORE_NAME = 'savedEvents';

// Горизонт планування (у днях) для розрахунку відсотка заповнення прогрес-індикатора «днів до події»
const HORIZON_DAYS = 90;

let events = [];
let savedEventsCache = [];

const eventsListContainer = document.querySelector('#events-list');
const eventsCountElement = document.querySelector('#events-count');
const addEventForm = document.querySelector('#add-event-form');
const titleInput = document.querySelector('#event-title');
const titleError = document.querySelector('#title-error');
const categoryFiltersContainer = document.querySelector('#category-filters');
const btnReload = document.querySelector('#btn-reload');
const btnToggleAnim = document.querySelector('#btn-toggle-anim');
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
// Робота з localStorage та IndexedDB (Практикум 11)
// =========================================================================

function saveToLocalStorage(items) {
  localStorage.setItem(LS_SAVED_KEY, JSON.stringify(items));
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LS_SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Пошкоджені дані в localStorage:', error);
    return [];
  }
}

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

async function saveEventToDB(eventRecord) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(eventRecord);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllSavedEvents() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteSavedEventFromDB(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function migrateFromLocalStorageIfNeeded() {
  const alreadyMigrated = localStorage.getItem(LS_MIGRATED_FLAG) === 'true';
  if (alreadyMigrated) return;

  const existingInDB = await getAllSavedEvents();
  const lsItems = loadFromLocalStorage();

  if (existingInDB.length === 0 && lsItems.length > 0) {
    for (const item of lsItems) {
      await saveEventToDB(item);
    }
  }

  localStorage.setItem(LS_MIGRATED_FLAG, 'true');
}

function showDBError(text) {
  if (!dbErrorMessage) return;
  dbErrorMessage.textContent = text;
  dbErrorMessage.style.display = 'block';
}

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

async function refreshSavedEventsFromDB() {
  try {
    savedEventsCache = await getAllSavedEvents();
    renderSavedEvents(savedEventsCache);
    renderEvents(getCurrentFilteredEvents());
  } catch (error) {
    console.error('Помилка читання IndexedDB:', error);
    showDBError('Не вдалося отримати доступ до локальної бази даних IndexedDB.');
  }
}

async function handleToggleFavorite(eventItem) {
  try {
    const exists = savedEventsCache.some(saved => saved.id === eventItem.id);

    if (exists) {
      await deleteSavedEventFromDB(eventItem.id);
    } else {
      const recordToSave = {
        id: eventItem.id,
        date: eventItem.rawDate,
        name: eventItem.title,
        location: eventItem.location
      };
      await saveEventToDB(recordToSave);
      saveToLocalStorage([...savedEventsCache, recordToSave]);
    }

    await refreshSavedEventsFromDB();
  } catch (error) {
    console.error('Помилка запису в IndexedDB:', error);
    showDBError('Помилка збереження події у локальне сховище.');
  }
}

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
// Розрахунок даних для CSS прогрес-індикатора «днів до події» (Практикум 12)
// =========================================================================

// Обчислення різниці дат та відсотка заповнення смуги наближення події
function calculateEventCountdown(rawDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(rawDate);
  targetDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Минула (${Math.abs(diffDays)} дн. тому)`,
      percent: 100,
      modifier: 'past',
      isSoon: false
    };
  }

  if (diffDays === 0) {
    return {
      label: 'Відбувається сьогодні!',
      percent: 100,
      modifier: 'today',
      isSoon: true
    };
  }

  // Чим менше днів залишилося в межах горизонту (90 днів), тим вищий відсоток наближення
  const clampedDays = Math.min(diffDays, HORIZON_DAYS);
  const progressPercent = Math.max(10, Math.round(((HORIZON_DAYS - clampedDays) / HORIZON_DAYS) * 100));
  const isSoon = diffDays <= 30;

  return {
    label: `До події: ${diffDays} дн.`,
    percent: progressPercent,
    modifier: isSoon ? 'soon' : 'upcoming',
    isSoon: isSoon
  };
}

// =========================================================================
// Основна логіка афіші, рендер із CSS-анімацією та Fetch API
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

// Рендеринг карток із каскадною CSS-анімацією появи та плавним прогрес-індикатором днів
function renderEvents(items) {
  eventsListContainer.innerHTML = '';

  items.forEach((item, index) => {
    const isSaved = savedEventsCache.some(saved => saved.id === item.id);
    const countdown = calculateEventCountdown(item.rawDate);

    const card = document.createElement('article');
    card.classList.add('event-card', `event-card--${item.category}`, 'event-card--animated');
    card.dataset.category = item.category;
    // Каскадна затримка анімації появи кожної наступної картки у стрічці
    card.style.animationDelay = `${Math.min(index * 60, 480)}ms`;

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

    // CSS прогрес-індикатор «днів до події» (ширина плавно анімується через transition)
    const progressWrap = document.createElement('div');
    progressWrap.classList.add('days-progress');

    const progressHeader = document.createElement('div');
    progressHeader.classList.add('days-progress__header');

    const labelSpan = document.createElement('span');
    labelSpan.textContent = countdown.label;
    if (countdown.isSoon) {
      labelSpan.classList.add('days-progress__badge--soon');
    }

    const percentSpan = document.createElement('span');
    percentSpan.textContent = `${countdown.percent}%`;

    progressHeader.append(labelSpan, percentSpan);

    const trackDiv = document.createElement('div');
    trackDiv.classList.add('days-progress__track');

    const fillDiv = document.createElement('div');
    fillDiv.classList.add('days-progress__fill', `days-progress__fill--${countdown.modifier}`);
    trackDiv.append(fillDiv);

    progressWrap.append(progressHeader, trackDiv);

    // Запуск плавного CSS-переходу ширини смуги після вставки вузла в DOM
    requestAnimationFrame(() => {
      fillDiv.style.width = `${countdown.percent}%`;
    });

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

    card.append(topDiv, header, figure, descPara, progressWrap, actionsDiv);
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

// Кнопка керування станом CSS-анімації (animation-play-state: paused / running)
btnToggleAnim.addEventListener('click', () => {
  const isPaused = eventsListContainer.classList.toggle('animations-paused');
  btnToggleAnim.textContent = isPaused ? 'Відновити анімацію' : 'Пауза анімації';
});

btnReload.addEventListener('click', loadEventsFromAPI);

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