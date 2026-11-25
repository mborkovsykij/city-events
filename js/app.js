// Перевірка коректного підключення зовнішнього скрипта з атрибутом defer
console.log('js/app.js підключено');

// Вхідний масив об'єктів культурних подій міста (Варіант 5)
const events = [
  { title: 'Симфонічний вечір', category: 'concert' },
  { title: 'Виставка мистецтва', category: 'exhibition' },
  { title: 'Драматична вистава', category: 'theatre' },
  { title: 'Органний концерт класичної музики', category: 'concert' },
  { title: 'Виставка просторових інсталяцій', category: 'exhibition' },
  { title: 'Комедійна театральна постановка', category: 'theatre' }
];

// Стрілкова функція для обрізання тексту до заданої довжини n з додаванням трикрапки
const shorten = (text, n) => (text.length > n ? text.slice(0, n) + '...' : text);

// Функція класифікації категорії події за допомогою умовного оператора if / else if / else
function getCategoryDescription(category) {
  if (category === 'concert') {
    return 'Концертний захід';
  } else if (category === 'theatre') {
    return 'Театральна вистава';
  } else if (category === 'exhibition') {
    return 'Художня виставка';
  } else {
    return 'Загальна подія';
  }
}

// Функція фільтрації та виведення подій обраної категорії в консоль за допомогою циклу for...of
function printEventsByCategory(eventsList, targetCategory) {
  console.log(`\n--- Події у категорії: ${targetCategory} ---`);
  let count = 0;

  for (const event of eventsList) {
    if (event.category === targetCategory) {
      count++;
      const shortTitle = shorten(event.title, 18);
      const desc = getCategoryDescription(event.category);
      console.log(`${count}. ${shortTitle} [${desc}]`);
    }
  }

  if (count === 0) {
    console.log(`Подій у категорії "${targetCategory}" не знайдено.`);
  } else {
    console.log(`Усього знайдено: ${count}`);
  }
}

// Виведення загального списку подій у консоль
console.log('\n--- Загальний список подій ---');
for (const event of events) {
  const shortTitle = shorten(event.title, 16);
  const desc = getCategoryDescription(event.category);
  console.log(`Подія: ${shortTitle} | Категорія: ${event.category} (${desc})`);
}

// Виклик функції фільтрації для кожної з доступних категорій
printEventsByCategory(events, 'concert');
printEventsByCategory(events, 'theatre');
printEventsByCategory(events, 'exhibition');

// Тестування роботи стрілкової функції shorten() на короткому та довгому рядках
console.log('\n--- Тестування стрілкової функції shorten() ---');
console.log(shorten('Симфонія', 10));
console.log(shorten('Шедеври класичної музики камерного оркестру', 15));
