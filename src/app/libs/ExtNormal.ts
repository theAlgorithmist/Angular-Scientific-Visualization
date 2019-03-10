/**
 * Copyright 2016 Jim Armstrong (www.algorithmist.net)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// interfaces
import { IPoint         } from "./IPoint";
import { IControlPoints } from "./IPlanarCurve";

// TSMT (computation-only) normal distribution class
import { TSMT$Normal } from "./Normal";

// geometry-related
import { TSMT$GeomUtils  } from "./GeomUtils";
import { TSMT$QuadBezier } from "./QuadBezier";

// split a bezier into two approximating quads
export interface ISplit
{
  left: IControlPoints;
  right: IControlPoints;
}

/**
 * Angular Dev Toolkit: Extended Normal distribution computations (adds graphing normal curve with sequence of
 * quadratic Bezier curves)
 *
 * @author Jim Armstrong (www.algorithmist.net)
 *
 * @version 1.0
 */
export class TSMT$ExtNormal extends TSMT$Normal
{
  protected _geomUtils: TSMT$GeomUtils;

  protected _bezier: TSMT$QuadBezier;

  /**
   * Construct a new {TSMT$ExtNormal}
   *
   * @returns {nothing}
   */
  constructor()
  {
    super();

    this._geomUtils = new TSMT$GeomUtils();
    this._bezier    = new TSMT$QuadBezier();
  }

 /**
  * Return a sequence of quadratic bezier curves that approximate the current normal curve over the
  * supplied interval
  *
  * @param {number} a Left endpoint of interval
  *
  * @param {number} b Right endpoint of interval, b > a
  *
  * @returns {Array<IControlPoints>} Sequence of quadratic bezier curves that approximate the current
  * normal distribution over the specified interval.  If b <= a, an empty array is returned. You break it,
  * you buy it.
  */
  public toBezier(a: number, b: number): Array<IControlPoints>
  {
    if (isNaN(a) || isNaN(b) || b <= a ) {
      return [];
    }

    // In terms of graphing, it is necessary to capture the single extreme point at x=u and the two
    // inflection points at x = u +/= s, provided they fall in [a,b], as interpolation points of
    // the quad. bezier sequence.
    //
    // One pass of iterative refinement (subdivision) has shown to be suitable for online or device-based
    // graphing applications.
    let stack: Array<IControlPoints> = new Array<IControlPoints>();
    if (a < this._mean)
    {
      stack = this.__leftOfMean(a, Math.min(this._mean, b) );

      if (b > this._mean) {
        stack = stack.concat(this.__rightOfMean(this._mean, b));
      }
    }
    else
    {
      stack = this.__rightOfMean(a, b);
    }

    return stack;
  }

  /**
   *  Compute bezier sequence for [a,c], c = min(u,b), where u is the current mean
   *
   *  @param {number} a Specifies left-hand x-coordinate of interval in which the normal curve is approximated
   *
   *  @param {number} b Specifies right-hand x-coordinate of interval in which the normal curve is approximated
   *
   *  @returns {nothing}
   *
   *  @private
   */
  protected __leftOfMean(a: number, b: number): Array<IControlPoints>
  {
    // left endpoint
    const x0: number = a;
    const y0: number = this.getNormal(a);
    let m: number    = this.getNormalDerivative(a);
    const x1: number = x0+1;
    const y1: number = y0+m;

    // first division is at inflection point u-s or midpoint if a >= u-s
    let xVal: number, yVal: number;
    let x2: number, x3: number, y2: number, y3: number;

    if( a < this._mean-this._std )
    {
      xVal = this._mean - this._std;
    }
    else
    {
      xVal = 0.5 * (a + b);
    }

    yVal = this.getNormal(xVal);

    // slope and vectors along either direction of the curve
    m  = this.getNormalDerivative(xVal);
    x2 = xVal+1;
    x3 = xVal-1;
    y2 = yVal+m;
    y3 = yVal-m;

    let o: IPoint = this._geomUtils.lineIntersection(x0, y0, x1, y1, xVal, yVal, x3, y3);

    let q: IControlPoints = {x0: x0, y0: y0, cx: o.x, cy: o.y, cx1: 0, cy1: 0, x1: xVal, y1: yVal};

    let split: ISplit;

    let stack: Array<IControlPoints> = new Array<IControlPoints>();
    if (this._std <= 1)
    {
      split = this.__split(q);
      stack = [split.left, split.right];
    }
    else
    {
      stack = [q];
    }

    let x4: number, y4: number, x5: number, y5: number;
    if (b == this._mean)
    {
      x4 = this._mean-1;
      y4 = 1/(this._std*TSMT$Normal.SQRT_2_PI);

      x5 = this._mean;
      y5 = y4;
    }
    else
    {
      x5 = b;
      y5 = this.getNormal(x5);
      m  = this.getNormalDerivative(x5);

      x4 = x5-1;
      y4 = y5-m;
    }

    o = this._geomUtils.lineIntersection(xVal, yVal, x2, y2, x5, y5, x4, y4);

    let r: IControlPoints = {x0: xVal, y0: yVal, cx: o.x, cy: o.y, cx1: 0, cy1: 0, x1: x5, y1: y5};

    stack.push(r);

    if (this._std <= 1)
    {
      // refine inner segments - final segment is tested for refinement in case right endpoint less
      // than mean or extremely small sigma
      let x: number, y: number, yNorm: number;
      let i: number;

      for (i=1; i<stack.length; ++i )
      {
        q = stack[i];

        this._bezier.fromObject(q);
        x = this._bezier.getX(0.5);
        y = this._bezier.getY(0.5);

        yNorm = this.getNormal(x);

        // this test is a bit arbitrary and is based on how closely you want to match for typical
        // online and device-based graphing applications.
        if (Math.abs(y-yNorm) > 0.025)
        {
          // refine - because of the shape of the normal curve, it will always be the rightmost segment
          // that may need further refining, but for most all
          // cases, one refinement is all that will be required.
          split    = this.__split(q);
          stack[i] = split.left;
          stack.splice(i+1, 0, split.right);
        }
      }

      // todo for extremely low sigmas, the final segment may need refining to better match curvature
      // at x=u.  See if this will be necessary based on actual user experience
    }

    return stack;
  }

