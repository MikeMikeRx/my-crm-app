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