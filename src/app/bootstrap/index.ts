import { Express } from "express";
import { server } from "./express";
import { connectDatabase } from "./mongoose";

export const bootStrapApp = async (app: Express, PORT: number) => {
    await connectDatabase();
    server(app, PORT);
}