export function BatacTransfer({ from, to }: { from: string; to: string }) {
  if (from !== "laoag" || (to !== "batac" && to !== "mmsu")) return null;

  const destination = to === "mmsu" ? "MMSU Batac" : "your stop in Batac";
  return (
    <div className="rounded-2xl bg-card p-3">
      <p className="text-[15px] text-foreground">Bus + tricycle via Batac highway</p>
      <p className="mt-1 text-[13px]">
        Before boarding a Vigan- or Badoc-bound bus, ask the conductor to confirm a highway drop-off in Batac.
        From there, take a tricycle to {destination}.
      </p>
    </div>
  );
}
