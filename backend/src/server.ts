
import "dotenv/config";
import mongoose from "mongoose";

import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = Number(process.env.PORT || 5000);

async function startServer() {
  await connectDatabase();

  app.listen(port, () => {
    console.log(`HireFlow API running at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start HireFlow API:", error);
  process.exitCode = 1;
});
