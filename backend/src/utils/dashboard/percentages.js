export const toPct = (count, total) =>
    total > 0 ? Math.round((count / total) * 100) : 0;
