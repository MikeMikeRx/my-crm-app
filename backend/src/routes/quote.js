import express from "express"
import { authMiddleware } from "../middleware/auth"
import {
    getQuotes,
    getQuoteById,
    createQuote,
    updateQuote,
    deleteQuote,
} from "../controllers/quoteController"

const router = express.Router()

router.use(authMiddleware)

router.get("/", getQuotes)
router.get("/:id", getQuoteById)
router.post("/", createQuote)
router.put("/:id", updateQuote)
router.delete("/:id", deleteQuote)

export default router