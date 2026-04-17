import { DIMENSIONS, DimensionCode } from "../content/dimensions";
import { PRODUCT_AREAS } from "../content/org";
import { Aggregate, FractionalProfile, ImportedProfile, Node, Path } from "./types";

/** Mean / min / max of a set of profiles, per dimension. Returns all-nulls for n=0. */
export function aggregate(profiles: ImportedProfile[]): Aggregate {
  const n = profiles.length;
  if (n === 0) return { n, mean: null, min: null, max: null, belowBaseline: 0 };

  const mean: FractionalProfile = {};
  const min:  FractionalProfile = {};
  const max:  FractionalProfile = {};
  let belowBaseline = 0;

  for (const d of DIMENSIONS) {
    const vals = profiles.map((p) => p.doc.assessments[d.code]?.level ?? 0);
    const sum = vals.reduce((a, b) => a + b, 0);
    const m = sum / n;
    mean[d.code] = m;
    min[d.code]  = Math.min(...vals);
    max[d.code]  = Math.max(...vals);
    if (m < 1) belowBaseline++;
  }
  return { n, mean, min, max, belowBaseline };
}

/** Build the LIS → PA → team → individual tree from imported profiles. */
export function buildTree(profiles: ImportedProfile[]): Node {
  // Group profiles by product area key, then by team name.
  const byPA = new Map<string, Map<string, ImportedProfile[]>>();
  for (const p of profiles) {
    const paKey = p.doc.subject.productArea ?? "__uncategorised__";
    const team  = p.doc.subject.team ?? "__untagged__";
    const paMap = byPA.get(paKey) ?? new Map();
    const list  = paMap.get(team) ?? [];
    list.push(p);
    paMap.set(team, list);
    byPA.set(paKey, paMap);
  }

  // Resolve PA display names from org.ts; unknowns render with their raw key.
  const paNameFor = (key: string) =>
    PRODUCT_AREAS.find((pa) => pa.key === key)?.name ?? key;

  // Sort: PAs in canonical org.ts order, then any unknown keys alphabetical at the end.
  const paOrder = new Map(PRODUCT_AREAS.map((pa, i) => [pa.key, i]));
  const paKeys = Array.from(byPA.keys()).sort((a, b) =>
    (paOrder.get(a) ?? 1e6) - (paOrder.get(b) ?? 1e6) || a.localeCompare(b)
  );

  const paNodes: Node[] = paKeys.map((paKey) => {
    const teams = byPA.get(paKey)!;
    const teamNodes: Node[] = Array.from(teams.keys()).sort((a, b) => a.localeCompare(b)).map((teamName) => {
      const teamProfiles = teams.get(teamName)!;
      const indNodes: Node[] = teamProfiles.map((p) => ({
        level: "individual",
        name: p.doc.subject.name || p.filename,
        path: [paKey, teamName, p.id],
        profiles: [p],
        children: []
      }));
      return {
        level: "team",
        name: teamName,
        path: [paKey, teamName],
        profiles: teamProfiles,
        children: indNodes
      };
    });
    return {
      level: "pa",
      name: paNameFor(paKey),
      path: [paKey],
      profiles: Array.from(teams.values()).flat(),
      children: teamNodes
    };
  });

  return {
    level: "root",
    name: "LIS",
    path: [],
    profiles,
    children: paNodes
  };
}

/** Walk the tree to resolve a path into a node. Returns the deepest existing match. */
export function nodeAt(tree: Node, path: Path): Node {
  let cur: Node = tree;
  for (const seg of path) {
    const next = cur.children.find((c) => c.path[c.path.length - 1] === seg);
    if (!next) return cur;
    cur = next;
  }
  return cur;
}

/** One hash = same person on same day with same team. Used to flag duplicate imports. */
export function profileIdOf(doc: ImportedProfile["doc"], filename: string): string {
  const who  = (doc.subject.name ?? "anon").trim().toLowerCase();
  const team = (doc.subject.team ?? "").trim().toLowerCase();
  const pa   = (doc.subject.productArea ?? "").trim().toLowerCase();
  const day  = (doc.timestamp ?? "").slice(0, 10);
  return `${pa}::${team}::${who}::${day}::${filename}`;
}

/** Convenience: does every dimension have at least one answer? */
export function isComplete(doc: ImportedProfile["doc"]): boolean {
  return DIMENSIONS.every((d) => typeof doc.assessments[d.code]?.level === "number");
}

/** Ensures every dimension is present on the returned record (filling absent with 0). */
export function completeProfile(p: FractionalProfile): Record<DimensionCode, number> {
  const out = {} as Record<DimensionCode, number>;
  for (const d of DIMENSIONS) out[d.code] = p[d.code] ?? 0;
  return out;
}
