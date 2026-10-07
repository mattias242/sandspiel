# Builds the wasm crate and the webpack bundle, then serves dist/ with nginx.
FROM node:22-bookworm AS node

FROM rust:1-bookworm AS build
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
COPY --from=node /usr/local /usr/local
RUN rustup target add wasm32-unknown-unknown
RUN cargo install wasm-pack --locked
# wasm-opt for wasm-pack, from npm rather than a GitHub release download.
RUN npm install -g pnpm@10 binaryen@117

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# Hoisted, because the babel runtime transform needs @babel/runtime, which
# is only present as a transitive dependency.
RUN pnpm install --frozen-lockfile --config.node-linker=hoisted
COPY . .
RUN pnpm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
