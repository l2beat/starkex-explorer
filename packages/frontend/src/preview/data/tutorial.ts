import { HomeTutorialEntry } from '../../view'

/* eslint-disable no-useless-escape */
export const tutorial = `<h1 id="h1-heading-8"><a class="Heading-Title" href="#h1-heading-8">h1 Heading</a></h1>
<h2 id="h2-heading"><a class="Heading-Title" href="#h2-heading">h2 Heading</a></h2>
<h3 id="h3-heading"><a class="Heading-Title" href="#h3-heading">h3 Heading</a></h3>
<h4 id="h4-heading"><a class="Heading-Title" href="#h4-heading">h4 Heading</a></h4>
<h5 id="h5-heading"><a class="Heading-Title" href="#h5-heading">h5 Heading</a></h5>
<h6 id="h6-heading"><a class="Heading-Title" href="#h6-heading">h6 Heading</a></h6>
<h2 id="horizontal-rules"><a class="Heading-Title" href="#horizontal-rules">Horizontal Rules</a></h2>
<hr>
<hr>
<hr>
<h2 id="emphasis"><a class="Heading-Title" href="#emphasis">Emphasis</a></h2>
<p><strong>This is bold text</strong></p>
<p><strong>This is bold text</strong></p>
<p><em>This is italic text</em></p>
<p><em>This is italic text</em></p>
<p><s>Strikethrough</s></p>
<h2 id="blockquotes"><a class="Heading-Title" href="#blockquotes">Blockquotes</a></h2>
<blockquote>
<p>Blockquotes can also be nested...</p>
<blockquote>
<p>...by using additional greater-than signs right next to each other...</p>
<blockquote>
<p>...or with spaces between arrows.</p>
</blockquote>
</blockquote>
</blockquote>
<h2 id="lists"><a class="Heading-Title" href="#lists">Lists</a></h2>
<p>Unordered</p>
<ul>
<li>Create a list by starting a line with <code>+</code>, <code>-</code>, or <code>*</code></li>
<li>Sub-lists are made by indenting 2 spaces:
<ul>
<li>Marker character change forces new list start:
<ul>
<li>Ac tristique libero volutpat at</li>
</ul>
<ul>
<li>Facilisis in pretium nisl aliquet</li>
</ul>
<ul>
<li>Nulla volutpat aliquam velit</li>
</ul>
</li>
</ul>
</li>
<li>Very easy!</li>
</ul>
<p>Ordered</p>
<ol>
<li>
<p>Lorem ipsum dolor sit amet</p>
</li>
<li>
<p>Consectetur adipiscing elit</p>
</li>
<li>
<p>Integer molestie lorem at massa</p>
</li>
<li>
<p>You can use sequential numbers...</p>
</li>
<li>
<p>...or keep all the numbers as <code>1.</code></p>
</li>
</ol>
<p>Start numbering with offset:</p>
<ol start="57">
<li>foo</li>
<li>bar</li>
</ol>
<h2 id="code"><a class="Heading-Title" href="#code">Code</a></h2>
<p>Inline <code>code</code></p>
<p>Indented code</p>
<pre><code>// Some comments
line 1 of code
line 2 of code
line 3 of code
</code></pre>
<p>Block code "fences"</p>
<pre><code>Sample text here...
</code></pre>
<h2 id="tables"><a class="Heading-Title" href="#tables">Tables</a></h2>
<table>
<thead>
<tr>
<th>Option</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>data</td>
<td>path to data files to supply the data that will be passed into templates.</td>
</tr>
<tr>
<td>engine</td>
<td>engine to be used for processing templates. Handlebars is the default.</td>
</tr>
<tr>
<td>ext</td>
<td>extension to be used for dest files.</td>
</tr>
</tbody>
</table>
<p>Right aligned columns</p>
<table>
<thead>
<tr>
<th style="text-align:right">Option</th>
<th style="text-align:right">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:right">data</td>
<td style="text-align:right">path to data files to supply the data that will be passed into templates.</td>
</tr>
<tr>
<td style="text-align:right">engine</td>
<td style="text-align:right">engine to be used for processing templates. Handlebars is the default.</td>
</tr>
<tr>
<td style="text-align:right">ext</td>
<td style="text-align:right">extension to be used for dest files.</td>
</tr>
</tbody>
</table>
<h2 id="links"><a class="Heading-Title" href="#links">Links</a></h2>
<p><a href="http://dev.nodeca.com" rel="noopener noreferrer" target="_blank">link text</a></p>
<p><a href="http://nodeca.github.io/pica/demo/" title="title text!" rel="noopener noreferrer" target="_blank">link with title</a></p>
<h2 id="images"><a class="Heading-Title" href="#images">Images</a></h2>
<p><img src="https://octodex.github.com/images/minion.png" alt="Minion">
`

export const tutorials: HomeTutorialEntry[] = [
  {
    title: 'Learn how to use StarkEx Explorer efficiently',
    imageUrl: '/images/tutorial.jpg',
    slug: 'learn-how-to-use-starkex-explorer-efficiently',
  },
  {
    title: 'All about forced transactions',
    imageUrl: '/images/tutorial.jpg',
    slug: 'all-about-forced-transactions',
  },
  {
    title: 'Stark key registration',
    imageUrl: '/images/tutorial.jpg',
    slug: 'stark-key-registration',
  },
  {
    title: 'Escape hatches explained',
    imageUrl: '/images/tutorial.jpg',
    slug: 'escape-hatch-explained',
  },
]
