console.log('js/app.js підключено');

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

const eventsListContainer = document.querySelector('#events-list');
const eventsCountElement = document.querySelector('#events-count');
const addEventForm = document.querySelector('#add-event-form');
const titleInput = document.querySelector('#event-title');
const titleError = document.querySelector('#title-error');
const categoryFiltersContainer = document.querySelector('#category-filters');

const ukrainianMonths = [
  'січ', 'лют', 'бер', 'квіт', 'трав', 'черв',
  'лип', 'серп', 'вер', 'жовт', 'лист', 'груд'
];

const categoryMeta = {
  concert: { label: 'Концерт', img: 'assets/img/concert.jpg' },
  theatre: { label: 'Театр', img: 'assets/img/theatre.jpg' },
  exhibition: { label: 'Виставка', img: 'assets/img/art.jpg' }
};

function updateSummary(items) {
  if (eventsCountElement) {
    eventsCountElement.textContent = `Кількість подій: ${items.length}`;
  }
}

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
    timeElem.textContent = item.time || '18:00';
    timePara.append(timeElem);

    header.append(title, timePara);

    const figure = document.createElement('figure');
    figure.classList.add('event-card__figure');

    const img = document.createElement('img');
    img.src = item.img;
    img.alt = item.title;
    img.classList.add('event-card__img');

    const figcaption = document.createElement('figcaption');
    figcaption.textContent = item.location || 'Центральний майданчик';

    figure.append(img, figcaption);

    const descPara = document.createElement('p');
    descPara.textContent = item.description || 'Культурна подія міста.';

    const link = document.createElement('a');
    link.href = '#selected-event';
    link.classList.add('event-card__link');
    link.textContent = 'Детальніше';

    card.append(topDiv, header, figure, descPara, link);
    eventsListContainer.append(card);
  });
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

renderEvents(events);
updateSummary(events);