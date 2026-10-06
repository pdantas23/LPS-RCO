# ---------- build ----------
FROM node:22-slim AS build
WORKDIR /app

# As VITE_* são embutidas NO BUILD (não em runtime): no Easypanel entram como
# build args. Sem elas o formulário sai sem URL/chave e nenhum envio funciona.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN test -n "$VITE_SUPABASE_URL" && test -n "$VITE_SUPABASE_ANON_KEY" \
    || (echo "Faltam os build args VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY" && exit 1)

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- runtime ----------
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
