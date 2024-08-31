import "dotenv/config.js";
import { connectDB } from "./src/config/connect.js";
import { PORT } from "./src/config/config.js";
import { admin, buildAdminRouter } from "./src/config/setup.js";
import Fastify from "fastify";
import { registerRoutes } from "./src/routes/index.js";
import fastifySocketIO from "fastify-socket.io";

const start = async () => {
  await connectDB(process.env.MONGO_URI);
  const app = Fastify();

  app.register(fastifySocketIO, {
    cors: {
      origin: "*",
    },
    pingInterval: 10000,
    pingTimeout: 5000,
    transports: ["websocket"],
  });

  await registerRoutes(app);

  await buildAdminRouter(app);

  app.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log(
        `Blinkit started on http://localhost:${PORT}${admin.options.rootPath}`
      );
    }
  });

  app.ready().then(() => {
    app.io.on("connection", (socket) => {
      console.log("A user Connected");

      socket.on("joinRoom", (orderId) => {
        socket.join(orderId);
        console.log("User Joined Room", orderId);
      });
      socket.on("disconnect", () => {
        console.log("User Disconnected");
      });
    });
  });
};

start();
