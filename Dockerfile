# Imagem ÚNICA das LPs (lp.rcohub.com.br): formulário (/), /lp01, /lp02, /lp-ecom.
# Um processo só: o app Next serve as rotas dele e o build estático do formulário (public/_form).
# Contexto de build = raiz do monorepo.
#
# EasyPanel repassa TODA variável como build-arg. Aqui só as duas do formulário são declaradas
# (a chave é a ANÔNIMA do Supabase, pública por natureza). COMERCIAL_BASE_URL e os tokens
# COMERCIAL_LEAD_TOKEN_* NUNCA entram como ARG: são variáveis de runtime, lidas pelo servidor.

# ---------- 1. formulário (Vite, projeto do Aerton) ----------
FROM node:22-slim AS form
WORKDIR /app/formulario
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    FORM_BASE=/_form/
RUN test -n "$VITE_SUPABASE_URL" && test -n "$VITE_SUPABASE_ANON_KEY" \
    || (echo "Faltam os build args VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (formulario)" && exit 1)
COPY formulario/package*.json ./
RUN npm ci --no-audit --no-fund
COPY formulario/ ./
RUN npm run build

# ---------- 2. app Next ----------
FROM node:22-slim AS web
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY packages/ packages/
RUN npm ci --no-audit --no-fund
COPY apps/web/ apps/web/
COPY --from=form /app/formulario/dist apps/web/public/_form
RUN npm run build -w @rco/web

# ---------- 3. runtime ----------
FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    LEAD_OUTBOX_DIR=/data/outbox
COPY --from=web /app/apps/web/.next/standalone ./
COPY --from=web /app/apps/web/.next/static apps/web/.next/static
COPY --from=web /app/apps/web/public apps/web/public
# /data = volume persistente da fila de leads (sem ele, reinício apaga lead pendente).
RUN mkdir -p /data/outbox && chown -R node:node /data
VOLUME ["/data"]
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
