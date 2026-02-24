import express from "express";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

const app = express();
const port = Number(process.env.PORT) || 3000;
const publicDir = path.resolve(process.cwd(), "public");

app.use(express.json());
app.use(express.static(publicDir));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/api/leads", async (req, res) => {
  const nameRaw = req.body?.name;
  const phoneRaw = req.body?.phone;

  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  const phone = typeof phoneRaw === "string" ? phoneRaw.trim() : "";

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

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`);
});
