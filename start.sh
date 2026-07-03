#!/bin/bash
# 启动 PostgreSQL（如果没运行）
if ! pg_lsclusters | grep -q "online"; then
  service postgresql start 2>/dev/null || pg_ctlcluster 16 main start 2>/dev/null
  sleep 2
fi

# 等待 PostgreSQL 就绪
for i in $(seq 1 10); do
  if su postgres -c "psql -c '\q'" 2>/dev/null; then
    break
  fi
  sleep 1
done

# 启动 Next.js
exec npx next start -p 8000 -H 0.0.0.0
