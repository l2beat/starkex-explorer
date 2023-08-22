/* eslint-disable no-useless-escape */
export const tutorial = `<h1 id="an-h1-header"><a class="Heading-Title" href="#an-h1-header">An h1 header</a></h1>
<p>Paragraphs are separated by a blank line.</p>
<p>2nd paragraph. <em>Italic</em>, <strong>bold</strong>, and <code>monospace</code>. Itemized lists
look like:</p>
<ul>
<li>this one</li>
<li>that one</li>
<li>the other one</li>
</ul>
<p>Note that --- not considering the asterisk --- the actual text
content starts at 4-columns in.</p>
<blockquote>
<p>Block quotes are
written like so.</p>
<p>They can span multiple paragraphs,
if you like.</p>
</blockquote>
<p>Use 3 dashes for an em-dash. Use 2 dashes for ranges (ex., "it's all
in chapters 12--14"). Three dots ... will be converted to an ellipsis.
Unicode is supported. ☺</p>
<h2 id="an-h2-header"><a class="Heading-Title" href="#an-h2-header">An h2 header</a></h2>
<p>Here's a numbered list:</p>
<ol>
<li>first item</li>
<li>second item</li>
<li>third item</li>
</ol>
<p>Note again how the actual text starts at 4 columns in (4 characters
from the left side). Here's a code sample:</p>
<pre><code># Let me re-iterate ...
for i in 1 .. 10 { do-something(i) }
</code></pre>
<p>As you probably guessed, indented 4 spaces. By the way, instead of
indenting the block, you can use delimited blocks, if you like:</p>
<pre><code>define foobar() {
    print "Welcome to flavor country!";
}
</code></pre>
<p>(which makes copying &amp; pasting easier). You can optionally mark the
delimited block for Pandoc to syntax highlight it:</p>
<pre><code class="language-python">import time
# Quick, count to ten!
for i in range(10):
    # (but not *too* quick)
    time.sleep(0.5)
    print(i)
</code></pre>
<h3 id="an-h3-header"><a class="Heading-Title" href="#an-h3-header">An h3 header</a></h3>
<p>Now a nested list:</p>
<ol>
<li>
<p>First, get these ingredients:</p>
<ul>
<li>carrots</li>
<li>celery</li>
<li>lentils</li>
</ul>
</li>
<li>
<p>Boil some water.</p>
</li>
<li>
<p>Dump everything in the pot and follow
this algorithm:</p>
<pre><code>find wooden spoon
uncover pot
stir
cover pot
balance wooden spoon precariously on pot handle
wait 10 minutes
goto first step (or shut off burner when done)
</code></pre>
<p>Do not bump wooden spoon or it will fall.</p>
</li>
</ol>
<p>Notice again how text always lines up on 4-space indents (including
that last line which continues item 3 above).</p>
<p>Here's a link to <a href="http://foo.bar" rel="noopener noreferrer" target="_blank">a website</a>, to a <a href="local-doc.html" rel="noopener noreferrer" target="_blank">local
doc</a>, and to a <a href="#an-h2-header" rel="noopener noreferrer" target="_blank">section heading in the current
doc</a>. Here's a footnote [^1].</p>
<p>[^1]: Some footnote text.</p>
<p>Tables can look like this:</p>
<p>Name Size Material Color</p>
<hr>
<p>All Business 9 leather brown
Roundabout 10 hemp canvas natural
Cinderella 11 glass transparent</p>
<p>Table: Shoes sizes, materials, and colors.</p>
<p>(The above is the caption for the table.) Pandoc also supports
multi-line tables:</p>
<hr>
<p>Keyword Text</p>
<hr>
<p>red Sunsets, apples, and
other red or reddish
things.</p>
<p>green Leaves, grass, frogs
and other things it's
not easy being.</p>
<hr>
<p>A horizontal rule follows.</p>
<hr>
<p>Here's a definition list:</p>
<p>apples
: Good for making applesauce.</p>
<p>oranges
: Citrus!</p>
<p>tomatoes
: There's no "e" in tomatoe.</p>
<p>Again, text is indented 4 spaces. (Put a blank line between each
term and its definition to spread things out more.)</p>
<p>Here's a "line block" (note how whitespace is honored):</p>
<p>| Line one
| Line too
| Line tree</p>
<p>Inline math equation: $\omega = d\phi / dt$. Display
math should get its own line like so:</p>
<p>$$I = \int \rho R^{2} dV$$</p>
<p>And note that you can backslash-escape any punctuation characters
which you wish to be displayed literally, ex.: \`foo\`, *bar*, etc.</p>`
