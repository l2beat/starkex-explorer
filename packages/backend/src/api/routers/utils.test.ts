import { expect, mockObject } from 'earl'
import { Context } from 'koa'

import {
  ControllerBadRequestResult,
  ControllerCreatedResult,
  ControllerNotFoundResult,
  ControllerRedirectResult,
  ControllerSuccessResult,
} from '../controllers/ControllerResult'
import { applyControllerResult } from './utils'

const SUCCESS_RESULT: ControllerSuccessResult = {
  type: 'success',
  content: 'content',
}

const CREATED_RESULT: ControllerCreatedResult = {
  type: 'created',
  content: { id: 1 },
}

const BAD_REQUEST_RESULT: ControllerBadRequestResult = {
  type: 'bad request',
  message: 'content',
}

const NOT_FOUND_RESULT: ControllerNotFoundResult = {
  type: 'not found',
  message: 'content',
}

const REDIRECT_RESULT: ControllerRedirectResult = {
  type: 'redirect',
  url: 'url',
}

describe(applyControllerResult.name, () => {
  const ctx = mockObject<Context>({
    redirect: (url) => url,
  })

  it('handles success result', () => {
    applyControllerResult(ctx, SUCCESS_RESULT)
    expect(ctx.status).toEqual(200)
    expect(ctx.body).toEqual(SUCCESS_RESULT.content)
  })

  it('handles created result', () => {
    applyControllerResult(ctx, CREATED_RESULT)
    expect(ctx.status).toEqual(201)
    expect(ctx.body).toEqual(CREATED_RESULT.content)
  })

  it('handles bad request result', () => {
    applyControllerResult(ctx, BAD_REQUEST_RESULT)
    expect(ctx.status).toEqual(400)
    expect(ctx.customMessage).toEqual(BAD_REQUEST_RESULT.message)
  })

  it('handles not found result', () => {
    applyControllerResult(ctx, NOT_FOUND_RESULT)
    expect(ctx.status).toEqual(404)
    expect(ctx.customMessage).toEqual(NOT_FOUND_RESULT.message)
  })

  it('handles redirect result', () => {
    applyControllerResult(ctx, REDIRECT_RESULT)
    expect(ctx.redirect).toHaveBeenOnlyCalledWith(REDIRECT_RESULT.url)
  })
})
