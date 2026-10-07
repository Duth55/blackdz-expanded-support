# DBC: BlackDz VIP

Site oficial do **DBC: BlackDz VIP**, o sistema de assinaturas e benefícios do DBC: BlackDz Expanded, preparado para Vercel, Discord e PicPay.

## O que já vem pronto

- Landing page responsiva com identidade visual própria (sem depender de logo em imagem).
- Página de planos e checkout.
- Login OAuth2 com Discord.
- Área VIP do membro.
- Painel administrativo restrito ao Discord ID `1345387246282608751`.
- Integração com o servidor Discord `1519101675703369778`.
- Cargos configurados:
  - Apoiador: `1557153494467878962`
  - VIP: `1557153493339611157`
  - VIP+: `1557153489019215965`
- Banco PostgreSQL/Neon.
- Modo DEMO sem cobrança real.
- Integração de recorrência PicPay via token temporário de cartão.
- Cargo do Discord liberado somente após confirmação de uma cobrança válida.
- Webhook PicPay.
- Sincronização diária de assinatura/cargo via Vercel Cron.
- Concessão manual de assinatura pelo Admin.
- Termos e Política de Privacidade iniciais.

## Arquitetura

```text
Usuário
  -> Vercel / Next.js
      -> Discord OAuth2
      -> PostgreSQL (Neon)
      -> PicPay Recorrência
      -> Discord REST API (mesmo bot da BlackDz Community)
```

O bot pode continuar rodando normalmente na PhanomCloud. O site **não abre uma segunda conexão Gateway** com o Discord; ele usa somente chamadas REST para adicionar/remover cargos. Assim, o mesmo token do bot pode ficar configurado como segredo no servidor da Vercel sem iniciar outro cliente `discord.js`.

## 1. Rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra `http://localhost:3000`.

Comece com:

```env
PAYMENTS_MODE=demo
```

Assim você testa layout, login, banco e painel sem cobrar ninguém.

## 2. Banco gratuito

A opção recomendada é criar um PostgreSQL no Neon e copiar a connection string para:

```env
DATABASE_URL=postgresql://...
```

As tabelas são criadas automaticamente na primeira utilização. Os três planos também são inseridos automaticamente.

## 3. Discord OAuth

No Discord Developer Portal, use **a mesma aplicação do seu bot**.

Você precisará de:

```env
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=1519101675703369778
OWNER_DISCORD_ID=1345387246282608751
```

Adicione estas Redirect URLs na aplicação:

```text
http://localhost:3000/api/auth/discord/callback
https://SEU-PROJETO.vercel.app/api/auth/discord/callback
```

O cargo mais alto do bot precisa ficar **acima dos três cargos VIP** na hierarquia do servidor, e o bot precisa da permissão **Gerenciar Cargos**.

> Nunca coloque `DISCORD_BOT_TOKEN` ou `DISCORD_CLIENT_SECRET` em variáveis `NEXT_PUBLIC_*`.

## 4. Vercel

1. Suba esta pasta para um repositório GitHub.
2. Na Vercel, importe o repositório.
3. Adicione as variáveis do `.env.example` em **Settings -> Environment Variables**.
4. Defina `NEXT_PUBLIC_SITE_URL` com a URL real, por exemplo:

```env
NEXT_PUBLIC_SITE_URL=https://blackdzexpanded.vercel.app
```

5. Faça o deploy.
6. Volte ao Discord Developer Portal e cadastre a URL de callback da Vercel.

A URL exata `blackdzexpanded.vercel.app` só funcionará se esse nome estiver disponível na Vercel. Caso não esteja, use o endereço que a Vercel fornecer.

## 5. PicPay — primeiro use Sandbox

O código está preparado para o fluxo de recorrência do PicPay. Para ativá-lo você precisará das credenciais do Checkout fornecidas no Painel Lojista/Empresas e do token transparente do SDK.

