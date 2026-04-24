import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import console from "node:console";
import { authRouter, userRouter } from "./modules";
import { PORT } from "./config/config";
import ConnectDB from "./DB/connection.db";
import { globalErrorHandler } from "./middleware/error.middleware";
import { redisService } from "./common/services";
import { UserModel } from "./DB/model/user.model";
import { ProviderEnum } from "./common/Enums";

const bootstrap = async (): Promise<void> => {
  const app: express.Express = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/", (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).send("Hello, World!");
  });

  // application routing
  app.use("/auth", authRouter);
  app.use("/user", userRouter);

  app.get("/*dummy", (req: Request, res: Response, next: NextFunction) => {
    return res.status(404).send("Invalid Route!");
  });

  // Error handler middleware (must be last)
  app.use(globalErrorHandler);

  await ConnectDB();
  await redisService.connect();

  await new UserModel({
    firstName: "eyad",
    lastName: "mohamed",
    email: `${Date.now()}@example.com`,
    provider: ProviderEnum.GOOGLE,
  }).save({ validateBeforeSave: true });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log("App is bootstrapping...");
  });
};

export default bootstrap;
