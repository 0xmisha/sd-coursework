const puppeteer = require('/usr/local/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer');
const fs = require('fs');

const GRAFANA = 'http://postgres-ha-grafana-1:3000';
const DASH_UID = '_8u7_SbDz';
const OUT_DIR = '/work/postgres-ha-shots';
const BASIC = 'Basic ' + Buffer.from('admin:admin').toString('base64');

fs.mkdirSync(OUT_DIR, { recursive: true });

async function shot(page, url, file, opts = {}) {
  const w = opts.w || 1600;
  const h = opts.h || 1100;
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 6000));
  await page.screenshot({ path: `${OUT_DIR}/${file}`, fullPage: !!opts.full });
  console.log('saved', file);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ Authorization: BASIC });

  await shot(
    page,
    `${GRAFANA}/d/${DASH_UID}/patroni-cluster-hw2?orgId=1&from=now-30m&to=now&refresh=&kiosk=tv`,
    '01-overview-30m.png',
    { w: 1600, h: 1400, full: true }
  );

  await shot(
    page,
    `${GRAFANA}/d-solo/${DASH_UID}/patroni-cluster-hw2?orgId=1&from=now-30m&to=now&panelId=5`,
    '02-primary-replica-timeline.png',
    { w: 1600, h: 600 }
  );

  await shot(
    page,
    `${GRAFANA}/d-solo/${DASH_UID}/patroni-cluster-hw2?orgId=1&from=now-30m&to=now&panelId=6`,
    '03-timeline-jumps.png',
    { w: 1600, h: 600 }
  );

  await shot(
    page,
    `${GRAFANA}/d-solo/${DASH_UID}/patroni-cluster-hw2?orgId=1&from=now-30m&to=now&panelId=8`,
    '04-pg-up.png',
    { w: 1600, h: 600 }
  );

  await shot(
    page,
    `${GRAFANA}/d-solo/${DASH_UID}/patroni-cluster-hw2?orgId=1&from=now-30m&to=now&panelId=9`,
    '05-tps.png',
    { w: 1600, h: 600 }
  );

  await shot(
    page,
    `${GRAFANA}/d-solo/${DASH_UID}/patroni-cluster-hw2?orgId=1&from=now-30m&to=now&panelId=7`,
    '06-dcs-wal-lag.png',
    { w: 1600, h: 600 }
  );

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
