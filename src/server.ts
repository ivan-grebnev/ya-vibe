import express from "express";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

const app = express();
const port = Number(process.env.PORT) || 3000;
const publicDir = path.resolve(process.cwd(), "public");
const landingPath = path.join(publicDir, "index.html");

app.use(express.json());

async function writeEventLog(
  type: string,
  options?: {
    payload?: Prisma.InputJsonValue;
    leadId?: string;
    source?: string;
  }
): Promise<void> {
  try {
    await prisma.eventLog.create({
      data: {
        type,
        source: options?.source ?? "app",
        payload: options?.payload,
        leadId: options?.leadId
      }
    });
  } catch (error: unknown) {
    console.error(`Failed to save event log for ${type}`, error);
  }
}

async function serveLanding(_req: express.Request, res: express.Response): Promise<void> {
  await writeEventLog("landing_view");
  res.sendFile(landingPath);
}

app.get("/", serveLanding);
app.use(express.static(publicDir));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/api/leads", async (req, res) => {
  const nameRaw = req.body?.name;
  const phoneRaw = req.body?.phone;

  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  const phone = typeof phoneRaw === "string" ? phoneRaw.trim() : "";

  await writeEventLog("cta_click", {
    payload: {
      name,
      phone
    }
  });

  if (!name || !phone) {
    return res.status(400).json({ error: "name and phone are required" });
  }

  if (!/^\+\d+$/.test(phone)) {
    return res.status(400).json({ error: "phone must start with + and contain digits only" });
  }

  try {
    const lead = await prisma.lead.create({
      data: {
        name,
        phone
      }
    });

    await writeEventLog("lead_created", { leadId: lead.id });

    return res.status(201).json({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      createdAt: lead.createdAt
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(409).json({ error: "duplicate contact" });
    }

    console.error("Failed to save lead", error);
    return res.status(500).json({ error: "internal server error" });
  }
});

app.get("*", (req, res) => {
  // Do not treat missing static files as page views (e.g. /favicon.ico).
  if (path.extname(req.path)) {
    return res.status(404).end();
  }

  return res.sendFile(landingPath);
});

app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`);
});
