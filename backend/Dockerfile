# Two stages: one with a Go toolchain, one with almost nothing.
#
# What ships is a statically linked binary in a scratch image — no shell, no
# package manager, no libc. That is a security decision more than a size one:
# an attacker who reaches code execution in a container with a shell has a
# machine, and in this one has a process.

FROM golang:1.26-alpine AS build

WORKDIR /src

# Dependencies first, in their own layer. They change far less often than the
# code does, so an edit to a handler does not re-download the module cache.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# CGO off is what makes the binary static and therefore runnable on scratch.
# The linker flags drop the symbol table and DWARF data, which are of no use in
# production and are a map of the program to anybody who pulls the image.
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /flex ./cmd/api

FROM scratch

# Certificate authorities, so the process can make outbound HTTPS calls — the
# mail provider, Telegram, the payment gateways. Without these every TLS
# handshake fails with an unhelpful "certificate signed by unknown authority".
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
# Zone data, so a timestamp can be rendered in Asia/Tashkent. scratch has none,
# and Go falls back to UTC silently.
COPY --from=build /usr/share/zoneinfo /usr/share/zoneinfo

COPY --from=build /flex /flex

# Not root. There is no /etc/passwd here to name a user in, so the id is given
# directly — the same one Docker's convention reserves for an unprivileged app.
USER 65532:65532

EXPOSE 8090
ENTRYPOINT ["/flex"]
