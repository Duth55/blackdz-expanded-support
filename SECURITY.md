# Segurança

## Segredos que nunca devem ir para o GitHub

- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_SECRET`
- `SESSION_SECRET`
- `DATABASE_URL`
- `PICPAY_CLIENT_SECRET`
- `PICPAY_WEBHOOK_TOKEN`
- `CRON_SECRET`

Use Environment Variables da Vercel.

## Variáveis públicas do PicPay

`NEXT_PUBLIC_PICPAY_MERCHANT_CREDENTIAL` e `NEXT_PUBLIC_PICPAY_TRANSPARENT_TOKEN` existem no navegador porque o SDK oficial de tokenização precisa delas. Não reutilize essa regra para nenhum outro segredo.

## Cartões

O backend não deve receber `cardNumber` ou `cvv`. O componente de checkout chama o SDK do PicPay no navegador e envia ao backend apenas `temporaryCardToken`.
