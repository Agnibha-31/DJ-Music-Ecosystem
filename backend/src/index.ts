import { createServer } from "http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { initSocket } from "./socket/io.js";
import { bootstrapStorage } from "./storage/bootstrap.js";
import { initSongCatalogWatcher } from "./services/songCatalogService.js";

const startServer = async () => {
  try {
    // Bootstrap storage before anything else
    await bootstrapStorage();

    const server = createServer(app);
    initSocket(server);
    initSongCatalogWatcher();

    server.listen(env.port, () => {
      env.logger.info({ port: env.port }, "backend listening");
    });
  } catch (error) {
    env.logger.fatal({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 'Failed to start server');
    process.exit(1);
  }
};

// Start the server
startServer();
