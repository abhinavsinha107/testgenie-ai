import mongoose from "mongoose";

export const connectDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("Database connected successfully");
    } catch (error) {
        console.log("Database connection error", error);
    }
}