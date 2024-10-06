export declare const definitionPath: string;
export declare const definition: string;

type SqlFunction = (
  template: TemplateStringsArray,
  ...substitutions: any[]
) => Promise<Record<string, any>[]>;

interface _Record {
  kind: "+" | "-" | "+-" | null;
  type: string;
  name: string;
  namespace: string;
  extras: Record<string, any>;
}

interface InspectionRecord extends _Record {
  kind: null;
}

interface DiffRecord extends _Record {
  kind: "+" | "-" | "+-";
}

export declare function inspect(sql: SqlFunction): Promise<InspectionRecord[]>;

export declare function diff(
  sql: SqlFunction,
  input: { left: InspectionRecord[]; right: InspectionRecord[] }
): Promise<DiffRecord[]>;
