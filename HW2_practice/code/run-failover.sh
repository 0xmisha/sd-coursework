#!/bin/bash
LOG=/tmp/postgres-ha-experiments.log
TG_LOG=/tmp/tg.log
> "$LOG"

snap() {
    echo "" >> "$LOG"
    echo "===== $1 =====" >> "$LOG"
    echo "## patronictl list:" >> "$LOG"
    docker exec demo-patroni1 patronictl list 2>&1 >> "$LOG" || docker exec demo-patroni2 patronictl list 2>&1 >> "$LOG" || true
    echo "" >> "$LOG"
    echo "## last 8 lines of traffic-generator:" >> "$LOG"
    tail -n 8 "$TG_LOG" >> "$LOG" 2>/dev/null || echo "(no tg log)" >> "$LOG"
}

snap "0. Baseline"

# Experiment 1: kill leader
LEADER=$(docker exec demo-patroni1 patronictl list 2>/dev/null | grep "Leader" | awk '{print $2}')
echo "Leader is $LEADER. Stopping..." >> "$LOG"
docker stop "demo-$LEADER" >/dev/null
sleep 10
snap "1. After stopping leader $LEADER"

# Experiment 2: start it back
docker start "demo-$LEADER" >/dev/null
sleep 10
snap "2. After restarting old leader $LEADER"

# Experiment 3: kill one etcd
docker stop demo-etcd1 >/dev/null
sleep 5
snap "3. After stopping demo-etcd1 (one of three)"

# Experiment 4: kill second etcd (quorum lost)
docker stop demo-etcd2 >/dev/null
sleep 8
snap "4. After stopping demo-etcd2 (quorum 1/3, cluster freezes)"

# Experiment 5: restore etcd
docker start demo-etcd1 demo-etcd2 >/dev/null
sleep 10
snap "5. After restoring demo-etcd1 and demo-etcd2"

# Experiment 6: kill haproxy
docker stop demo-haproxy >/dev/null
sleep 6
snap "6. After stopping demo-haproxy (app cannot connect)"

# Experiment 7: restore haproxy
docker start demo-haproxy >/dev/null
sleep 8
snap "7. After restoring demo-haproxy"

echo "" >> "$LOG"
echo "DONE" >> "$LOG"
