import express,{type Request, type Response,type NextFunction}  from "express";
import console from "node:console";
import { authRouter } from "./modules";
import { PORT } from "./config/config";
import ConnectDB from "./DB/connection.db";
import { globalErrorHandler } from "./middleware/error.middleware";
import { redisService } from "./common/services";


const boootstrap =  async (): Promise<void> => {
const app:express.Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req:Request, res:Response, next:NextFunction) => {
    return res.status(200).send("Hello, World!");
});
// application routing 
app.use("/auth", authRouter);

app.get("/*dummy", (req:Request, res:Response, next:NextFunction) => {
    return res.status(404).send("Invalid Route!");
});

// Error handler middleware (must be last)
app.use(globalErrorHandler);

await ConnectDB();
await redisService.connect();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log("App is bootstrapping...");
});
}
;

export default boootstrap;