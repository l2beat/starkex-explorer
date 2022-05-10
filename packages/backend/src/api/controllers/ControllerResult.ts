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
  content: string
}

export interface ControllerRedirectResult {
  type: 'redirect'
  url: string
}

export interface ControllerCreatedResult {
  type: 'created'
  content: { id: number }
}

export interface ControllerBadRequestResult {
  type: 'bad request'
  content: string
}
