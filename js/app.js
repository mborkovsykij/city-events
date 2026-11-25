// Перевірка коректного підключення скрипта до HTML-сторінки
console.log('js/app.js підключено');

// Вхідний масив об'єктів культурних подій міста (Варіант 5)
const events = [
  {
    title: 'Симфонічний вечір',
    category: 'concert',
    categoryLabel: 'Концерт',
    day: '15',
    month: 'жовт',
    time: '19:00',
    location: 'Головна концертна зала',
    img: 'assets/img/concert.jpg',
    description: 'Шедеври класичної музики у виконанні камерного оркестру при атмосферному освітленні.'
  },
  {
    title: 'Виставка мистецтва',
    category: 'exhibition',
    categoryLabel: 'Виставка',
    day: '18',
    month: 'жовт',
    time: '11:00',
    location: 'Виставковий центр',
    img: 'assets/img/art.jpg',
    description: 'Експозиція візуального мистецтва та просторових інсталяцій від сучасних авторів.'
  },
  {
    title: 'Драматична вистава',
    category: 'theatre',
    categoryLabel: 'Театр',
    day: '22',
    month: 'жовт',
    time: '18:30',
    location: 'Національний драматичний театр',
    img: 'assets/img/theatre.jpg',
    description: 'Класична п\'єса в сучасній режисерській інтерпретації провідної трупи міста.'
  },
  {
    title: 'Органний концерт',
    category: 'concert',
    categoryLabel: 'Концерт',
    day: '25',
    month: 'жовт',
    time: '19:30',
    location: 'Будинок органної музики',
    img: 'assets/img/organ.jpg',
    description: 'Величне звучання історичного органа з творчістю Й. С. Баха.'
  },
  {
    title: 'Сучасні інсталяції',
    category: 'exhibition',
    categoryLabel: 'Виставка',
    day: '29',
    month: 'жовт',
    time: '12:00',
    location: 'Мистецький арсенал',
    img: 'assets/img/installation.jpg',
    description: 'Інтерактивна експозиція цифрового та медіа-мистецтва.'
  },
  {
    title: 'Комедійна постановка',
    category: 'theatre',
    categoryLabel: 'Театр',
    day: '02',
    month: 'лист',
    time: '19:00',
    location: 'Театр драми і комедії',
    img: 'assets/img/comedy.jpg',
    description: 'Легка та дотепна вистава про курйози сучасного міського життя.'
  }
];

// Пошук та програмне видалення початкової статичної картки-заглушки з DOM
const staticCard = document.querySelector('.static-card');
if (staticCard) {
  staticCard.remove();
}

// Вибірка контейнера сітки подій та елемента підсумкового лічильника
const eventsListContainer = document.querySelector('#events-list');
const eventsCountElement = document.querySelector('#events-count');

// Функція динамічного рендерингу масиву подій у DOM-дерево
function renderEvents(items) {
  // Очищення контейнера перед генерацією актуального списку карток
  eventsListContainer.innerHTML = '';

  // Перебір кожного об'єкта події та створення відповідної структури картки
  items.forEach(item => {
    // Створення головного тегу article та налаштування класів-модифікаторів і data-атрибута
    const card = document.createElement('article');
    card.classList.add('event-card');
    card.classList.add(`event-card--${item.category}`);
    card.dataset.category = item.category;

    // Формування верхньої панелі картки (бейдж категорії та блок дати)
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

    // Створення заголовка картки з назвою події та часом проведення
    const header = document.createElement('header');
    header.classList.add('event-card__header');

    const title = document.createElement('h3');
    title.textContent = item.title;

    const timePara = document.createElement('p');
    const timeElem = document.createElement('time');
    timeElem.textContent = item.time;
    timePara.append(timeElem);

    header.append(title, timePara);

    // Додавання ілюстрації заходу та підпису місця проведення
    const figure = document.createElement('figure');
    figure.classList.add('event-card__figure');

    const img = document.createElement('img');
    img.src = item.img;
    img.alt = item.title;
    img.classList.add('event-card__img');

    const figcaption = document.createElement('figcaption');
    figcaption.textContent = item.location;

    figure.append(img, figcaption);

    // Створення абзацу з описом події та навігаційного посилання
    const descPara = document.createElement('p');
    descPara.textContent = item.description;

    const link = document.createElement('a');
    link.href = '#selected-event';
    link.classList.add('event-card__link');
    link.textContent = 'Детальніше';

    // Збірка всіх створених дочірніх вузлів у картку та вставка її у сітку на сторінці
    card.append(topDiv, header, figure, descPara, link);
    eventsListContainer.append(card);
  });
}

// Функція оновлення текстового вмісту підсумкового лічильника кількості подій
function updateSummary(items) {
  if (eventsCountElement) {
    eventsCountElement.textContent = `Кількість подій: ${items.length}`;
  }
}

// Початковий виклик функцій для рендерингу карток та оновлення лічильника при завантаженні
renderEvents(events);
updateSummary(events);
