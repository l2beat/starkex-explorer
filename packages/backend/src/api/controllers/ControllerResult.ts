export type ControllerResult =
  | ControllerSuccessResult
  | ControllerNotFoundResult
  | ControllerRedirectResult
  | ControllerCreatedResult
  | ControllerBadRequestResult

export interface ControllerSuccessResult {
  type: 'success'
  content: string
}

export interface ControllerNotFoundResult {
  type: 'not found'
  message: string
}

export interface ControllerRedirectResult {
  type: 'redirect'
  url: string
}

export interface ControllerCreatedResult {
  type: 'created'
  // eslint-disable-next-line @typescript-eslint/ban-types
  content: { id: number | string | String | Number }
}

export interface ControllerBadRequestResult {
  type: 'bad request'
  message: string
}
