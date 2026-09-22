import express, { Router } from "express";
import type { Express, NextFunction, Request, Response } from "express";
import cors from "cors";
import path from "node:path";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { handleError } from "../exceptions";
import { UserService } from "@/services/user.service";
import { User } from "@/models/user.model";

export const server = (app: Express, PORT: number) => {
    const router = Router();

    app.use(cors({
        origin: process.env.FRONT_APP_URL,
        credentials: true,
    }));

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/assets', express.static(path.join(process.cwd(), 'public')));

    app.get('/', (req: Request, res: Response) => {
        res.json({ message: "Server is up and running..." })
    });

    const sess = {
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            collectionName: "sessions",
        }),
        secret: process.env.COOKIE_KEY as string,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }
    }

    if (process.env.NODE_ENV === "production") {
        app.set("trust proxy", 1);
        sess.cookie.secure = true;
    }

    app.use(session(sess));
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID as string,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
            },
            async (accessToken: string, refreshToken: string, profile: any, done: any) => {
                const userService = UserService.getInstance();
                const user = await userService.createUser(profile, { accessToken, refreshToken });
                return done(null, user);
            }
        )
    );

    passport.serializeUser((user: any, done) => {
        done(null, user.authData._id);
    });

    // Called on every request that uses the session.
    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error);
        }
    });

    app.get(
        "/auth/google",
        passport.authenticate("google",
            {
                scope: [
                    "profile",
                    "email",
                ],
                accessType: "offline",
                prompt: "consent",
            })
    );

    app.get(
        "/auth/google/callback",
        passport.authenticate("google", {
            failureRedirect: "/auth/login",
            successRedirect: process.env.FRONT_APP_URL,
        })
    );

    app.get("/auth/me", (req: Request, res: Response) => {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        res.json(req.user);
    });

    app.get("/auth/logout", (req: Request, res: Response, next: NextFunction) => {
        req.logout((err) => {
            if (err) return next(err);
            req.session.destroy(() => {
                res.clearCookie("connect.sid");
                res.json({ message: "Logged out successfully" })
            });
        });
    });

    app.use(handleError);

    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });

}
