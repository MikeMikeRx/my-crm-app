import Customer from "../models/Customer"

export const getCustomers = async (req, res, next) => {
    try {
        const customers = await Customer.find({ user: req.user.id }).sort({ createdAt: -1 })
        res.json(customers)
    } catch (err) {
        next(err)
    }
}