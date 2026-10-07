"use client";

import { useEffect, useMemo, useState } from "react";

declare global {
  interface Window {
    CheckoutTransparent?: {
      setCredentials: (input: { merchantCredential: string; transparentToken: string }) => void;
      getCardBrand: (input: { bin: string; success: (body: { brand: string }) => void; error: (body: any) => void }) => void;
      createTemporaryCard: (input: { card: any; success: (body: { temporaryToken: string }) => void; error: (body: any) => void }) => void;
    };
  }
}

type Props = {
  planSlug: string;
  planName: string;
  priceLabel: string;
  paymentsMode: string;
  configured: boolean;
  defaultEmail?: string | null;
  defaultName?: string | null;
};

export function CheckoutForm(props: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  const merchantCredential = process.env.NEXT_PUBLIC_PICPAY_MERCHANT_CREDENTIAL || "";
  const transparentToken = process.env.NEXT_PUBLIC_PICPAY_TRANSPARENT_TOKEN || "";

  useEffect(() => {
    if (props.paymentsMode !== "picpay" || !merchantCredential || !transparentToken) return;
    const existing = document.querySelector<HTMLScriptElement>('script[data-picpay-sdk="1"]');
    const ready = () => {
      if (window.CheckoutTransparent) {
        window.CheckoutTransparent.setCredentials({ merchantCredential, transparentToken });
        setSdkReady(true);
      }
    };
    if (existing) {
      ready();
      existing.addEventListener("load", ready);
      return () => existing.removeEventListener("load", ready);
    }
    const script = document.createElement("script");
    script.src = "https://checkout.picpay.com/cdn/pp-transparent-v1.0.0.js";
    script.async = true;
    script.dataset.picpaySdk = "1";
    script.addEventListener("load", ready);
    script.addEventListener("error", () => setMessage("Não foi possível carregar o checkout seguro do PicPay."));
    document.head.appendChild(script);
    return () => script.removeEventListener("load", ready);
  }, [merchantCredential, transparentToken, props.paymentsMode]);

  const canPay = useMemo(() => props.paymentsMode === "demo" || (props.configured && sdkReady), [props, sdkReady]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);

    try {
      if (props.paymentsMode === "demo") {
        const response = await fetch("/api/demo/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planSlug: props.planSlug }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Falha no modo de teste.");
        window.location.href = "/dashboard?demo=1";
        return;
      }

      if (!window.CheckoutTransparent) throw new Error("SDK do PicPay ainda não está pronto.");
      const number = String(form.get("cardNumber") || "").replace(/\D/g, "");
      const bin = number.slice(0, 6);
      if (bin.length !== 6) throw new Error("Número do cartão inválido.");

      const brand = await new Promise<string>((resolve, reject) => {
        window.CheckoutTransparent!.getCardBrand({
          bin,
          success: (body) => resolve(body.brand),
          error: (body) => reject(new Error(body?.errors?.[0]?.message || "Não foi possível identificar a bandeira.")),
        });
      });

      const temporaryCardToken = await new Promise<string>((resolve, reject) => {
        window.CheckoutTransparent!.createTemporaryCard({
          card: {
            brand,
            number,
            holderName: String(form.get("cardholderName") || ""),
            holderDocument: String(form.get("cardholderDocument") || "").replace(/\D/g, ""),
            expirationMonth: String(form.get("expirationMonth") || ""),
            expirationYear: String(form.get("expirationYear") || ""),
            cvv: String(form.get("cvv") || ""),
          },
          success: (body) => resolve(body.temporaryToken),
          error: (body) => reject(new Error(body?.errors?.[0]?.message || "O PicPay recusou a tokenização do cartão.")),
        });
      });

      const response = await fetch("/api/picpay/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: props.planSlug,
          temporaryCardToken,
          customer: {
            name: String(form.get("name") || ""),
            email: String(form.get("email") || ""),
            documentType: "CPF",
            document: String(form.get("document") || "").replace(/\D/g, ""),
            phone: {
              countryCode: "55",
              areaCode: String(form.get("areaCode") || "").replace(/\D/g, ""),
              number: String(form.get("phone") || "").replace(/\D/g, ""),
              type: "MOBILE",
            },
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível criar a assinatura.");
      window.location.href = "/dashboard?success=1";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (props.paymentsMode === "picpay" && !props.configured) {
    return (
      <div className="notice warning">
        <strong>PicPay ainda não configurado.</strong>
        <p>O site está pronto, mas as credenciais comerciais do PicPay precisam ser adicionadas na Vercel antes de cobrar pagamentos reais.</p>
      </div>
    );
  }

  return (
    <form className="checkout-form" onSubmit={onSubmit}>
      <div className="checkout-heading">
        <div><span>Plano</span><strong>{props.planName}</strong></div>
        <div><span>Total recorrente</span><strong>{props.priceLabel}/mês</strong></div>
      </div>

      {props.paymentsMode === "demo" ? (
        <div className="notice info">
          <strong>Modo de teste ativo</strong>
          <p>Nenhum valor será cobrado. O teste cria uma assinatura DEMO no banco e, por segurança, não entrega cargo automaticamente.</p>
        </div>
      ) : (
        <>
          <h3>Seus dados</h3>
          <div className="form-grid">
            <label>Nome completo<input name="name" defaultValue={props.defaultName || ""} required autoComplete="name" /></label>
            <label>E-mail<input name="email" type="email" defaultValue={props.defaultEmail || ""} required autoComplete="email" /></label>
            <label>CPF<input name="document" inputMode="numeric" required placeholder="Somente números" /></label>
            <div className="phone-grid">
              <label>DDD<input name="areaCode" inputMode="numeric" required maxLength={2} /></label>
              <label>Celular<input name="phone" inputMode="numeric" required /></label>
            </div>
          </div>

          <h3>Cartão</h3>
          <p className="security-copy">Os dados do cartão são enviados pelo SDK oficial diretamente ao PicPay e o servidor recebe apenas um token temporário.</p>
          <div className="form-grid">
            <label className="span-2">Número do cartão<input name="cardNumber" inputMode="numeric" autoComplete="cc-number" required /></label>
            <label className="span-2">Nome no cartão<input name="cardholderName" autoComplete="cc-name" required /></label>
            <label className="span-2">CPF do titular<input name="cardholderDocument" inputMode="numeric" required /></label>
            <label>Mês<input name="expirationMonth" inputMode="numeric" autoComplete="cc-exp-month" placeholder="MM" required /></label>
            <label>Ano<input name="expirationYear" inputMode="numeric" autoComplete="cc-exp-year" placeholder="AAAA" required /></label>
            <label>CVV<input name="cvv" inputMode="numeric" autoComplete="cc-csc" required /></label>
          </div>
        </>
      )}

      {message && <div className="notice error">{message}</div>}
      <button className="btn btn-primary btn-wide" disabled={loading || !canPay}>
        {loading ? "Processando..." : props.paymentsMode === "demo" ? "Ativar assinatura de teste" : `Assinar ${props.planName}`}
      </button>
      <small className="checkout-legal">Ao continuar, você concorda com os Termos e a Política de Privacidade.</small>
    </form>
  );
}
