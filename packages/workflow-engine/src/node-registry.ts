import type { WorkflowNodeType } from "./workflow.ts";
import type { WorkflowNodeHandler } from "./execution.ts";

export type WorkflowNodeDefinition = {
  type: WorkflowNodeType;
  label: string;
  description: string;
  handler?: WorkflowNodeHandler;
};

export class WorkflowNodeRegistry {
  private readonly definitions = new Map<WorkflowNodeType, WorkflowNodeDefinition>();

  constructor(definitions: WorkflowNodeDefinition[] = defaultNodeDefinitions()) {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  register(definition: WorkflowNodeDefinition): void {
    this.definitions.set(definition.type, definition);
  }

  get(type: WorkflowNodeType): WorkflowNodeDefinition | undefined {
    return this.definitions.get(type);
  }

  list(): WorkflowNodeDefinition[] {
    return Array.from(this.definitions.values());
  }
}

export function defaultNodeDefinitions(): WorkflowNodeDefinition[] {
  return [
    { type: "trigger", label: "Trigger", description: "Starts a workflow." },
    { type: "task", label: "Task", description: "Runs Phoenix Runtime task generation." },
    { type: "strategy", label: "Strategy", description: "Generates or loads a strategy plan." },
    { type: "learning", label: "Learning", description: "Loads learning recommendations." },
    { type: "evaluation", label: "Evaluation", description: "Runs quality evaluation." },
    { type: "condition", label: "Condition", description: "Branches execution using simple rules." },
    { type: "delay", label: "Delay", description: "Waits before continuing." },
    { type: "publishing", label: "Publishing", description: "Creates or publishes content." },
    { type: "webhook", label: "Webhook", description: "Calls an external webhook." },
    { type: "notification", label: "Notification", description: "Emits a notification event." },
    { type: "scheduler", label: "Scheduler", description: "Creates scheduled jobs." },
    { type: "plugin", label: "Plugin", description: "Delegates to Plugin SDK hooks." },
    { type: "knowledge_search", label: "Knowledge Search", description: "Runs hybrid graph and vector retrieval." },
    { type: "knowledge_update", label: "Knowledge Update", description: "Refreshes graph knowledge from current platform state." },
    { type: "knowledge_ingest", label: "Knowledge Ingest", description: "Ingests documents, executions, events and platform objects into the graph." }
  ];
}
