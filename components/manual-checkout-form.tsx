"use client";

import { useState } from "react";

export function ManualCheckoutForm(props: {
  priceLabel: string;
  paymentMethod: string;
  pixKey: string;
  receiverLabel: string;
  defaultPayerName?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function copyPix() {
    if (!props.pixKey) return;
    await navigator.clipboard.writeText(props.pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/orders", { method: "POST", body: form, credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        window.location.href = "/api/auth/discord/start?returnTo=/checkout/vip";
        return;
      }
      if (!response.ok) throw new Error(data.error || "Não foi possível enviar o pedido.");
      window.location.href = `/pedido/${encodeURIComponent(data.orderId)}`;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="checkout-form manual-form" onSubmit={submit} encType="multipart/form-data">
      <div className="checkout-heading">
        <div><span>Produto</span><strong>V.I.P - DBC: BlackDz Expanded</strong></div>
        <div><span>Valor</span><strong>{props.priceLabel}</strong></div>
      </div>

      <div className="manual-step">
        <span className="step-badge">1</span>
        <div>
          <h3>Efetue o pagamento</h3>
          <p>Faça o pagamento pelo método abaixo. O sistema <strong>não aprova automaticamente</strong>: a staff vai conferir o recebimento antes de liberar o cargo.</p>
        </div>
      </div>

      <div className="payment-box">
        <div><span>Método</span><strong>{props.paymentMethod}</strong></div>
        <div><span>Recebedor</span><strong>{props.receiverLabel}</strong></div>
        {props.pixKey ? (
          <div className="pix-key-row">
            <div><span>Chave PIX</span><code>{props.pixKey}</code></div>
            <button type="button" className="btn btn-secondary btn-small" onClick={copyPix}>{copied ? "Copiado ✓" : "Copiar chave"}</button>
          </div>
        ) : (
          <div className="notice warning"><strong>Pagamento ainda não configurado.</strong><p>A staff precisa adicionar a chave/método de pagamento na configuração do site.</p></div>
        )}
      </div>

      <div className="manual-step">
        <span className="step-badge">2</span>
        <div>
          <h3>Envie os dados para conferência</h3>
          <p>Use exatamente o nome do titular que aparece no pagamento para facilitar a conferência da staff.</p>
        </div>
      </div>

      <div className="form-grid">
        <label className="span-2">Nome do titular da conta que efetuou o pagamento
          <input name="payerName" defaultValue={props.defaultPayerName || ""} required maxLength={120} autoComplete="name" placeholder="Ex.: João da Silva" />
        </label>
        <label className="span-2">Banco / carteira usada <span className="optional">(opcional)</span>
          <input name="paymentSource" maxLength={80} placeholder="Ex.: PicPay, Nubank, Mercado Pago..." />
        </label>
        <label className="span-2">Comprovante <span className="optional">(recomendado)</span>
          <input name="proof" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" />
          <small>PNG, JPG, WEBP ou PDF, até 3 MB. Oculte saldo, CPF e outras informações que não sejam necessárias.</small>
        </label>
        <label className="span-2">Observação <span className="optional">(opcional)</span>
          <textarea name="note" rows={4} maxLength={500} placeholder="Ex.: pagamento feito às 18:32, nome diferente no Discord..." />
        </label>
      </div>

      <label className="check-row consent-row">
        <input type="checkbox" name="confirmedPayment" value="yes" required />
        <span>Confirmo que já efetuei o pagamento e que as informações acima são verdadeiras.</span>
      </label>

      <div className="notice info">
        <strong>Como funciona a análise?</strong>
        <p>Seu pedido será enviado para um canal privado da staff. Eles conferem o recebimento real e podem <strong>Confirmar</strong> ou <strong>Recusar</strong>. O comprovante, sozinho, não garante aprovação.</p>
      </div>

      {message && <div className="notice error">{message}</div>}
      <button className="btn btn-primary btn-wide" disabled={loading || !props.pixKey}>
        {loading ? "Enviando pedido..." : "Enviar para análise da staff"}
      </button>
      <small className="checkout-legal">Não envie senha, código de autenticação, CPF completo ou dados bancários desnecessários.</small>
    </form>
  );
}
