import Customer from "../models/Customer"

export const getCustomers = async (req, res, next) => {
    try {
        const customers = await Customer.find({ user: req.user.id }).sort({ createdAt: -1 })
        res.json(customers)
    } catch (err) {
        next(err)
    }
}

export const getCustomerById = async (req, res, next) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.id, user: req.user.id })
        if (!customer) return res.status(404).json({ message: "Customer not found" })
        res.json(customer)
    } catch (err) {
        next(err)
    }
}

export const createCustomer = async (req, res, next) => {
    try {
        const { name, email, phone, company, address } = req.body
        if (!name) return res.status(400).json({ message: "Name is required" })

        const newCustomer = await Customer.create({
            user: req.user.id,
            name,
            email,
            phone,
            company,
            address,
        })

        res.status(201).json(newCustomer)
    } catch (err) {
        next(err)
    }
}

export const updateCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findOneAndUpdate(
            {_id: req.params.id, user: req.user.id },
            req.body,
            { new: true, runValidators: true }
        )
        if (!customer) return res.status(404).json({ message: "Customer not found" })
        res.json(customer)
    } catch (err) {
        next(err)
    }
}

export const deleteCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findOneAndDelete({ _id: req.params.id, user: req.user.id })
        if (!customer) return res.status(404).json({ message: "Customer not found" })
        res.json({ message: "Customer deleted successfully"})
    } catch (err) {
        next(err)
    }
}