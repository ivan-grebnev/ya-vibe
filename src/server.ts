import express from "express";
import path from "path";

const app = express();
const port = Number(process.env.PORT) || 3000;
const publicDir = path.resolve(process.cwd(), "public");

app.use(express.static(publicDir));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`);
});
