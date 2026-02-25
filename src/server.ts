import express from "express";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

const app = express();
const port = Number(process.env.PORT) || 3000;
const publicDir = path.resolve(process.cwd(), "public");
const landingPath = path.join(publicDir, "index.html");
const webhookSecret = process.env.WEBHOOK_SECRET ?? "";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

app.post("/api/webhook/payment", async (req, res) => {
  const requestSecret = req.header("X-Webhook-Secret");

  if (!webhookSecret || requestSecret !== webhookSecret) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const eventIdRaw = req.body?.event_id;
  const eventTypeRaw = req.body?.event_type;
  const dataRaw = req.body?.data;

  const eventId = typeof eventIdRaw === "string" ? eventIdRaw.trim() : "";
  const eventType = typeof eventTypeRaw === "string" ? eventTypeRaw.trim() : "";

  if (!eventId || !eventType) {
    return res.status(400).json({ error: "event_id and event_type are required" });
  }

  if (!uuidPattern.test(eventId)) {
    return res.status(400).json({ error: "event_id must be a valid uuid" });
  }

  let leadId: string | undefined;
  if (dataRaw && typeof dataRaw === "object" && !Array.isArray(dataRaw)) {
    const leadIdRaw = (dataRaw as Record<string, unknown>).lead_id;
    const leadIdCandidate = typeof leadIdRaw === "string" ? leadIdRaw.trim() : "";

    if (leadIdCandidate && uuidPattern.test(leadIdCandidate)) {
      const lead = await prisma.lead.findUnique({
        where: { id: leadIdCandidate },
        select: { id: true }
      });

      if (lead) {
        leadId = lead.id;
      }
    }
  }

  try {
    await prisma.eventLog.create({
      data: {
        id: eventId,
        type: eventType,
        source: "payment_service",
        payload: dataRaw as Prisma.InputJsonValue | undefined,
        leadId
      }
    });

    return res.status(200).json({ status: "ok" });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(200).json({ status: "duplicate_ignored" });
    }

    console.error("Failed to save payment webhook event", error);
    return res.status(500).json({ error: "internal server error" });
  }
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
