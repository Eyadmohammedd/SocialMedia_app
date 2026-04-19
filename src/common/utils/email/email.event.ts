import { EventEmitter } from "node:events";

export const emailEmitter = new EventEmitter();
emailEmitter.on("sendEmail", async (emailFunction) => {
  try {
    await emailFunction();
  } catch (error) {
    console.log(`Fail to send user email ${error}`);
  }
});
