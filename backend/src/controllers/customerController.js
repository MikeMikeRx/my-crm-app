import Customer from "../models/Customer.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// GET ALL CUSTOMERS
export const getCustomers = asyncHandler(async (req, res, next) => {
    const customers = await Customer.find({ user: req.user.id }).sort({ createdAt: -1 })

    res.json(customers)
})

// GET CUSTOMER BY ID
export const getCustomerById = asyncHandler(async (req, res, next) => {
    const customer = await Customer.findOne({ _id: req.params.id, user: req.user.id })

    if (!customer) {
        return res.status(404).json({ message: "Customer not found" })
    }

    res.json(customer)
})

// CREATE CUSTOMER
export const createCustomer = asyncHandler(async (req, res, next) => {
    const { name, email, phone, company, address } = req.body

    if (!name) {
        return res.status(400).json({ message: "Name is required" })
    }

    const newCustomer = await Customer.create({
        user: req.user.id,
        name,
        email,
        phone,
        company,
        address,
    })

    res.status(201).json(newCustomer)
})

// UPDATE CUSTOMER
export const updateCustomer = asyncHandler(async (req, res, next) => {
    const customer = await Customer.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        req.body,
        { new: true, runValidators: true }
    )

    if (!customer) {
        return res.status(404).json({ message: "Customer not found" })
    }

    res.json(customer)
})

// DELETE CUSTOMER
export const deleteCustomer = asyncHandler(async (req, res, next) => {
    const customer = await Customer.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id
    })

    if (!customer) {
        return res.status(404).json({ message: "Customer not found" })
    }

    res.json({ message: "Customer deleted successfully" })
})
