import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import http from 'http';
import db from "./config/Database.js";
import SequelizeStore from "connect-session-sequelize";
import UserRoute from "./routes/UserRoute.js";
import ProductRoute from "./routes/ProductRoute.js";
import AuthRoute from "./routes/AuthRoute.js";
import DashboardRoute from "./routes/DashboardRoute.js";
import RegisterRoute from "./routes/RegisterRoute.js";
import ProfileRoute from "./routes/ProfileRoute.js";
import NotificationRoute from "./routes/NotificationRoute.js";
import { initializeSocket } from "./services/SocketService.js";
import { notFound, errorHandler } from "./middleware/ErrorHandler.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

const sessionStore = SequelizeStore(session.Store);

const store = new sessionStore({
    db: db
});

(async()=>{
    await db.sync();
})();

app.use(session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: {
        secure: 'auto'
    }
}));

app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000'
}));
app.use(express.json());
app.use(UserRoute);
app.use(ProductRoute);
app.use(AuthRoute);
app.use(DashboardRoute);
app.use(RegisterRoute);
app.use(ProfileRoute);
app.use(NotificationRoute);

// Handle unmatched routes (404)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// store.sync();

const PORT = process.env.APP_PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server up and running at port ${PORT}`);
    console.log(`Socket.io server ready`);
});
