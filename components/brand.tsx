import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="DBC: BlackDz VIP">
      <span className="brand-mark"><span>DZ</span><i>VIP</i></span>
      <span className="brand-copy">
        <strong>DBC: BlackDz</strong>
        <small>VIP</small>
      </span>
    </Link>
  );
}