  /**
   *  Compute bezier sequence for [c,b], c = max(a,u), where u is the current mean
   *
   *  @param {number} a Specifies left-hand x-coordinate of interval in which the normal curve is approximated
   *
   *  @param {number} b Specifies right-hand x-coordinate of interval in which the normal curve is approximated
   *
   *  @returns {nothing}
   *
   *  @private
   */
  protected __rightOfMean(a: number, b: number): Array<IControlPoints>
  {
    // left endpoint
    const x0: number = a;
    const y0: number = this.getNormal(a);

    let m: number  = this.getNormalDerivative(a);
    let x1: number = x0+1;
    let y1: number = y0+m;

    // first division is at inflection point u+s or midpoint if a >= u+s
    let xVal: number, yVal: number;
    let x2: number, x3: number, y2: number, y3: number;

    if (a < this._mean+this._std)
    {
      xVal = this._mean + this._std;
    }
    else
    {
      xVal = 0.5 * (a + this._mean + this._std);
    }

    yVal = this.getNormal(xVal);

    // slope and vectors along either direction of the curve
    m  = this.getNormalDerivative(xVal);
    x2 = xVal+1;
    x3 = xVal-1;
    y2 = yVal+m;
    y3 = yVal-m;

    let o: IPoint = this._geomUtils.lineIntersection(x0, y0, x1, y1, xVal, yVal, x3, y3);

    let q: IControlPoints = {x0: x0, y0: y0, cx: o.x, cy: o.y, cx1: 0, cy1: 0, x1: xVal, y1: yVal};

    let split: ISplit;
    const stack: Array<IControlPoints> = [q];

    let x4: number, y4: number, x5: number, y5: number;

    x5 = b;
    y5 = this.getNormal(x5);
    m  = this.getNormalDerivative(x5);
    x4 = x5-1;
    y4 = y5-m;

    o = this._geomUtils.lineIntersection(xVal, yVal, x2, y2, x5, y5, x4, y4);

    let r: IControlPoints = {x0: xVal, y0: yVal, cx: o.x, cy: o.y, cx1: 0, cy1: 0, x1: x5, y1: y5};

    if (this._std <= 1)
    {
      split = this.__split(r);
      stack.splice(1, 0, split.left, split.right);
    }
    else
    {
      stack.push(r);
    }

    if (this._std <= 1)
    {
      this._bezier = this._bezier || new TSMT$QuadBezier();

      // refine inner segments - similar to 'left of mean' except that all segments need refinement
      // test except last
      let x: number, y: number, yNorm: number;
      let i: number;
      for (i = 0; i < stack.length-1; ++i)
      {
        q = stack[i];

        this._bezier.fromObject(q);
        x = this._bezier.getX(0.5);
        y = this._bezier.getY(0.5);

        yNorm = this.getNormal(x);

        // this test is a bit arbitrary and is based on how closely you want to match for
        // typical online and device-based graphing applications.
        if (Math.abs(y-yNorm) > 0.025)
        {
          // refine - because of the shape of the normal curve, it will always be the rightmost segment
          // that may need further refining, but for most all cases, one refinement is all that will be required.
          split    = this.__split(q);
          stack[i] = split.left;

          stack.splice(i+1, 0, split.right);
        }
      }
    }

    return stack;
  }

  /**
   * Split a quad bezier at the approximate midpoint of the normal curve (not the bezier - this is not bezier subdivision);
   * take x at t = 0.5 as an approximation to the midpoint of the normal curve segment.
   *
   * @param {IControlPoints} Control points that specify a quadratic bezier curve
   *
   * @returns {ISplit}
   *
   * @private
   */
  protected __split(q: IControlPoints): ISplit
  {
    // get x at t = 0.5
    this._bezier.fromObject(q);

    let x0: number  = q.x0;
    let y0: number  = q.y0;
    let m: number   = this.getNormalDerivative(x0);
    let x0m: number = x0 + 1;
    let y0m: number = y0 + m;

    let xm = this._bezier.getX(0.5);
    let ym = this.getNormal(xm);

    m = this.getNormalDerivative(xm);

    let x1m: number = xm-1;
    let y1m: number = ym-m;

    // compute control point for left approximating quad.
    let o: IPoint = this._geomUtils.lineIntersection(x0, y0, x0m, y0m, xm, ym, x1m, y1m);

    const left: IControlPoints = {x0:  q.x0, y0: q.y0, cx: o.x, cy: o.y, cx1: 0, cy1: 0, x1: xm, y1: ym};

    // right quad bezier
    x0  = xm;
    y0  = ym;
    x0m = x0+1
    y0m = y0+m;

    const x1: number = q.x1;
    const y1: number = this.getNormal(x1);
    m                = this.getNormalDerivative(x1);

    x1m = x1-1;
    y1m = y1-m;

    // control point for right approximating quad.
    o = this._geomUtils.lineIntersection(x0, y0, x0m, y0m, x1, y1, x1m, y1m);

    const right: IControlPoints = {x0: x0, y0: y0, cx: o.x, cx1: 0, cy1: 0, cy: o.y, x1: x1, y1: y1};

    return {left:left, right:right};
  }
}
