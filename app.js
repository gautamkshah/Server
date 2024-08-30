import "dotenv/config.js";
import { connectDB } from "./src/config/connect.js";
import { PORT } from "./src/config/config.js";
import { admin,buildAdminRouter } from "./src/config/setup.js";
import Fastify from "fastify";

const start = async () => {
  await connectDB(process.env.MONGO_URI);
  const app = Fastify();

  await buildAdminRouter(app);
  
  app.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`Blinkit started on http://localhost:${PORT}${admin.options.rootPath}`);
    }
  });
};

start();
