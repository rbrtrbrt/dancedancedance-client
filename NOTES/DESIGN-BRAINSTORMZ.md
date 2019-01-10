

BasicBlockUI uses xx and yy props to determine where to draw the block. Blocks are drawn in a spot that's different from their (canvas) x and y when they're dragged or when they are animated by a parent component (blockstacks).

Blockstacks are not supplied with xx and yy props because they're never dragged, and they aren't animated by a parent.

C-blocks contain a blockstack (or many stacks), so those stacks _are_ sometimes drawn in a place that is different from their model-coords. But their coords are also different from the xx and yy that are passed as props to the C-block. They're basically:
  sub-thing.xx = subthing.x + (c-block.xx - cblock.x);
  sub-thing.yy = subthing.y + (c-block.yy - cblock.y);
  
We could just pass around adjustment values. That's neater, although we have to calc the adjustment for the animation and






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
