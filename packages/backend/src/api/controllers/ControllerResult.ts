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
  message?: string
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
  message?: string
}

export function isControllerResult(data: unknown): data is ControllerResult {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    typeof data.type === 'string' &&
    (data.type === 'success' ||
      data.type === 'not found' ||
      data.type === 'redirect' ||
      data.type === 'created' ||
      data.type === 'bad request')
  )
}
