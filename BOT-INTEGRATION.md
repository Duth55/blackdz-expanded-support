# Integração com o BlackDz Community Bot

O site publica cada pedido V.I.P no Discord usando o token do mesmo bot. Os botões da mensagem são recebidos pelo bot via `interactionCreate`.

## Site (Vercel)

```env
VIP_REVIEW_SECRET=SEGREDO_GRANDE
VIP_REVIEW_CHANNEL_ID=ID_DO_CANAL_DA_STAFF
DISCORD_VIP_ROLE_ID=ID_DO_CARGO_VIP
```

## Bot (PhanomCloud)

```env
VIP_SITE_URL=https://SEU-SITE.vercel.app
VIP_REVIEW_SECRET=O_MESMO_SEGREDO_GRANDE
```

O bot não acessa o Neon diretamente. Ao clicar em **Confirmar pagamento** ou **Recusar**, ele chama o endpoint interno do site usando o segredo compartilhado. O site valida novamente se o usuário da staff está autorizado, atualiza o banco e concede o cargo.
