import {LayoutCanvas} from "./layout_canvas"

import * as p from "../properties"
import {logger} from "../logging"
import {Side} from "../enums"
import {isString} from "../util/types"

// This table lays out the rules for configuring the baseline, alignment, etc. of
// title text, based on it's location and orientation
//
// side    orient        baseline   align     angle   normal-dist
// ------------------------------------------------------------------------------
// above   parallel      bottom     center    0       height
//         normal        middle     left      -90     width
//         horizontal    bottom     center    0       height
//         [angle > 0]   middle     left              width * sin + height * cos
//         [angle < 0]   middle     right             width * sin + height * cos
//
// below   parallel      top        center    0       height
//         normal        middle     right     90      width
//         horizontal    top        center    0       height
//         [angle > 0]   middle     right             width * sin + height * cos
//         [angle < 0]   middle     left              width * sin + height * cos
//
// left    parallel      bottom     center    90      height
//         normal        middle     right     0       width
//         horizontal    middle     right     0       width
//         [angle > 0]   middle     right             width * cos + height * sin
//         [angle < 0]   middle     right             width * cos + height + sin
//
// right   parallel      bottom     center   -90      height
//         normal        middle     left     0        width
//         horizontal    middle     left     0        width
//         [angle > 0]   middle     left              width * cos + height * sin
//         [angle < 0]   middle     left              width * cos + height + sin

const pi2 = Math.PI/2
const ALPHABETIC = 'alphabetic'
const TOP = 'top'
const BOTTOM = 'bottom'
const MIDDLE = 'middle'
const HANGING = 'hanging'
const LEFT = 'left'
const RIGHT = 'right'
const CENTER = 'center'

export type Orient = "parallel" | "normal" | "horizontal" | "vertical"
export type TextOrient = "justified" | Orient

const _angle_lookup: {[key in Side]: {[key in Orient]: number}} = {
  above: {
    parallel   : 0,
    normal     : -pi2,
    horizontal : 0,
    vertical   : -pi2,
  },
  below: {
    parallel   : 0,
    normal     : pi2,
    horizontal : 0,
    vertical   : pi2,
  },
  left: {
    parallel   : -pi2,
    normal     : 0,
    horizontal : 0,
    vertical   : -pi2,
  },
  right: {
    parallel   : pi2,
    normal     : 0,
    horizontal : 0,
    vertical   : pi2,
  },
}

const _baseline_lookup: {[key in Side]: {[key in TextOrient]: CanvasTextBaseline}} = {
  above: {
    justified  : TOP,
    parallel   : ALPHABETIC,
    normal     : MIDDLE,
    horizontal : ALPHABETIC,
    vertical   : MIDDLE,
  },
  below: {
    justified  : BOTTOM,
    parallel   : HANGING,
    normal     : MIDDLE,
    horizontal : HANGING,
    vertical   : MIDDLE,
  },
  left: {
    justified  : TOP,
    parallel   : ALPHABETIC,
    normal     : MIDDLE,
    horizontal : MIDDLE,
    vertical   : ALPHABETIC,
  },
  right: {
    justified  : TOP,
    parallel   : ALPHABETIC,
    normal     : MIDDLE,
    horizontal : MIDDLE,
    vertical   : ALPHABETIC,
  },
}

const _align_lookup: {[key in Side]: {[key in TextOrient]: CanvasTextAlign}} = {
  above: {
    justified  : CENTER,
    parallel   : CENTER,
    normal     : LEFT,
    horizontal : CENTER,
    vertical   : LEFT,
  },
  below: {
    justified  : CENTER,
    parallel   : CENTER,
    normal     : LEFT,
    horizontal : CENTER,
    vertical   : LEFT,
  },
  left: {
    justified  : CENTER,
    parallel   : CENTER,
    normal     : RIGHT,
    horizontal : RIGHT,
    vertical   : CENTER,
  },
  right: {
    justified  : CENTER,
    parallel   : CENTER,
    normal     : LEFT,
    horizontal : LEFT,
    vertical   : CENTER,
  },
}

const _align_lookup_negative: {[key in Side]: CanvasTextAlign} = {
  above  : RIGHT,
  below  : LEFT,
  left   : RIGHT,
  right  : LEFT,
}

const _align_lookup_positive: {[key in Side]: CanvasTextAlign} = {
  above  : LEFT,
  below  : RIGHT,
  left   : RIGHT,
  right  : LEFT,
}

export namespace SidePanel {
  export interface Attrs extends LayoutCanvas.Attrs {
    side: Side
  }

  export interface Props extends LayoutCanvas.Props {
    side: p.Property<Side>
  }
}

export interface SidePanel extends SidePanel.Attrs {}

export class SidePanel extends LayoutCanvas {

  properties: SidePanel.Props

  constructor(attrs?: Partial<SidePanel.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "SidePanel"

    this.internal({
      side: [ p.String ],
    })
  }

  protected _dim: 0 | 1
  protected _normals: [number, number]

  toString(): string {
    return `${this.type}(${this.id}, ${this.side})`
  }

  initialize(): void {
    super.initialize()
    switch(this.side) {
      case "above":
        this._dim = 0
        this._normals = [0, -1]
        break;
      case "below":
        this._dim = 0
        this._normals = [0, 1]
        break;
      case "left":
        this._dim = 1
        this._normals = [-1, 0]
        break;
      case "right":
        this._dim = 1
        this._normals = [1, 0]
        break;
      default:
        logger.error(`unrecognized side: '${this.side}'`)
    }
  }

  get dimension(): 0 | 1 {
    return this._dim
  }

  get normals(): [number, number] {
    return this._normals
  }

  get is_horizontal(): boolean {
    return this.side == "above" || this.side == "below"
  }

  get is_vertical(): boolean {
    return this.side == "left" || this.side == "right"
  }

  apply_label_text_heuristics(ctx: CanvasRenderingContext2D, orient: TextOrient | number): void {
    const side = this.side

    let baseline: CanvasTextBaseline
    let align: CanvasTextAlign

    if (isString(orient)) {
      baseline = _baseline_lookup[side][orient]
      align = _align_lookup[side][orient]
    } else {
      if (orient === 0) {
        baseline = "whatever" as any // XXX: _baseline_lookup[side][orient]
        align = "whatever" as any // XXX: _align_lookup[side][orient]
      } else if (orient < 0) {
        baseline = 'middle'
        align = _align_lookup_negative[side]
      } else {
        baseline = 'middle'
        align = _align_lookup_positive[side]
      }
    }

    ctx.textBaseline = baseline
    ctx.textAlign = align
  }

  get_label_angle_heuristic(orient: Orient): number {
    return _angle_lookup[this.side][orient]
  }
}

SidePanel.initClass()
