import { DimensionCode } from "../content/dimensions";
import { ExportDocument } from "../export/json";

/** A profile that successfully validated and has been added to the aggregator. */
export interface ImportedProfile {
  /** Stable id derived from filename + timestamp — used for dedupe and selection. */
  id: string;
  /** Original filename for display. */
  filename: string;
  /** The full export document, validated. */
  doc: ExportDocument;
}

/** A fractional-per-dimension profile — for aggregates (means). */
export type FractionalProfile = Partial<Record<DimensionCode, number>>;

export interface Aggregate {
  n: number;
  mean: FractionalProfile | null;
  min:  FractionalProfile | null;
  max:  FractionalProfile | null;
  /** Count of dimensions whose MEAN is strictly below level 1 (Beginner). */
  belowBaseline: number;
}

/** Breadcrumb path: empty [] for LIS root, [paKey] for PA, [paKey, team] for team. */
export type Path = string[];

export type Level = "root" | "pa" | "team" | "individual";

export interface Node {
  level: Level;
  /** Display name. */
  name: string;
  /** Path from root *including* this node. */
  path: Path;
  /** Profiles belonging to this subtree. */
  profiles: ImportedProfile[];
  /** Direct children (PA → teams, team → individuals). */
  children: Node[];
}
