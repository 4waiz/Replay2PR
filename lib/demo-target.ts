import fs from "fs/promises";
import path from "path";

const templatePath = path.join(process.cwd(), "app", "demo", "buggy-form.template.tsx");
const targetPath = path.join(process.cwd(), "app", "demo", "buggy-form.tsx");

export async function resetDemoTarget() {
  const template = await fs.readFile(templatePath, "utf8");
  await fs.writeFile(targetPath, template, "utf8");
}

export async function readDemoTarget() {
  return fs.readFile(targetPath, "utf8");
}

export async function writeDemoTarget(contents: string) {
  await fs.writeFile(targetPath, contents, "utf8");
}
