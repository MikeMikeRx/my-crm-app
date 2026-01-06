import Customer from "../models/Customer.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// ============================================================================
// GET ALL CUSTOMERS
// ============================================================================
export const getCustomers = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // FETCH CUSTOMERS
    // ========================================================================
    // Find all customers belonging to the authenticated user
    // Sort by creation date (newest first)
    const customers = await Customer.find({ user: req.user.id }).sort({ createdAt: -1 })

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.json(customers)
})

// ============================================================================
// GET CUSTOMER BY ID
// ============================================================================
export const getCustomerById = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // FETCH CUSTOMER
    // ========================================================================
    // Find customer by ID, ensuring it belongs to the authenticated user
    const customer = await Customer.findOne({ _id: req.params.id, user: req.user.id })

    // Check if customer exists
    if (!customer) {
        return res.status(404).json({ message: "Customer not found" })
    }

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.json(customer)
})

// ============================================================================
// CREATE CUSTOMER
// ============================================================================
export const createCustomer = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // EXTRACT & VALIDATE INPUT
    // ========================================================================
    const { name, email, phone, company, address } = req.body

    // Ensure required field is provided
    if (!name) {
        return res.status(400).json({ message: "Name is required" })
    }

    // ========================================================================
    // CREATE CUSTOMER
    // ========================================================================
    // Create new customer associated with the authenticated user
    const newCustomer = await Customer.create({
        user: req.user.id,
        name,
        email,
        phone,
        company,
        address,
    })

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.status(201).json(newCustomer)
})

// ============================================================================
// UPDATE CUSTOMER
// ============================================================================
export const updateCustomer = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // UPDATE CUSTOMER
    // ========================================================================
    // Find and update customer, ensuring it belongs to the authenticated user
    // Options:
    // - new: true -> return updated document
    // - runValidators: true -> run model validations on update
    const customer = await Customer.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        req.body,
        { new: true, runValidators: true }
    )

    // Check if customer exists
    if (!customer) {
        return res.status(404).json({ message: "Customer not found" })
    }

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.json(customer)
})

// ============================================================================
// DELETE CUSTOMER
// ============================================================================
export const deleteCustomer = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // DELETE CUSTOMER
    // ========================================================================
    // Find and delete customer, ensuring it belongs to the authenticated user
    const customer = await Customer.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id
    })

    // Check if customer exists
    if (!customer) {
        return res.status(404).json({ message: "Customer not found" })
    }

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.json({ message: "Customer deleted successfully" })
})
