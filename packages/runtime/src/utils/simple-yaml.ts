type ParsedYaml = Record<string, unknown>;

function parseScalar(value: string): unknown {
  const trimmed = value.trim();

  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed.replace(/^["']|["']$/g, "");
}

function countIndent(line: string): number {
  const match = line.match(/^ */);
  return match ? match[0].length : 0;
}

export function parseSimpleYaml(source: string): ParsedYaml {
  const root: ParsedYaml = {};
  const stack: Array<{ indent: number; value: Record<string, unknown> }> = [
    { indent: -1, value: root }
  ];
  const lines = source.replace(/\r\n/g, "\n").split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const indent = countIndent(rawLine);

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].value;

    if (trimmed.startsWith("- ")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (rawValue === "|") {
      const block: string[] = [];
      const blockIndent = indent + 2;

      while (index + 1 < lines.length) {
        const nextLine = lines[index + 1];
        if (nextLine.trim() && countIndent(nextLine) < blockIndent) break;
        index += 1;
        block.push(nextLine.slice(blockIndent));
      }

      parent[key] = block.join("\n").trim();
      continue;
    }

    if (rawValue === "") {
      const nextLines: string[] = [];
      let cursor = index + 1;

      while (cursor < lines.length) {
        const nextLine = lines[cursor];
        const nextTrimmed = nextLine.trim();
        if (!nextTrimmed) {
          cursor += 1;
          continue;
        }
        if (countIndent(nextLine) <= indent) break;
        nextLines.push(nextLine);
        cursor += 1;
      }

      const firstNested = nextLines.find((line) => line.trim());
      if (firstNested?.trim().startsWith("- ")) {
        const arrayIndent = countIndent(firstNested);
        const values: unknown[] = [];
        for (const nestedLine of nextLines) {
          const nestedTrimmed = nestedLine.trim();
          if (countIndent(nestedLine) === arrayIndent && nestedTrimmed.startsWith("- ")) {
            values.push(parseScalar(nestedTrimmed.slice(2)));
          }
        }
        parent[key] = values;
        continue;
      }

      const child: Record<string, unknown> = {};
      parent[key] = child;
      stack.push({ indent, value: child });
      continue;
    }

    parent[key] = parseScalar(rawValue);
  }

  return root;
}

