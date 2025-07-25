// eslint-disable-next-line import/no-extraneous-dependencies
import jwt from "jsonwebtoken";

import Config from "~/config/config.json";

export class JwtUtils {
    public static generateJwt(payload: object): string {
        return jwt.sign(payload, Config.api.jwtSecret, { expiresIn: "5m" });
    }
}
