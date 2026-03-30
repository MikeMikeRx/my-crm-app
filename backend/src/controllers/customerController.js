import Customer from "../models/Customer.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { DEFAULT_SORT } from "../utils/queries/queryDefaults.js"
import { parsePagination, paginatedResponse } from "../utils/pagination.js"
import { buildFilter } from "../utils/filters.js"

export const getCustomers = asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query)
    const { filter, errors } = buildFilter(
        { tenant: req.tenant.id },
        req.query,
        { allowCustomer: false }
    )

    if (errors.length) return res.status(400).json({ message: errors[0] })

    const [customers, total] = await Promise.all([
        Customer.find(filter).sort(DEFAULT_SORT).skip(skip).limit(limit),
        Customer.countDocuments(filter),
    ])

    res.json(paginatedResponse(customers, total, page, limit))
})

export const getCustomerById = asyncHandler(async (req, res) => {
    const customer = await Customer.findOne({ _id: req.params.id, tenant: req.tenant.id })

    if (!customer) {
        return res.status(404).json({ message: "Customer not found" })
    }

    res.json(customer)
})

export const createCustomer = asyncHandler(async (req, res) => {
    const { name, email, phone, company, address } = req.body

    if (!name) {
        return res.status(400).json({ message: "Name is required" })
    }

    const newCustomer = await Customer.create({
        user: req.user.id,
        tenant: req.tenant.id,
        name,
        email,
        phone,
        company,
        address,
    })

    res.status(201).json(newCustomer)
})

export const updateCustomer = asyncHandler(async (req, res) => {
    const { name, email, phone, company, address } = req.body
    const customer = await Customer.findOneAndUpdate(
        { _id: req.params.id, tenant: req.tenant.id },
        { name, email, phone, company, address },
        { new: true, runValidators: true }
    )

    if (!customer) {
        return res.status(404).json({ message: "Customer not found" })
    }

    res.json(customer)
})

export const deleteCustomer = asyncHandler(async (req, res) => {
    const customer = await Customer.findOneAndDelete({
        _id: req.params.id,
        tenant: req.tenant.id
    })

    if (!customer) {
        return res.status(404).json({ message: "Customer not found" })
    }

    res.json({ message: "Customer deleted successfully" })
})
