import { Cheerio, Element, load } from 'cheerio'
import fsx from 'fs-extra'
import MarkdownIt from 'markdown-it'

import { renderHeading } from './renderHeading'

export function getHtmlFromMarkdown(filePath: string) {
  const markdown = MarkdownIt({ html: true })
  const file = fsx.readFileSync(filePath, 'utf-8')
  const rendered = markdown.render(file)
  const $ = load(rendered)
  $('a').each(function () {
    const $el = $(this)
    $el.attr('rel', 'noopener noreferrer')
  })
  $('h1, h2, h3, h4, h5, h6').each(function () {
    const $el = $(this)
    const html = renderHeading(
      //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      parseInt(this.tagName[1]!),
      $el.html(),
      getId($el)
    )
    $el.replaceWith($(html))
  })
  return $('body').html() ?? ''
}

function getId($el: Cheerio<Element>) {
  return (
    $el.attr('id') ??
    $el
      .text()
      .toLowerCase()
      .replace(/[^a-z\d]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
  )
}
