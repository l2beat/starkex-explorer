export type ControllerResult =
  | ControllerSuccessResult
  | ControllerNotFoundResult
  | ControllerRedirectResult

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
}
