import session from "express-session";
import { RedisStore } from "connect-redis";
import redisClient from "./redis.js";
import { envConfig } from "./env.js";

const sessionConfig = () => {
  const store = new RedisStore({
    client: redisClient,
    ttl: envConfig.general.SESSION_MAX_AGE * 60,
  });

  return session({
    store,
    resave: false,
    saveUninitialized: false,
    secret: envConfig.general.APP_KEY,
    cookie: {
      maxAge: envConfig.general.SESSION_MAX_AGE * 60 * 1000,
    },
  });
};

export default sessionConfig;
