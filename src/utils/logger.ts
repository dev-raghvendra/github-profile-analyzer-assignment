export const logger = {
  info(message: string) {
    console.log(
      `[${new Date().toISOString()}] [INFO] ${message}`
    );
  },

  err(message: string) {
    console.error(
      `[${new Date().toISOString()}] [ERROR] ${message}`
    );
  },
} as const;