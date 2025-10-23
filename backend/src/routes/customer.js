import express from "express"
import { authMiddleware } from "../middleware/auth"
import {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
} from "../controllers/customerController"