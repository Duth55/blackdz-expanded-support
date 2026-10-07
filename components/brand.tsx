import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="BlackDz Expanded Support">
      <span className="brand-mark">DZ</span>
      <span className="brand-copy">
        <strong>BlackDz Expanded</strong>
        <small>Support</small>
      </span>
    </Link>
  );
}
