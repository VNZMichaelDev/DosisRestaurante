export type BranchId = "monay" | "flor_patria";

export const BRANCHES: {
  id: BranchId;
  name: string;
  short: string;
  emoji: string;
}[] = [
  { id: "monay", name: "Monay", short: "Monay", emoji: "🏙️" },
  { id: "flor_patria", name: "Flor de Patria", short: "Flor de Patria", emoji: "🌳" },
];

export function branchName(id?: string | null): string {
  if (!id) return "";
  return BRANCHES.find((b) => b.id === id)?.name ?? id;
}

export function branchEmoji(id?: string | null): string {
  if (!id) return "";
  return BRANCHES.find((b) => b.id === id)?.emoji ?? "🏬";
}
