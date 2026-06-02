# МАИ. Системный дизайн (Савельев). Сабмишены ДЗ

Четыре отчёта, парами теория + практика.

## HW1

### Теория. Архитектурная ката

Прохождение каты «You Look Good In Print» (онлайн-окружение «всё-в-одном» для сети копи-центров) по шести разделам этапа сбора и анализа требований: отсев, scope refinement, ФТ, НФТ, ограничения, расчёт нагрузки. С учётом допущений по России 2026 и сертификации ФСТЭК (УЗ-2).

Отчёт: [HW1_theory.md](HW1_theory.md)

### Практика. Нагрузочное тестирование demo-app-1

Три k6-сценария (Шторм, Волна, своя модификация Пульсация) против стека Go + Nginx + Postgres + Prometheus / Grafana. Найдено корневое узкое место: nginx не использует keepalive в апстриме и сжигает эфемерные порты, поэтому 70%+ запросов падают на TCP-уровне ещё до того, как доходят до backend.

Отчёт: [HW1_practice/HW1_practice.md](HW1_practice/HW1_practice.md). Исходники в [HW1_practice/code/](HW1_practice/code/): доработанный `main.go` (добавлены метрики `http_requests_in_flight`, `db_pool_*`, лейбл `query` и нормализация `path`), три k6-скрипта.

## HW2

### Теория. HLD

High-level design для того же кейса. Часть 1: декомпозиция на 11 сервисов с обоснованием способов взаимодействия (sync gRPC / async Kafka / WebSocket). Часть 2: подбор БД (PostgreSQL + Redis + S3 + ClickHouse + Kafka) с репликацией и шардингом. Часть 3: обвязка из MUST и SHOULD-компонентов (API Gateway, LB, CDN, WAF, IdP, HSM, SIEM, observability и т.д.). Три C4-диаграммы в PNG.

Отчёт: [HW2_theory/HW2_theory.md](HW2_theory/HW2_theory.md). Исходники mermaid-диаграмм в [HW2_theory/diagrams_src/](HW2_theory/diagrams_src/), отрендеренные PNG в [HW2_theory/diagrams/](HW2_theory/diagrams/).

### Практика. PostgreSQL HA на Patroni

Кластер из 3 PostgreSQL под Patroni + 3 etcd + HAProxy. Семь failover-сценариев (падение лидера, реплики, etcd-узлов, потеря кворума, падение HAProxy) с фиксацией состояния через `patronictl list` и поведения `traffic-generator.py`. Скриншоты сняты с собственного Grafana-дашборда под реальные метрики экспортеров.

Отчёт: [HW2_practice/HW2_practice.md](HW2_practice/HW2_practice.md). Артефакты в [HW2_practice/code/](HW2_practice/code/): `init.sql`, скрипт прогона failover-сценариев, JSON кастомного дашборда, puppeteer-скрипт для снятия скриншотов.
