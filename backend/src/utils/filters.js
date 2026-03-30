import mongoose from "mongoose";

export function buildFilter(base, query, { validStatuses, dateField = "createdAt", allowCustomer = true } = {}) {
    const filter = { ...base };
    const errors = [];

    if (query.status !== undefined) {
        if (!validStatuses || !validStatuses.has(query.status)) {
            errors.push(
                validStatuses
                    ? `Invalid status "${query.status}". Valid values: ${[...validStatuses].join(", ")}`
                    : `Status filtering is not supported for this resource`
            );
        } else {
            filter.status = query.status;
        }
    }

    if (query.from !== undefined || query.to !== undefined) {
        const range = {};
        if (query.from !== undefined) {
            const from = new Date(query.from);
            if (isNaN(from.getTime())) {
                errors.push(`Invalid "from" date: "${query.from}"`);
            } else {
                range.$gte = from;
            }
        }
        if (query.to !== undefined) {
            const to = new Date(query.to);
            if (isNaN(to.getTime())) {
                errors.push(`Invalid "to" date: "${query.to}"`);
            } else {
                to.setHours(23, 59, 59, 999);
                range.$lte = to;
            }
        }
        if (Object.keys(range).length) {
            filter[dateField] = range;
        }
    }

    if (allowCustomer && query.customer !== undefined) {
        if (!mongoose.isValidObjectId(query.customer)) {
            errors.push(`Invalid customer ID: "${query.customer}"`);
        } else {
            filter.customer = query.customer;
        }
    }

    return { filter, errors };
}

export function parseSort(query, allowedFields, defaultField = "createdAt") {
    const field = query.sortBy ?? defaultField;

    if (!allowedFields.includes(field)) {
        return {
            sort: null,
            error: `Invalid sortBy "${field}". Allowed: ${allowedFields.join(", ")}`,
        };
    }

    const order = query.order === "asc" ? 1 : -1;

    return { sort: { [field]: order }, error: null };
}
