export const is_number = (x: any) => !isNaN(x);
export const is_string = (x: any) => typeof x == "string";
export const is_boolean = (x: any) => typeof x == "boolean";
export const is_array = (x: any) => Array.isArray(x);
export const is_set = (x: any) => x instanceof Set;
export const is_object = (x: any) => typeof x == "object";
export const is_null = (x: any) => x === null;
export const type_name = (x: any) => typeof x;
