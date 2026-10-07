# Integração com o BlackDz Community Bot V2.2.1

O bot atual já possui a categoria/cargos de membros VIP e perfis de permissões para esses cargos. Por isso, **não é necessário reescrever o bot para o site funcionar**.

O site usa o mesmo bot apenas através da Discord REST API para:

- adicionar o cargo do plano;
- remover cargos antigos ao trocar/cancelar;
- corrigir cargos na sincronização automática.

## Ajuste opcional no bot: botão Site

No seu `src/index.js` atual existe um valor padrão antigo para o site. Você pode trocar:

```js
d.mod.websiteUrl ??= 'https://dbc-blackdz-expanded.netlify.app';
```

por:

```js
d.mod.websiteUrl ??= process.env.WEBSITE_URL || 'https://blackdzexpanded.vercel.app';
```

E adicionar no `.env.example` do bot:

```env
WEBSITE_URL=https://blackdzexpanded.vercel.app
```

Se a Vercel fornecer outro endereço, use o endereço real.

## Importante sobre cargos

O cargo do bot precisa estar acima de:

```text
👑 VIP+          1557153489019215965
🌟 VIP           1557153493339611157
💎 Apoiador       1557153494467878962
```

Caso contrário a API do Discord devolverá erro ao tentar adicionar/remover os cargos.
