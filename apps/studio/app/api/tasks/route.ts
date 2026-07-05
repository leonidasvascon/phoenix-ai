import { NextResponse } from "next/server";
import { resolve } from "node:path";
import { composeMediaPackage } from "@phoenix-ai/media-composer";
import { Runtime, type Task } from "@phoenix-ai/runtime";

type TaskRequest = Partial<Task>;

function isValidFormat(format: unknown): format is Task["format"] {
  return typeof format === "string" && ["reel", "carousel", "story"].includes(format);
}

function normalizeTask(input: TaskRequest): Task {
  if (!input.brand || !input.theme || !input.objective || !isValidFormat(input.format)) {
    throw new Error("Task invalida.");
  }

  return {
    brand: input.brand,
    theme: input.theme,
    objective: input.objective,
    platform: input.platform ?? "instagram",
    format: input.format
  };
}

export async function POST(request: Request) {
  const previousWorkingDirectory = process.cwd();

  try {
    const body = (await request.json()) as TaskRequest;
    const task = normalizeTask(body);
    process.chdir(resolve(previousWorkingDirectory, "../.."));
    const runtimeResponse = await Runtime.execute(task);
    const mediaPackage = await composeMediaPackage(runtimeResponse);

    return NextResponse.json({
      ...runtimeResponse,
      media_package: {
        directory: mediaPackage.directory,
        files: Object.keys(mediaPackage.files)
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido.";

    return NextResponse.json(
      {
        status: "error",
        message
      },
      { status: 400 }
    );
  } finally {
    process.chdir(previousWorkingDirectory);
  }
}
