export type WorkflowHookName = "beforeWorkflow" | "afterWorkflow" | "beforeNode" | "afterNode";

export type WorkflowHook = (payload: unknown) => Promise<unknown> | unknown;
