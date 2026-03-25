export function getCustomers(userId, tenantId) {
    return {
        acme: {
            user: userId,
            tenant: tenantId,
            name: "James Whitfield",
            email: "j.whitfield@acme.com",
            phone: "+1 555 123 456",
            company: "ACME Corp",
            address: "123 Business St, New York, NY 10001",
        },
        nova: {
            user: userId,
            tenant: tenantId,
            name: "Sarah Chen",
            email: "sarah.chen@novadigital.io",
            phone: "+1 415 987 3210",
            company: "Nova Digital LLC",
            address: "742 Innovation Blvd, San Francisco, CA 94107",
        },
        stellar: {
            user: userId,
            tenant: tenantId,
            name: "Marcus Webb",
            email: "m.webb@stellardynamics.com",
            phone: "+44 20 7946 0958",
            company: "Stellar Dynamics Ltd",
            address: "88 Kingsway, London WC2B 6AA, UK",
        },
    }
}
