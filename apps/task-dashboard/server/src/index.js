import mongoose from "mongoose";
import { env } from "./config/env.js";
import app from "./app.js";

async function main() {
  await mongoose.connect(env.MONGO_URI);
  console.log("MongoDB connected");
  const server = app.listen(env.PORT, () => console.log(`API listening on http://localhost:${env.PORT}/api`));

  const shutdown = async () => {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start:", err.message);
  process.exit(1);
});
