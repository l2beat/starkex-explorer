# New frontend guide

1. There are two tailwind config files. Generally you only want to modify tailwind.config.js, the old one is for the old version
2. Old code lives in src/view/old. In the end we want to simply remove this folder, but you might find useful code there. Always think what's best: copy to new code or move old code outside and have the old code just import it from new code.
3. Preview has oldRoutes and routes. This is similar to tailwind.
4. New code generally lives in one of three folders `components`, `pages`, `utils` (some don't exist yet).
5. Example page code. The idea is that it's a small file that is just an interface to the backend. Most styling, functionality and other things should live ouside in the `components` folder.

```tsx
import React from 'react'
import { ExampleComponent } from '../components/ExampleComponent'
import { reactToHtml } from '../reactToHtml'

export interface HomePageProps {
  title: string
}

export function renderHomePage(props: HomePageProps) {
  return reactToHtml(<HomePage {...props} />)
}

function HomePage(props: HomePageProps) {
  return (
    <div>
      <ExampleComponent>Home Page: {props.title}</ExampleComponent>
    </div>
  )
}
```
