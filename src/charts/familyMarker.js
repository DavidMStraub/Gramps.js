import {fireEvent} from '../util.js'
import {chartPalette} from './palette.js'
import {isHoverDevice} from './util.js'

// Radius of a family's node, which fills most of the gap between the
// partners' cards
const nodeRadius = 12

// Half the visible gap between the cards of two adjacent partners, from the
// edge of one card to the colour stripe of the other
const halfGap = 18

// Position of a family's marker relative to its family node, at the height of
// the middle of the partners' cards. The colour stripe of a card reaches 4
// pixels past its left edge, so the gap between the two partners is centred
// 2 pixels left of the family node.
export const familyMarkerPosition = [-2, 0]

// Appends a node for the family of each node in the selection, in the gap
// between the cards of the two partners, on a line that joins the two cards.
// The node of a couple that is not married has a dashed outline. Partners who
// are not next to each other are joined by a bracket, which the caller draws.
export function appendFamilyMarker(nodes, {palette = chartPalette} = {}) {
  const [x, y] = familyMarkerPosition
  nodes
    .filter(d => !d.bracket)
    .append('line')
    .attr('class', 'partner-line')
    .attr('x1', x - halfGap)
    .attr('x2', x + halfGap)
    .attr('y1', y)
    .attr('y2', y)
    .attr('stroke', palette.familyMarker)
    .attr('stroke-width', 1.5)
  nodes
    .append('circle')
    .attr('class', d =>
      d.family?.type === 'Married' ? 'family-chip married' : 'family-chip'
    )
    .attr('r', nodeRadius)
    .attr('cx', x)
    .attr('cy', y)
    .attr('fill', palette.personBox)
    .attr('stroke', palette.familyMarker)
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', d =>
      d.family?.type === 'Married' ? null : '4 3'
    )
}

// Makes the node of each family in the selection open the preview of the
// family: on hover, like the cards of people, and pinned on a click or tap,
// which also reaches it on touch devices. A hovered node gets a darker
// outline.
export function setFamilyInteraction(nodes, {palette = chartPalette} = {}) {
  const show = (element, family, pinned) =>
    fireEvent(window, 'object:preview-show', {
      objectType: 'family',
      grampsId: family.gramps_id,
      anchorRect: element.getBoundingClientRect(),
      chart: true,
      pinned,
    })
  nodes
    .filter(d => d.family?.gramps_id)
    .select('.family-chip')
    .style('cursor', 'pointer')
    .on('mouseenter', function (event, d) {
      if (isHoverDevice()) {
        this.setAttribute('stroke', palette.text)
        show(this, d.family, false)
      }
    })
    .on('mouseleave', function () {
      if (isHoverDevice()) {
        this.setAttribute('stroke', palette.familyMarker)
        fireEvent(window, 'object:preview-hide')
      }
    })
    .on('click', function (event, d) {
      show(this, d.family, true)
    })
}
