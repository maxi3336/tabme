import { IFolder } from "../newtab/helpers/types"

export interface APIResponseBase<T> {
  data: T
  statusCode: number
}

export type APIResponseEntityCreated = {id:number, success:true}
export type APIResponseEntityUpdatedOrDeleted = {success:true}

export type APIResponseGetToken = {token:string, message: string}

export type APIResponseDashboard = {
  folders: IFolder[]
}
