// Сценарий "Шторм": резкий пик нагрузки.
// 1000 VU за 10 секунд, удержание 30 секунд, потом 30 секунд на восстановление.
// Что проверяем: успевает ли система держать "стенку" из подключений,
// не разваливается ли БД-пул, как восстанавливается latency после спада.

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    storm: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 1000 },
        { duration: '30s', target: 1000 },
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
      JSON.stringify({ name: `storm-user-${i}`, email: `storm-${i}-${Date.now()}@example.com` }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function () {
  if (Math.random() < 0.8) {
    const payload = JSON.stringify({
      user_id: randomInt(1, 5),
      amount: Math.random() * 100,
      description: 'storm',
    });
    const res = http.post(`${BASE}/api/orders`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, { 'order created': (r) => r.status === 200 || r.status === 201 });
  } else {
    const res = http.get(`${BASE}/api/orders`);
    check(res, { 'list ok': (r) => r.status === 200 });
  }
  sleep(0.05);
}
