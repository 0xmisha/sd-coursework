// Сценарий "Пульсация" (своя модификация).
//
// Суть: серия из трёх коротких импульсов нагрузки с окнами тишины между ними.
// Это типичный паттерн "флешмоб-трафика": рассылка пуша, выход новости, батч-джоба.
//
// Чем отличается от Шторма и Волны:
// 1. Шторм даёт один резкий пик и смотрит, выдерживает ли система.
// 2. Волна даёт плавный рост и ищет точку деградации.
// 3. Пульсация повторяет один и тот же пик 3 раза и смотрит,
//    возвращается ли система в исходное состояние МЕЖДУ импульсами.
//    Если каждый следующий пик заметно "хуже" предыдущего (выше p95, длиннее хвост),
//    значит есть утечка ресурсов: соединения не освобождаются,
//    кэши не сбрасываются, growing память и т.п.
//
// Дополнительно — нагрузка смещена в сторону записей и апдейтов:
// 50% POST /api/orders, 30% PUT /api/orders/{id} (обновляем горячий диапазон id),
// 20% GET /api/orders. PUT даёт row-lock contention на стороне Postgres —
// будет интересно посмотреть db_pool_wait_count_total и dbQueryDuration по запросам.

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    pulse: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        // Импульс 1
        { duration: '5s',  target: 600 },
        { duration: '25s', target: 600 },
        { duration: '5s',  target: 0 },
        // Окно тишины — здесь смотрим, как падает RPS, latency, инфлайт
        { duration: '30s', target: 0 },
        // Импульс 2
        { duration: '5s',  target: 600 },
        { duration: '25s', target: 600 },
        { duration: '5s',  target: 0 },
        { duration: '30s', target: 0 },
        // Импульс 3
        { duration: '5s',  target: 600 },
        { duration: '25s', target: 600 },
        { duration: '5s',  target: 0 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.10'],
    http_req_duration: ['p(95)<2000'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:8080';

export function setup() {
  for (let i = 1; i <= 5; i++) {
    http.post(
      `${BASE}/api/users`,
      JSON.stringify({ name: `pulse-user-${i}`, email: `pulse-${i}-${Date.now()}@example.com` }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }
  for (let i = 0; i < 50; i++) {
    http.post(
      `${BASE}/api/orders`,
      JSON.stringify({ user_id: 1, amount: 1.0, description: 'seed' }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function () {
  const r = Math.random();
  if (r < 0.5) {
    const payload = JSON.stringify({
      user_id: randomInt(1, 5),
      amount: Math.random() * 100,
      description: 'pulse',
    });
    const res = http.post(`${BASE}/api/orders`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, { 'order created': (r) => r.status === 200 || r.status === 201 });
  } else if (r < 0.8) {
    const id = randomInt(1, 50);
    const payload = JSON.stringify({
      user_id: randomInt(1, 5),
      amount: Math.random() * 100,
      description: 'pulse-update',
    });
    const res = http.put(`${BASE}/api/orders/${id}`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, { 'updated': (r) => r.status === 204 });
  } else {
    const res = http.get(`${BASE}/api/orders`);
    check(res, { 'list ok': (r) => r.status === 200 });
  }
  sleep(0.05);
}
