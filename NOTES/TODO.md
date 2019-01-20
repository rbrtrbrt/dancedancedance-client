[] change isDropTarget to not descend into substacks if block ins't a drop-target.
[] change getChildX getChildY to getChildPosition
[] remove id's
[] no automatic adding to parent, creating code also adds to parent.
[] c-blocks
  [] c-slots without blocks in them should have some min-height for the stack. This needs to work with reporting droptargets.
  [] dropping c-block onto itself destroys c-block
  [] c-blocks should be c
    [] top-bar and bottom-bar of c-block should participate in droptargets opening.
  [] redesign colors
  [] dragging block below c-block?
  [] nested-blocks animate when dropped, must jump.
  [] multiple c-slots
[] bug: dragging whole stack and dropping it onto itself does not move block.
[] it should be a bit easier to attach a block to top or bottom of stack.
[] color highlighting of blocks on hover.
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
BlockBackground:
  - accept dx,dy
  - use in position for SVG-tag

BlockStackBackground:
  - pure comp, does not accept dx,dy

BlockTitle:
  - pure comp, does not accept dx,dy
BlockFinalLabel:
  - pure comp, does not accept dx,dy

FieldSetUI:
  - accepts dx,dy
  - passes on to FieldUI
  - uses for positioning BlockTitle

BasicBlockUI:
  - accept dx,dy
  - passes on to FieldSetUI, BlockStackUI, BlockBackground
  - use in spring-params for BlockFinalLabel

BlockStackUI:
  - accepts dx,dy
  - uses in springparams for BlockStackBackground
  - passes on to BasicBlockUI, but plays animation through dx,dy.

DraggingBlocks:
   - does not accept dx,dy
   - calculates dx,dy from dragPosition.
   - adds to dy for blocks to place them beneath eachother.
   - also adds to dx,dy for dragCorrection.

How does a dragging block get moved when original makes space for dropgap?
- nothing changes in dx,dy calculations, but
- blockY changes.

Either we 
  1) totally ignore block.x and block.y
     But BasicBlockUI uses blockx,blocky, we'd need to override these.
  2) compensate for changes in block.x,block.y using dx,dy.
     How to detect changes during drag?
  3) make all coordinates (fieldsets, stacks, fields, finalLabels) relative to parent?