Variáveis:

```env
PAYMENTS_MODE=picpay
PICPAY_ENV=sandbox
PICPAY_CLIENT_ID=
PICPAY_CLIENT_SECRET=
PICPAY_AUTH_URL=https://ecommerce-api.svcp.ppay.me/oauth2/token
PICPAY_RECURRENCY_BASE_URL=https://ecommerce-api.svcp.ppay.me/recurrency/sandbox/v1
PICPAY_WEBHOOK_TOKEN=
NEXT_PUBLIC_PICPAY_MERCHANT_CREDENTIAL=
NEXT_PUBLIC_PICPAY_TRANSPARENT_TOKEN=
PICPAY_TOTAL_BILLING_CYCLES=120
```

### Por que o cartão não passa pelo backend?

A tela usa o SDK de Checkout Transparente do PicPay. O navegador envia os dados de cartão ao SDK e recebe um `temporaryCardToken`. Apenas esse token temporário é enviado ao backend do site para criar a assinatura.

### Criar os três planos no PicPay

Depois de configurar Sandbox:

1. Entre com a conta Discord do dono.
2. Abra `/admin`.
3. Clique em **Criar planos faltantes no PicPay**.
4. Os IDs dos planos serão salvos no PostgreSQL.

## 6. Webhook PicPay

No Painel do PicPay, configure a URL de notificação:

```text
https://SEU-PROJETO.vercel.app/api/picpay/webhook
```

Depois copie o token de autenticação do webhook para:

```env
PICPAY_WEBHOOK_TOKEN=
```

O endpoint rejeita notificações sem o token correto e grava os eventos de forma idempotente. A criação da assinatura fica como **Pendente**; o cargo só é entregue depois que uma cobrança chega como confirmada pelo PicPay.

## 7. Sincronização diária

`vercel.json` registra uma chamada diária para:

```text
/api/cron/sync-subscriptions
```

Ela verifica assinaturas PicPay conhecidas, atualiza cobranças, remove cargos de assinaturas inativas e corrige cargos que estejam faltando.

Configure também:

```env
CRON_SECRET=uma-string-longa-e-aleatoria
```

## 8. Produção PicPay

Antes de mudar para produção:

- valide tudo no Sandbox;
- confirme no Painel PicPay as URLs de produção da sua operação;
- altere `PICPAY_ENV=production`;
- configure `PICPAY_AUTH_URL` e `PICPAY_RECURRENCY_BASE_URL` com os endereços de produção fornecidos;
- troque as credenciais Sandbox pelas credenciais reais;
- mantenha segredos somente no ambiente Server da Vercel.

Não use credenciais ou conta de outra pessoa sem autorização. O titular da operação precisa atender aos requisitos contratuais do PicPay.

## 9. Alterar preços

Os valores iniciais são:

- Apoiador: R$ 9,90/mês
- VIP: R$ 19,90/mês
- VIP+: R$ 39,90/mês

No `/admin`, é possível alterar os preços exibidos no site. Se o preço já tiver sido criado como plano no PicPay, crie/atualize o plano correspondente no provedor antes de cobrar novos assinantes.

## 10. Segurança

- `.env` e `.env.local` estão no `.gitignore`.
- Sessão do site usa cookie `HttpOnly`, `SameSite=Lax` e assinatura HMAC.
- OAuth usa `state` anti-CSRF.
- O painel Admin é bloqueado por Discord ID.
- Token do bot, client secret do Discord e credenciais privadas do PicPay ficam somente no backend.
- O site não salva número completo do cartão nem CVV.
- Webhook PicPay exige token de autenticação.

## Observação sobre o ZIP do bot

O arquivo do bot enviado para análise continha um `.env`. Este projeto **não copiou nem leu os valores** desse arquivo. Se o `.env` enviado tinha um token real do bot, gere um novo token no Discord Developer Portal e atualize a PhanomCloud/Vercel.
