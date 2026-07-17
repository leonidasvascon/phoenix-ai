"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiFetch, getWorkspaceId, saveWorkspaceId } from "../app/api-client";

type Workspace = {
  id: string;
  name: string;
};

export function WorkspaceSelector() {
  const [selected, setSelected] = useState("");
  const workspaces = useQuery({
    queryKey: ["workspace-selector"],
    queryFn: async (): Promise<Workspace[]> => {
      const response = await apiFetch("/workspaces");
      if (!response.ok) return [];
      return response.json();
    }
  });

  useEffect(() => {
    const current = getWorkspaceId();
    if (current) {
      setSelected(current);
      return;
    }
    const first = workspaces.data?.[0]?.id;
    if (first) {
      saveWorkspaceId(first);
      setSelected(first);
    }
  }, [workspaces.data]);

  if (!workspaces.data || workspaces.data.length === 0) {
    return null;
  }

  return (
    <select
      aria-label="Workspace"
      value={selected}
      onChange={(event) => {
        saveWorkspaceId(event.target.value);
        setSelected(event.target.value);
        window.location.reload();
      }}
    >
      {workspaces.data.map((workspace) => (
        <option key={workspace.id} value={workspace.id}>
          {workspace.name}
        </option>
      ))}
    </select>
  );
}
