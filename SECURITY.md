# Segurança — DBC: BlackDz VIP Manual

- Nunca envie `.env`, token do Discord, Client Secret ou `VIP_REVIEW_SECRET` para o GitHub.
- O site não processa cartão e não solicita senha bancária, CVV ou códigos de autenticação.
- Comprovantes são encaminhados ao canal privado da staff no Discord; instrua compradores a ocultar dados desnecessários.
- Um comprovante pode ser adulterado. A staff deve conferir a entrada real do pagamento na conta/carteira antes de aprovar.
- O endpoint interno de revisão exige `VIP_REVIEW_SECRET` e valida o usuário da staff no Discord.
- O cargo do bot deve ficar acima do cargo V.I.P e o bot deve ter `Gerenciar Cargos`.
- O dono do site continua restrito ao Discord ID configurado em `OWNER_DISCORD_ID`.
