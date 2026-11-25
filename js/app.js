// Перевірка підключення скрипта
console.log('js/app.js підключено');

// Ендпоінт публічного API Nager.Date Public Holidays для України на 2026 рік (Варіант 5)
const API_URL = 'https://date.nager.at/api/v3/PublicHolidays/2026/UA';

// Поточний масив подій афіші
let events = [];

// Вибірка основних DOM-елементів інтерфейсу
const eventsListContainer = document.querySelector('#events-list');
const eventsCountElement = document.querySelector('#events-count');
const addEventForm = document.querySelector('#add-event-form');
const titleInput = document.querySelector('#event-title');
const titleError = document.querySelector('#title-error');
const categoryFiltersContainer = document.querySelector('#category-filters');
const btnReload = document.querySelector('#btn-reload');
const statusMessage = document.querySelector('#status-message');

// Словник скорочених назв місяців українською мовою
const ukrainianMonths = [
  'січ', 'лют', 'бер', 'квіт', 'трав', 'черв',
  'лип', 'серп', 'вер', 'жовт', 'лист', 'груд'
];

// Довідник міток категорій та ілюстрацій за замовчуванням
const categoryMeta = {
  concert: { label: 'Концерт', img: 'assets/img/concert.jpg' },
  theatre: { label: 'Театр', img: 'assets/img/theatre.jpg' },
  exhibition: { label: 'Виставка / Свято', img: 'assets/img/art.jpg' }
};

// Відображення стану завантаження або помилки у спеціальному блоці інтерфейсу
function showStatus(text, type = 'loading') {
  if (!statusMessage) return;
  statusMessage.textContent = text;
  statusMessage.className = `status-message ${type}`;
}

// Приховування повідомлення про статус
function clearStatus() {
  if (!statusMessage) return;
  statusMessage.textContent = '';
  statusMessage.className = 'status-message';
}

// Оновлення підсумкового лічильника кількості подій
function updateSummary(items) {
  if (eventsCountElement) {
    eventsCountElement.textContent = `Кількість подій: ${items.length}`;
  }
}

// Динамічний рендеринг карток подій у DOM-дерево (Практикум 7)
function renderEvents(items) {
  eventsListContainer.innerHTML = '';

  items.forEach(item => {
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

    const link = document.createElement('a');
    link.href = '#selected-event';
    link.classList.add('event-card__link');
    link.textContent = 'Детальніше';

    card.append(topDiv, header, figure, descPara, link);
    eventsListContainer.append(card);
  });
}

// Асинхронне завантаження подій із зовнішнього публічного API Nager.Date (https://date.nager.at/api/v3/PublicHolidays/2026/UA)
async function loadEventsFromAPI() {
  showStatus('Завантаження подій із сервера...', 'loading');
  if (btnReload) btnReload.disabled = true;

  try {
    const response = await fetch(API_URL);

    // Перевірка HTTP-статусу відповіді (зокрема обробка 404 за умовою варіанта)
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Дані про події не знайдено');
      }
      throw new Error(`Сервер відповів зі статусом ${response.status}`);
    }

    const data = await response.json();
    console.log('Отримані дані з API:', data);

    // Перетворення об'єктів відповіді API (date, localName, name) у формат карток застосунку
    const apiEvents = data.map(item => {
      const parsedDate = new Date(item.date);
      const day = String(parsedDate.getDate()).padStart(2, '0');
      const month = ukrainianMonths[parsedDate.getMonth()];

      return {
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

    events = apiEvents;
    renderEvents(events);
    updateSummary(events);
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

// Валідація поля назви події під час введення символів (Практикум 8)
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

// Обробка надсилання форми додавання нової події без перезавантаження сторінки
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

  renderEvents(events);
  updateSummary(events);

  document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
  document.querySelector('[data-filter="all"]')?.classList.add('active');

  addEventForm.reset();
  titleError.textContent = '';
  console.log(`Подію "${title}" успішно додано до афіші.`);
});

// Делегування події кліку для фільтрації подій за категоріями
categoryFiltersContainer.addEventListener('click', event => {
  const button = event.target.closest('.btn-filter');
  if (!button) return;

  document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');

  const selectedCategory = button.dataset.filter;

  if (selectedCategory === 'all') {
    renderEvents(events);
    updateSummary(events);
  } else {
    const filteredEvents = events.filter(item => item.category === selectedCategory);
    renderEvents(filteredEvents);
    updateSummary(filteredEvents);
  }
});

// Прив'язка повторного запиту до кнопки «Оновити афішу з сервера»
btnReload.addEventListener('click', loadEventsFromAPI);

// Первинне завантаження подій при відкритті сторінки
loadEventsFromAPI();