import { createServer } from "http";
import app from "@/app"
import { CONFIG } from "@/config/config";
import { databaseClient } from "@/database/client";
import { logger } from "@/utils/logger";

const server = createServer(app)
async function start(){
   try {
      await databaseClient.connectDB()
      logger.info(`DATABASE_CONNECTED`)
   } catch (e:any) {
      logger.err(`DATABASE_CONNECTION_FAILED ${JSON.stringify(e,null,2)}`)
      process.exit(1)
   }

   server.listen(CONFIG.PORT,()=>{
     logger.info(`SERVER_RUNNING_ON: http://localhost:${CONFIG.PORT}`)
   })
   server.on('error',(e)=>{
    logger.err(`ERROR_OCCURED_IN_SERVER_STARTUP :${JSON.stringify(e,null,2)}`)
    process.exit(1)
   })
}
start()