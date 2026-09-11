function daysBetween(fromMs: number, toMs: number) {
  return Math.ceil((toMs - fromMs) / 86400000);
}

export function CertBadge({ expiresAt }: { expiresAt: Date | string }) {
  const exp = new Date(expiresAt).getTime();
  const left = daysBetween(Date.now(), exp);

  let bg = "#E4EEEA";
  let fg = "#1F4B41";
  let text = `Active \u00b7 ${left} days left`;

  if (left < 0) {
    bg = "#F3E0DA";
    fg = "#A8452F";
    text = `Expired ${Math.abs(left)} days ago`;
  } else if (left <= 60) {
    bg = "#F3E8D3";
    fg = "#B4832E";
    text = `Expiring soon \u00b7 ${left} days left`;
  }

  return (
    <span className="text-xs px-2.5 py-1 inline-block" style={{ background: bg, color: fg }}>
      {text}
    </span>
  );
}
