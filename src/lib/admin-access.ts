export function canViewAdmin(verifiedRole: unknown) { return verifiedRole === true; }
export function validTrendDays(days: number) { return [7, 30, 90].includes(days); }