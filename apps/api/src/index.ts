import { buildApp } from "./app";
import { config } from "./config";

const { app } = await buildApp();
app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
