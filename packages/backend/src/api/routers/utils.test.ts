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
  content: 'content',
}

const NOT_FOUND_RESULT: ControllerNotFoundResult = {
  type: 'not found',
  content: 'content',
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
    expect(ctx.body).toEqual(BAD_REQUEST_RESULT.content)
  })

  it('handles not found result', () => {
    applyControllerResult(ctx, NOT_FOUND_RESULT)
    expect(ctx.status).toEqual(404)
    expect(ctx.body).toEqual(NOT_FOUND_RESULT.content)
  })

  it('handles redirect result', () => {
    applyControllerResult(ctx, REDIRECT_RESULT)
    expect(ctx.redirect).toHaveBeenOnlyCalledWith(REDIRECT_RESULT.url)
  })
})
