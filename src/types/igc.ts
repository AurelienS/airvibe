export type IgcFile = {
  name: string;
  content: string;
};

export type IgcFix = {
  latitude: number;
  longitude: number;
  timestamp: Date | number | string;
  gpsAltitude?: number | null;
  pressureAltitude?: number | null;
};

export type IgcHeaders = {
  HFFTY?: { site?: string } | undefined;
  HFPLTPILOT?: string | undefined;
  HFGTYGLIDERTYPE?: string | undefined;
  HFGIDGLIDERID?: string | undefined;
  HFCIDCOMPETITIONID?: string | undefined;
};

export type ParsedIgcMinimal = {
  fixes?: IgcFix[] | undefined;
  site?: string | { name?: string } | undefined;
  task?: { name?: string } | undefined;
  headers?: IgcHeaders | undefined;
};


