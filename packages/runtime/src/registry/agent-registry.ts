import type { Agent } from "../types.ts";
import { MockAgent } from "../agents/mock-agent.ts";

export class AgentRegistry {
  private readonly agents = new Map<string, Agent>();

  static withMockAgents(agentIds: string[]): AgentRegistry {
    const registry = new AgentRegistry();

    for (const agentId of agentIds) {
      registry.register(new MockAgent(agentId));
    }

    return registry;
  }

  register(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  get(agentId: string): Agent {
    const agent = this.agents.get(agentId);

    if (!agent) {
      throw new Error(`Agent not registered: ${agentId}`);
    }

    return agent;
  }
}

