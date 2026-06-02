// Сценарий "Волна": плавное нарастание нагрузки.
// 0 → 500 VU за 2 минуты, плато 1 минута, спуск 1 минута.
// Что проверяем: на каком уровне VU деградирует latency,
// в какой момент срабатывает порог по ошибкам, успевает ли БД-пул "догонять" рост.

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    wave: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 500 },
        { duration: '1m', target: 500 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1500'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:8080';

export function setup() {
  for (let i = 1; i <= 5; i++) {
    http.post(
      `${BASE}/api/users`,
      JSON.stringify({ name: `wave-user-${i}`, email: `wave-${i}-${Date.now()}@example.com` }),
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
      description: 'wave',
    });
    const res = http.post(`${BASE}/api/orders`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, { 'order created': (r) => r.status === 200 || r.status === 201 });
  } else {
    const res = http.get(`${BASE}/api/orders`);
    check(res, { 'list ok': (r) => r.status === 200 });
  }
  sleep(0.1);
}
