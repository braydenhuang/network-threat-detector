FROM caddy:2.10.2

# Create our Caddyfile configuration inside the image for a reverse proxy
RUN mkdir -p /etc/caddy && cat > /etc/caddy/Caddyfile <<'CADDYFILE'
:80 {
    @api {
        path /api*
    }
    handle @api {
        uri strip_prefix /api
        reverse_proxy api:5000
    }
    reverse_proxy ui:3000
}
CADDYFILE

