[] q: should we only have stackbackgrounds for 'top-blocks'? I.e. no stackbackgrounds for any old blockstack, just for those blocks that cannot sit below other blocks. 
  * Should we have stackbackgrounds for C-blocks outside of top-blocks? 
[] q: should we leave blockstack-ghost at original spot, or just the space for the stack? Or just a 2-line placeholder? 
  * How would this work with disjunct selections?
[] bug: double shadow when picking up blocks
[] bug: no shadow when dragging blocks without stackbackground
[] bug: dragging lower half of stack does not create blockstackbackground or shadow.
[] have dragcorrection happen when hovering (slowly?) over a blockstack.
[] scrolling while dragging
[] handle window deactivation while dragging
[] connecting blocks
  [] block can present drop-tragets
[] kibbitzers for allignment
[] c-blocks
[] palette
[] fields animate position
[] fields can live on canvas
[] fields can be (copy-)dragged to other blocks
-------------
[x] background for block-stack
[x] analyze & fix dropping on or near original location
[x] make sure form-fields don't run outside their blocks
[x] bug: block that's picked-up but not dragged lands, when dropped, in wrong location