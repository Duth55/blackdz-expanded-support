import Link from "next/link";
import { money, VIP_PRICE_CENTS, VIP_ROLE_NAME } from "@/lib/config";

export default function VipPage() {
  return (
    <div className="container page-shell">
      <section className="page-hero centered vip-page-hero">
        <span className="eyebrow">DBC: BLACKDZ VIP</span>
        <h1>V.I.P - DBC: BlackDz Expanded</h1>
        <p>Um único V.I.P oficial, com análise manual de pagamento e liberação do cargo diretamente no Discord.</p>
      </section>

      <section className="single-vip-layout">
        <article className="vip-product-card featured large-product">
          <div className="vip-product-top"><span className="plan-icon giant">💎</span><span className="featured-tag">OFICIAL</span></div>
          <h2>{VIP_ROLE_NAME}</h2>
          <div className="plan-price"><strong>{money(VIP_PRICE_CENTS)}</strong></div>
          <p className="vip-product-description">Ao adquirir o V.I.P, você apoia o DBC: BlackDz Expanded e recebe benefícios exclusivos dentro da BlackDz Community.</p>
          <ul className="benefit-list">
            <li>Cargo exclusivo no Discord</li>
            <li>Novos canais V.I.P liberados</li>
            <li>Conteúdos e spoilers exclusivos</li>
            <li>Novidades antecipadas quando disponibilizadas</li>
            <li>Apoio direto ao desenvolvimento do projeto</li>
          </ul>
          <Link href="/checkout/vip" className="btn btn-primary btn-wide btn-large">Comprar V.I.P</Link>
        </article>
      </section>

      <section className="faq-grid section">
        <article><span>01</span><h3>O pagamento é automático?</h3><p>Não. O site registra seu pedido, mas a confirmação é feita manualmente pela staff após conferir o recebimento.</p></article>
        <article><span>02</span><h3>Como a staff recebe o pedido?</h3><p>Seu pedido chega em um canal privado do Discord pelo BlackDz Community Bot, com opções para confirmar ou recusar.</p></article>
        <article><span>03</span><h3>Quando recebo o cargo?</h3><p>Assim que uma pessoa autorizada confirmar o pagamento, o cargo é adicionado automaticamente à sua conta do Discord.</p></article>
        <article><span>04</span><h3>Preciso enviar comprovante?</h3><p>É recomendado, mas a confirmação final sempre deve ser feita conferindo o recebimento real na conta de pagamento.</p></article>
      </section>
    </div>
  );
}
