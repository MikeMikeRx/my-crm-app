import express from "express"
import { authMiddleware } from "../middleware/auth"
import {
    getQuotes,
    getQuoteById,
    createQuote,
    updateQuote,
    deleteQuote,
} from "../controllers/quoteController"