import { connect } from "mongoose";
import { DB_URI } from "../config/config";

const ConnectDB = async () => {
    try {
        await connect(DB_URI,{serverSelectionTimeoutMS: 5000});
        console.log("Database connected successfully!");
    } catch (error) {
        console.error(`Database connection failed:, ${error}`);
        process.exit(1); // Exit the process with an error code
    }
};
export default ConnectDB;