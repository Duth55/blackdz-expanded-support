# DBC: BlackDz VIP — Pagamento Manual v3

Site do **DBC: BlackDz VIP** preparado para Vercel + Neon + Discord, sem checkout automático.

## Fluxo

1. Usuário entra com Discord.
2. Abre `/checkout/vip` e vê o método/chave de pagamento configurados.
3. Efetua o pagamento fora do site.
4. Informa o nome do titular que pagou, banco/carteira opcional, observação e comprovante opcional.
5. O pedido é salvo no Neon e publicado pelo BlackDz Community Bot no canal privado de análise.
6. A staff usa **Confirmar pagamento** ou **Recusar** no Discord.
7. Ao confirmar, o site adiciona o cargo **V.I.P - DBC: BlackDz Expanded** automaticamente.
8. O comprador recebe DM quando possível e acompanha o status na Área V.I.P.

## Segurança importante

- O site **não processa cartão** e não pede senha bancária, CVV ou códigos de autenticação.
- O comprovante é opcional e vai para o canal privado da staff no Discord; ele não é armazenado como arquivo permanente na Vercel.
- A aprovação deve ser feita conferindo o recebimento real na conta/carteira. Um comprovante pode ser adulterado e não deve ser a única prova.
- O usuário só consegue ter um pedido pendente por vez.
- Se a conta já tem o cargo V.I.P, um novo pedido é bloqueado.
- Só o dono e cargos de staff configurados podem aprovar/recusar pelo bot.
- O endpoint usado pelo bot exige `VIP_REVIEW_SECRET`.

## Vercel

Copie `.env.example` para referência e configure as variáveis no projeto da Vercel. As principais são:

```env
NEXT_PUBLIC_SITE_URL=https://SEU-SITE.vercel.app
SESSION_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=1519101675703369778
OWNER_DISCORD_ID=1345387246282608751
DISCORD_VIP_ROLE_ID=1557153493339611157
VIP_REVIEW_CHANNEL_ID=1552417366976102420
DATABASE_URL=
VIP_PRICE_CENTS=1990
PAYMENT_METHOD_LABEL=PIX
PAYMENT_PIX_KEY=
PAYMENT_RECEIVER_LABEL=DBC: BlackDz Expanded
VIP_REVIEW_SECRET=
```

No Discord Developer Portal, o Redirect URI continua:

```text
https://SEU-SITE.vercel.app/api/auth/discord/callback
```

## Bot na PhanomCloud

Use o bot atualizado entregue junto com este site. Na PhanomCloud adicione:

```env
VIP_SITE_URL=https://SEU-SITE.vercel.app
VIP_REVIEW_SECRET=O_MESMO_VALOR_DA_VERCEL
```

O botão **Confirmar pagamento** chama o site, o site confere a permissão da staff, muda o pedido para aprovado e concede o cargo. O botão **Recusar** abre um modal para informar o motivo.

## Cargo do bot

O cargo do BlackDz Community Bot precisa ficar acima de **V.I.P - DBC: BlackDz Expanded** e ter **Gerenciar Cargos**.

## Canal de pedidos

O código usa por padrão o canal `1552417366976102420` porque ele já existia como log administrativo no bot enviado. O ideal é criar um canal privado, por exemplo `💳・pedidos-vip`, copiar o ID e colocar em `VIP_REVIEW_CHANNEL_ID` na Vercel.

## Preço

O valor inicial está em `1990` centavos = **R$ 19,90**. Para mudar, edite `VIP_PRICE_CENTS` na Vercel e faça Redeploy.

## Observação sobre PIX

Este sistema só organiza e verifica manualmente o pedido. Ele não muda os dados que o banco/PIX mostra ao pagador. Se a chave for de pessoa física, o provedor de pagamento pode exibir o nome legal do titular antes da confirmação.
