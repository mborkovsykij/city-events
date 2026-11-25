// Обрано фреймворк Vue 3 (CDN), оскільки він дозволяє підключити реактивність та компонентну архітектуру напряму без попередньої компіляції JSX.

const API_URL = 'https://date.nager.at/api/v3/PublicHolidays/2026/UA';

const ukrainianMonths = [
  'січ', 'лют', 'бер', 'квіт', 'трав', 'черв',
  'лип', 'серп', 'вер', 'жовт', 'лист', 'груд'
];

const categoryMeta = {
  concert: { label: 'Концерт', img: 'assets/img/concert.jpg' },
  theatre: { label: 'Театр', img: 'assets/img/theatre.jpg' },
  exhibition: { label: 'Виставка / Свято', img: 'assets/img/art.jpg' }
};

/*
// Ручний рендеринг списку з практикуму 7 замінено декларативним компонентом EventCard у Vue 3:
function renderEvents(items) {
  eventsListContainer.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('article');
    ...
    eventsListContainer.append(card);
  });
}
*/

// Компонент картки події EventCard (Варіант 5: props title, category, date + computed кількість днів до події)
const EventCard = {
  props: {
    title: { type: String, required: true },
    category: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, default: '10:00' },
    location: { type: String, default: 'Міські локації' },
    img: { type: String, default: 'assets/img/art.jpg' },
    description: { type: String, default: '' }
  },
  emits: ['select'],
  computed: {
    // Похідне значення: автоматичний розрахунок кількості днів від поточної дати до дати події
    daysUntilText() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const eventDate = new Date(this.date);
      eventDate.setHours(0, 0, 0, 0);

      const diffMs = eventDate - today;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        return `Залишилось днів: ${diffDays}`;
      } else if (diffDays === 0) {
        return 'Подія відбувається сьогодні';
      } else {
        return `Подія вже минула (${Math.abs(diffDays)} дн. тому)`;
      }
    },
    isPast() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(this.date) < today;
    },
    formattedDay() {
      const d = new Date(this.date);
      return String(d.getDate()).padStart(2, '0');
    },
    formattedMonth() {
      const d = new Date(this.date);
      return ukrainianMonths[d.getMonth()];
    },
    categoryLabel() {
      return categoryMeta[this.category]?.label || 'Міське свято';
    }
  },
  template: `
    <article class="event-card" :class="'event-card--' + category" :data-category="category">
      <div class="event-card__top">
        <span class="badge" :class="'badge--' + category">{{ categoryLabel }}</span>
        <div class="event-date">
          <span class="event-date__day">{{ formattedDay }}</span>
          <span class="event-date__month">{{ formattedMonth }}</span>
        </div>
      </div>

      <header class="event-card__header">
        <h3>{{ title }}</h3>
        <p><time>{{ time }}</time></p>
      </header>

      <figure class="event-card__figure">
        <img :src="img" :alt="title" class="event-card__img">
        <figcaption>{{ location }}</figcaption>
      </figure>

      <p>{{ description }}</p>

      <div>
        <span class="days-left-badge" :class="{ 'days-left-badge--past': isPast }">
          {{ daysUntilText }}
        </span>
      </div>

      <a href="#selected-event" class="event-card__link" @click.prevent="$emit('select')">
        Детальніше
      </a>
    </article>
  `
};

// Головний застосунок Vue 3 із реактивним станом
const app = Vue.createApp({
  components: {
    EventCard
  },
  data() {
    return {
      events: [],
      selectedCategory: 'all',
      newTitle: '',
      newCategory: '',
      newDate: '',
      isLoading: false,
      statusText: '',
      statusType: '',
      selectedEvent: {
        title: 'Симфонічний вечір',
        location: 'Головний сценічний комплекс',
        date: '2026-10-15',
        time: '19:00',
        description: 'Оберіть подію у списку, натиснувши «Детальніше».'
      }
    };
  },
  computed: {
    // Автоматична фільтрація списку при зміні категорії або масиву подій
    filteredEvents() {
      if (this.selectedCategory === 'all') {
        return this.events;
      }
      return this.events.filter(item => item.category === this.selectedCategory);
    },
    // Валідація назви події в реальному часі
    titleError() {
      if (this.newTitle.length > 0 && this.newTitle.length < 3) {
        return 'Назва заходу занадто коротка (мінімум 3 символи)';
      }
      return '';
    }
  },
  methods: {
    // Асинхронне отримання даних із публічного API Nager.Date у реактивний стан
    async loadEventsFromAPI() {
      this.isLoading = true;
      this.statusText = 'Завантаження подій із сервера...';
      this.statusType = 'loading';
      this.events = [];

      try {
        const response = await fetch(API_URL, { cache: 'no-store' });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Дані про події не знайдено');
          }
          throw new Error(`Сервер відповів зі статусом ${response.status}`);
        }

        const data = await response.json();

        this.events = data.map((item, index) => ({
          id: `${item.date}-${index}`,
          title: item.localName,
          category: 'exhibition',
          date: item.date,
          time: '10:00',
          location: 'Центральні міські локації',
          img: 'assets/img/art.jpg',
          description: `Загальноміська подія: ${item.name} (${item.localName}). Святкові заходи та культурна програма.`
        }));

        if (this.events.length > 0) {
          this.selectedEvent = this.events[0];
        }

        this.statusText = '';
        this.statusType = '';
      } catch (error) {
        console.error('Помилка завантаження API:', error);
        this.statusType = 'error';
        if (!navigator.onLine) {
          this.statusText = 'Не вдалося отримати дані. Перевірте з’єднання з інтернетом (Offline).';
        } else {
          this.statusText = error.message || 'Дані про події не знайдено';
        }
      } finally {
        this.isLoading = false;
      }
    },
    // Реактивне додавання нової події без ручних маніпуляцій DOM
    addEvent() {
      if (this.newTitle.length < 3 || !this.newCategory || !this.newDate) {
        return;
      }

      const newEventObj = {
        id: `custom-${Date.now()}`,
        title: this.newTitle,
        category: this.newCategory,
        date: this.newDate,
        time: '19:00',
        location: 'Центральна зала',
        img: categoryMeta[this.newCategory].img,
        description: 'Нова подія, додана користувачем через форму афіші.'
      };

      this.events.push(newEventObj);
      this.selectedCategory = 'all';

      this.newTitle = '';
      this.newCategory = '';
      this.newDate = '';
    }
  },
  mounted() {
    this.loadEventsFromAPI();
  }
});

app.mount('#app');