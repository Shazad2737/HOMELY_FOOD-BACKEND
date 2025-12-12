export const prepareEnumsForView = (enumsObj) => {
    return Object.fromEntries(
        Object.entries(enumsObj).map(([key, val]) => [key, Object.values(val)])
    )
}
