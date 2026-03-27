import { Router } from "express";

import { sendApiError } from "../utils/api-envelope.js";
import authRoutes from "./auth.routes.js";
import categoryRoutes from "./category.routes.js";
import commentRoutes from "./comment.routes.js";
import postRoutes from "./post.routes.js";
import tagRoutes from "./tag.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
router.use("/comments", commentRoutes);
router.use("/categories", categoryRoutes);
router.use("/tags", tagRoutes);
router.use("/users", userRoutes);

if (process.env.NODE_ENV !== "production") {
  router.get("/test", (_req, res) => {
    res.json({
      message: "Hello from the backend API (via /api/test)",
      timestamp: new Date().toISOString(),
    });
  });

  router.post("/data", (req, res) => {
    console.log("Received data:", req.body);

    if (req.body && typeof req.body === "object" && "message" in req.body) {
      res.json({
        status: "success",
        receivedMessage: (req.body as { message: string }).message,
        serverTime: new Date().toISOString(),
      });
      return;
    }

    sendApiError(res, 400, "No message provided in the request body");
  });
}

export default router;
