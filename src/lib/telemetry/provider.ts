import "server-only";

import { isDatabaseConfigured, serverEnv } from "@/lib/env";
import { getTelemetry, listZones } from "@/lib/db/repositories";
import type { TelemetrySample, ZoneView } from "@/types";

/**
 * Telemetry provider abstraction (spec §40).
 *
 * THE CRITICAL RULE: nothing from a synthetic feed may ever be labelled
 * "live", "real-time", "current" or "operational". Every payload returned here
 * carries `simulated`, and the UI renders a DEMO badge whenever it is true.
 *
 * When real sensors arrive, implement `LiveSensorProvider` below and return it
 * from `getTelemetryProvider()` — no UI redesign required.
 */

export interface TelemetryProvider {
  readonly id: "demo" | "live";
  readonly simulated: boolean;
  readonly label: string;
  readonly note: string;
  series(opts: { zoneId?: string; points?: number }): Promise<TelemetrySample[]>;
  zones(): Promise<ZoneView[]>;
  snapshot(zoneId?: string): Promise<ZoneSnapshot>;
}

export interface ZoneSnapshot {
  zone: ZoneView | null;
  temperature: number | null;
  humidity: number | null;
  status: "STABLE" | "WARNING" | "ALERT" | "UNAVAILABLE";
  trend: number[];
  simulated: boolean;
  sampledAt: string;
}

/** Synthetic provider — deterministic, seeded, clearly labelled. */
class DemoTelemetryProvider implements TelemetryProvider {
  readonly id = "demo" as const;
  readonly simulated = true;
  readonly label = "DEMO";
  readonly note = "Illustrative interface — not connected to facility sensors.";

  async series(opts: { zoneId?: string; points?: number } = {}): Promise<TelemetrySample[]> {
    const rows = await getTelemetry(opts);
    return rows.map((r) => ({ ...r, simulated: true }));
  }

  async zones(): Promise<ZoneView[]> {
    return listZones();
  }

  async snapshot(zoneId?: string): Promise<ZoneSnapshot> {
    const zones = await this.zones();
    const zone = zoneId ? (zones.find((z) => z.id === zoneId || z.code === zoneId) ?? null) : null;
    const series = await this.series({ zoneId: zone?.id, points: 24 });
    const trend = series.slice(-12).map((s) => s.temperature);
    const temperature = trend.length ? trend[trend.length - 1]! : (zone?.temperature ?? null);
    const humidity = series.length ? series[series.length - 1]!.humidity : (zone?.humidity ?? null);

    let status: ZoneSnapshot["status"] = "STABLE";
    if (temperature === null) status = "UNAVAILABLE";
    else if (trend.length > 2) {
      const spread = Math.max(...trend) - Math.min(...trend);
      if (spread > 3.2) status = "ALERT";
      else if (spread > 1.8) status = "WARNING";
    }

    return {
      zone,
      temperature,
      humidity,
      status,
      trend,
      simulated: true,
      sampledAt: new Date().toISOString(),
    };
  }
}

/**
 * Placeholder for a real integration (Modbus/BACnet gateway, MQTT broker, or a
 * vendor REST API). Wire it here when hardware is available.
 */
class LiveSensorProvider implements TelemetryProvider {
  readonly id = "live" as const;
  readonly simulated = false;
  readonly label = "LIVE";
  readonly note = "Connected to facility sensors.";

  constructor(private readonly baseUrl: string, private readonly token: string) {}

  async series(opts: { zoneId?: string; points?: number } = {}): Promise<TelemetrySample[]> {
    const url = new URL(`${this.baseUrl}/telemetry`);
    if (opts.zoneId) url.searchParams.set("zone", opts.zoneId);
    url.searchParams.set("points", String(opts.points ?? 48));
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.token}` },
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`Telemetry provider responded ${res.status}`);
    const data = (await res.json()) as TelemetrySample[];
    return data.map((d) => ({ ...d, simulated: false }));
  }

  async zones(): Promise<ZoneView[]> {
    return listZones();
  }

  async snapshot(zoneId?: string): Promise<ZoneSnapshot> {
    const zones = await this.zones();
    const zone = zoneId ? (zones.find((z) => z.id === zoneId) ?? null) : null;
    const series = await this.series({ zoneId, points: 24 });
    const trend = series.slice(-12).map((s) => s.temperature);
    return {
      zone,
      temperature: trend.length ? trend[trend.length - 1]! : null,
      humidity: series.length ? series[series.length - 1]!.humidity : null,
      status: trend.length ? "STABLE" : "UNAVAILABLE",
      trend,
      simulated: false,
      sampledAt: new Date().toISOString(),
    };
  }
}

let provider: TelemetryProvider | null = null;

export function getTelemetryProvider(): TelemetryProvider {
  if (provider) return provider;
  const url = process.env.TELEMETRY_PROVIDER_URL;
  const token = process.env.TELEMETRY_PROVIDER_TOKEN;
  provider = url && token ? new LiveSensorProvider(url, token) : new DemoTelemetryProvider();
  return provider;
}

/** Human-readable banner shown anywhere synthetic data is rendered. */
export function dataSourceLabel(): {
  simulated: boolean;
  label: string;
  note: string;
  database: "postgresql" | "demo-file-store";
} {
  const p = getTelemetryProvider();
  return {
    simulated: p.simulated || !isDatabaseConfigured || serverEnv.demoMode,
    label: p.simulated ? "DEMO" : "LIVE",
    note: p.note,
    database: isDatabaseConfigured ? "postgresql" : "demo-file-store",
  };
}
