console.log('js/app.js підключено');

const events = [
  { title: 'Симфонічний вечір', category: 'concert' },
  { title: 'Виставка мистецтва', category: 'exhibition' },
  { title: 'Драматична вистава', category: 'theatre' },
  { title: 'Органний концерт класичної музики', category: 'concert' },
  { title: 'Виставка просторових інсталяцій', category: 'exhibition' },
  { title: 'Комедійна театральна постановка', category: 'theatre' }
];

const shorten = (text, n) => (text.length > n ? text.slice(0, n) + '...' : text);

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

console.log('\n--- Загальний список подій ---');
for (const event of events) {
  const shortTitle = shorten(event.title, 16);
  const desc = getCategoryDescription(event.category);
  console.log(`Подія: ${shortTitle} | Категорія: ${event.category} (${desc})`);
}

printEventsByCategory(events, 'concert');
printEventsByCategory(events, 'theatre');
printEventsByCategory(events, 'exhibition');

console.log('\n--- Тестування стрілкової функції shorten() ---');
console.log(shorten('Симфонія', 10));
console.log(shorten('Шедеври класичної музики камерного оркестру', 15));