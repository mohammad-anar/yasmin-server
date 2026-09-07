import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  ip_address: process.env.IP_ADDRESS,
  backend_url: process.env.BACKEND_URL,
  database_url: process.env.DATABASE_URL,
  bcrypt_salt_round: Number(process.env.BCRYPT_SALT_ROUND),
  cors_origin: process.env.CORS_ORIGIN,
  frontend_url: process.env.FRONTEND_URL,
  email: {
    from: process.env.EMAIL_FROM,
    user: process.env.EMAIL_USER,
    port: process.env.EMAIL_PORT,
    host: process.env.EMAIL_HOST,
    pass: process.env.EMAIL_PASS,
  },
  jwt: {
    jwt_secret: process.env.JWT_SECRET,
    jwt_expire_in: process.env.JWT_EXPIRE_IN,
    jwt_refresh_expire_in: process.env.JWT_REFRESH_EXPIRE_IN,
  },
  admin: {
    name: process.env.NAME,
    email: process.env.EMAIL,
    phone: process.env.PHONE,
    password: process.env.PASSWORD,
    avatar: process.env.AVATAR,
  },
  google_play: {
    package_name: process.env.ANDROID_PACKAGE_NAME || "com.herwellness.herwellness_flutter",
    credentials_path: process.env.GOOGLE_APPLICATION_CREDENTIALS || "./service-account-key.json",
    webhook_secret_key: process.env.WEBHOOK_SECRET_KEY,
    pubsub_topic: process.env.GOOGLE_PUBSUB_TOPIC,
    public_key: process.env.GOOGLE_PLAY_PUBLIC_KEY,
  },
};


