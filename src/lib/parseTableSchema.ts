export type TableSchemaConfig = {
  userColumn: string;
  contentColumn: string;
  idColumn: string;
  createdAtColumn: string;
};

const DEFAULT_SCHEMA: TableSchemaConfig = {
  userColumn: "user_id",
  contentColumn: "content",
  idColumn: "id",
  createdAtColumn: "created_at",
};

export function getDefaultTableSchema(): TableSchemaConfig {
  return { ...DEFAULT_SCHEMA };
}

const USER_COLUMN_CANDIDATES = ["user_id", "owner_id", "user", "uid", "auth_user_id"];
const CONTENT_COLUMN_CANDIDATES = ["content", "body", "text", "message", "note", "description"];
const ID_COLUMN_CANDIDATES = ["id"];
const CREATED_AT_CANDIDATES = ["created_at", "created", "createdAt", "inserted_at"];

function inferColumn(
  columns: { name: string; type: string }[],
  candidates: string[]
): string {
  const lower = columns.map((c) => ({ ...c, nameLower: c.name.toLowerCase() }));
  for (const cand of candidates) {
    const found = lower.find((c) => c.nameLower === cand.toLowerCase());
    if (found) return found.name;
  }
  return candidates[0];
}

export type ParsedTable = {
  tableName: string;
  columns: { name: string; type: string }[];
  inferred: TableSchemaConfig;
};

export function parseCreateTableSql(sql: string): ParsedTable | null {
  const normalized = sql.replace(/\s+/g, " ").trim();
  const tableMatch = normalized.match(
    /create\s+table\s+(?:[\w.]+\s+)?["']?(\w+)["']?\s*\(/i
  );
  if (!tableMatch) return null;
  const tableName = tableMatch[1];
  const openParen = normalized.indexOf("(", normalized.indexOf("create"));
  if (openParen === -1) return null;
  let depth = 1;
  let i = openParen + 1;
  let end = -1;
  while (i < normalized.length) {
    const c = normalized[i];
    if (c === "(") depth++;
    else if (c === ")") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
    i++;
  }
  if (end === -1) return null;
  const between = normalized.slice(openParen + 1, end);
  const columnSegments: string[] = [];
  let segStart = 0;
  depth = 0;
  for (let j = 0; j < between.length; j++) {
    const c = between[j];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === "," && depth === 0) {
      columnSegments.push(between.slice(segStart, j).trim());
      segStart = j + 1;
    }
  }
  columnSegments.push(between.slice(segStart).trim());
  const columns: { name: string; type: string }[] = [];
  for (const seg of columnSegments) {
    const colMatch = seg.match(
      /^["']?(\w+)["']?\s+(\w+(?:\s*\([^)]*\))?(?:\s+with\s+time\s+zone)?)/i
    );
    if (colMatch) {
      columns.push({ name: colMatch[1], type: colMatch[2].replace(/\s+/g, " ") });
    }
  }
  if (columns.length === 0) return null;
  const inferred: TableSchemaConfig = {
    userColumn: inferColumn(columns, USER_COLUMN_CANDIDATES),
    contentColumn: inferColumn(columns, CONTENT_COLUMN_CANDIDATES),
    idColumn: inferColumn(columns, ID_COLUMN_CANDIDATES),
    createdAtColumn: inferColumn(columns, CREATED_AT_CANDIDATES),
  };
  return { tableName, columns, inferred };
}

export function sqlIndicatesRls(sql: string): boolean {
  const normalized = sql.replace(/\s+/g, " ").toLowerCase();
  return (
    /enable\s+row\s+level\s+security/.test(normalized) ||
    /create\s+policy\s+[\w"]+\s+on\s+\w+/.test(normalized)
  );
}

const TABLE_SCHEMA_KEY = "rls-example-table-schema";
const SCHEMA_INDICATES_RLS_KEY = "rls-example-schema-indicates-rls";

export function getStoredSchemaIndicatesRls(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SCHEMA_INDICATES_RLS_KEY) === "true";
}

export function setStoredSchemaIndicatesRls(value: boolean): void {
  if (typeof window === "undefined") return;
  if (value) {
    localStorage.setItem(SCHEMA_INDICATES_RLS_KEY, "true");
  } else {
    localStorage.removeItem(SCHEMA_INDICATES_RLS_KEY);
  }
}

export function getStoredTableSchema(): TableSchemaConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TABLE_SCHEMA_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as TableSchemaConfig;
    if (
      typeof o.userColumn === "string" &&
      typeof o.contentColumn === "string" &&
      typeof o.idColumn === "string" &&
      typeof o.createdAtColumn === "string"
    ) {
      return o;
    }
  } catch {
    // ignore
  }
  return null;
}

export function setStoredTableSchema(config: TableSchemaConfig | null): void {
  if (typeof window === "undefined") return;
  if (config === null) {
    localStorage.removeItem(TABLE_SCHEMA_KEY);
  } else {
    localStorage.setItem(TABLE_SCHEMA_KEY, JSON.stringify(config));
  }
}

export function getEffectiveTableSchema(): TableSchemaConfig {
  return getStoredTableSchema() ?? getDefaultTableSchema();
}

export function rowToNote(
  row: Record<string, unknown>,
  schema: TableSchemaConfig
): { id: string; created_at: string; user_id: string; content: string } {
  return {
    id: String(row[schema.idColumn] ?? ""),
    created_at: String(row[schema.createdAtColumn] ?? ""),
    user_id: String(row[schema.userColumn] ?? ""),
    content: String(row[schema.contentColumn] ?? ""),
  };
}
