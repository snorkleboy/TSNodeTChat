export type TypeMapper<T extends { type: string }> = {
    [Type in T["type"]]: T extends { type: Type } ? T : never
}
