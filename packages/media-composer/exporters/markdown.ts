export function exportMarkdown(title: string, sections: Array<[string, string]>): string {
  const content = sections
    .filter(([, body]) => body.trim().length > 0)
    .map(([heading, body]) => `## ${heading}\n\n${body.trim()}`)
    .join("\n\n");

  return `# ${title}\n\n${content}\n`;
}
