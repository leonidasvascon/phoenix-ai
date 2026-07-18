import type { PluginHookName } from "./hooks.ts";

export type PluginLogger = {
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
};

export type PluginContext = {
  workspace: { id: string };
  logger: PluginLogger;
  storage: {
    get(key: string): Promise<unknown>;
    set(key: string, value: unknown): Promise<void>;
  };
  secretResolver: {
    resolve(reference: string): Promise<string>;
  };
  runtime: Record<string, never>;
  api: Record<string, never>;
  events: {
    emit(event: string, payload?: unknown): Promise<void>;
  };
  knowledgeGraph: {
    registerEntityType(type: string): Promise<void>;
    registerRelationType(type: string): Promise<void>;
    registerReranker(id: string): Promise<void>;
  };
  metrics: {
    increment(name: string): void;
  };
  trace: {
    id: string;
  };
};

export type PluginHookHandler = (payload: unknown, context: PluginContext) => Promise<unknown> | unknown;
export type PluginHookMap = Partial<Record<PluginHookName, PluginHookHandler>>;

export type PhoenixPlugin = {
  manifest: import("./manifest.ts").PluginManifest;
  setup?(context: PluginContext): Promise<void> | void;
  hooks?: PluginHookMap;
  onLoad?(context: PluginContext): Promise<void> | void;
  onEnable?(context: PluginContext): Promise<void> | void;
  onDisable?(context: PluginContext): Promise<void> | void;
  onUnload?(context: PluginContext): Promise<void> | void;
  onInstall?(context: PluginContext): Promise<void> | void;
  onUpgrade?(context: PluginContext): Promise<void> | void;
};

export function definePlugin(plugin: PhoenixPlugin): PhoenixPlugin {
  return plugin;
}
