// partial types for react-admin
declare module 'react-admin' {
    export const GET_LIST: string
    export const GET_ONE: string
    export const GET_MANY: string
    export const GET_MANY_REFERENCE: string
    export const CREATE: string
    export const UPDATE: string
    export const UPDATE_MANY: string
    export const DELETE: string
    export const DELETE_MANY: string

    export const fetchUtils: {
        fetchJson: any
    }
}