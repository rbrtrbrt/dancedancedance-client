[x] change isDropTarget to not descend into substacks if block ins't a drop-target.
[] change getChildX getChildY to getChildPosition
[] remove id's
[] no automatic adding to parent, creating code also adds to parent.
[] c-blocks
  [x] c-slots without blocks in them should have some min-height for the stack. This needs to work with reporting droptargets.
  [x] dropping c-block onto itself destroys c-block
  [x] c-blocks should be c
    [x] top-bar and bottom-bar of c-block should participate in droptargets opening.
    [] top-bar and bottom-bar should animate
  [x] redesign colors
  [x] dragging block below c-block?
  [x] nested-blocks animate when dropped, must jump.
  [x] multiple c-slots
[] bug: dragging whole stack and dropping it onto itself does not move block.
[] it should be a bit easier to attach a block to top or bottom of stack.
[x] color highlighting of blocks on hover.
  * perhaps not leave ghost when dragging whole stack?  
[] q: should we only have stackbackgrounds for 'top-blocks'? I.e. no stackbackgrounds for any old blockstack, just for those blocks that cannot sit below other blocks. 
  * Should we have stackbackgrounds for C-blocks outside of top-blocks? 
[] q: should we leave blockstack-ghost at original spot, or just the space for the stack? Or just a 2-line placeholder? 
  * How would this work with disjunct selections?
[] have dragcorrection happen when hovering (slowly?) over a blockstack.
[] scrolling while dragging
[] handle window deactivation while dragging
[] kibbitzers for allignment
[] palette
[] fields animate position
[] fields can live on canvas
[] fields can be (copy-)dragged to other blocks
[] selection
  [] move selected block up/down
  [] multiple selection
  [] disjunct selection
[] copy-drag of blocks. 
-------------
[x] bug: dragging lower half of stack does not create blockstackbackground or shadow.
[x] connecting blocks
  [x] block can present drop-tragets
[x] bug: no shadow when dragging blocks without stackbackground
[x] background for block-stack
[x] analyze & fix dropping on or near original location
[x] make sure form-fields don't run outside their blocks
[x] bug: block that's picked-up but not dragged lands, when dropped, in wrong location


====================================
