# measuring components

Best thing would be if react components can always tell what their size is, in an 
observable way.
But MST models don't hold links to React Component instances. Components do hold links to
their MST view-models. So we'll have to have the view-models hold the size, and be updated
whenever the component's size changes.
How does the component know that it needs to re-measure itself?
If it re-renders, we'll measure in componentDidUpdate()
If a child re-renders (without the parent re-rendering), we have two roads:
* have the child component inform the parent component (using an onUpdate prop)
* have the viewmodel for the child inform the viewmodel of the parent.

Things are a bit more complicated because a single viewmodel may have more than one view, and the
views may have different sizes. 
Suppose a block is enlarged in one view, resulting in movement of other blocks in the view, should these movements be visible in other views (remote of local)? 


So we need to make a ditinction between models and viewmodels:
- **models** contain the AST, including layout information that should be serialized when the program is saved, and any UI info that should be visible in other views (local/remote), like blocks being dragged.
- **viewmodels** contain transient state for a single view. Let's have the editormodel keep the viewmodels. The editormodel is a viewmodel itself.




# models

A Block has several Fields. Fields can be 'inline' (text, number,select,
reference), 'flag' (bool), 'container' for other blocks or `compound` (grouping
other fields). Fields can be required, required with (calculated) default,
strong optional (visible, but deletable) or weak optional (initially not
visible). Fields can have multiplicity: one, one-or-more, possibly bounded?
A field always has a name.

Blocks do not enforce a strict sequencing of inline fields. There is a 'defined'
or 'canonical' sequence, which can be attained using a clean-up command.
  --or--
There is a light concept of sequence, giving each field a place in a start, middle
or end?
  --or--
Multiple variants: overloading??

Blocks have a defined semantics coming from a 'definition' in a 'language'.
This language can live online, but it should be versioned. Online languages
could provide a 'piece of pallette', but should also provide search
capabilities. Perhaps even Language Server Protocol like features. Could we
sandbox such a server, and have it run client-side? perhaps in a web-worker?

Fields can be stand-alone entities, but without inherent semantics.
They can be copied and dropped on other blocks, taking on a role within the new
block that "matches" the field most closely. Dropping a field on another field
could copy just the value?

Blocks and Fields are 'canvas dwellers'
