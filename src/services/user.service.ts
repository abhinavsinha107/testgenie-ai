import { User } from "@/models/user.model";
import { GoogleUserType } from "@/types/user.type";

export class UserService {
    private static instance: UserService;

    public static getInstance() {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }

    async createUser(userProps: GoogleUserType, token: { accessToken: string, refreshToken: string }) {
        const { sub: id, name, picture, email } = userProps._json;
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            const user = new User({
                name,
                email,
                image: picture,
                googleAccessToken: token.accessToken,
                googleRefreshToken: token.refreshToken,
                googleId: id
            });
            const newUser = await user.save();
            return {
                authData: {
                    ...newUser.toObject()
                }
            }
        } else {
            const user = await User.findByIdAndUpdate(
                existingUser._id,
                {
                    googleAccessToken: token.accessToken,
                    googleRefreshToken: token.refreshToken
                },
                {
                    new: true,
                    runValidators: true
                }
            );
            const updatedUser = user?.toObject();
            return {
                authData: {
                    ...updatedUser
                }
            }
        }
    }
}