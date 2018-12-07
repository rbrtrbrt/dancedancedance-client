


 __above topblock:tb__
  bb = tb;
__dragb below non-lastblock:np__
  bb = np.blockBelow
  lb = dragb.lastblock
  np.removeBlock(bb)
  bb.anchor = new AnchorBeneathBlock(lb)
  lb.addBlock(dragb);
  fallthrough;
__dragb below lastblock:np__
  dragb.anchor = new AnchorBeneathBlock(np)
  np.addBlock(dragb)






ab = isAbove ? this.parent
bb = belowBlock
db = dragBlock
lb = lastDragBlock

if(bb) {
  if(ab) { ab.removeBlock(bb) }
  bb.anchor = new AnchorBeneathBlock(lb)
}
if(ab) {
  db.anchor = new AnchorBeneathBlock(ab)
  ab.addBlock(db)
} else {
  db.anchor = new AnchorOnCanvas(x,y)
  canvas.addBlock(db)
}





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
