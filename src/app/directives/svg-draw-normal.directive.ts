/**
 * Copyright 2018 Jim Armstrong (www.algorithmist.net)
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

/**
 * Attribute directive used to render the normal distribution curve with SVG
 *
 * @author Jim Armstrong (www.algorithmist.net)
 *
 * @version 1.0
 */
import {
    Directive
  , ElementRef
  , OnInit
  , Input
  , Output
  , OnChanges
  , SimpleChange
  , SimpleChanges
  , EventEmitter
} from '@angular/core';

// math libraries/models
import { TSMT$ExtNormal } from '../libs/ExtNormal';
import { IControlPoints } from '../libs/IPlanarCurve';

import * as SVG from 'svg.js';

export type numericTriple = [number, number, number];

@Directive({
  selector: '[svgDrawNormal]'
})
export class SvgDrawNormalDirective implements OnInit, OnChanges
{
  /**
   * @type {number} hSpace Horizontal span in units (considered symmetric about zero on the x-axis); must be integer
   */
  @Input('hSpan')
  protected _hSpan: number;

  /**
   * @type {number} vSpan Vertical span in units (absolute with zero the implied minimum on the y-axis); must be integer
   */
  protected _vSpan: number;

  /**
   * @type {number} (integer) Horizontal Buffer space in px
   */
  @Input ('hBuffer')
  protected _hBuffer: number;

  /**
   * @type {number} (integer) Vertical buffer space in px
   */
  @Input ('vBuffer')
  protected _vBuffer: number;

  @Output ('drawingUpdated')
  protected _drawingUpdated: EventEmitter<numericTriple>;

  protected _div: HTMLDivElement;        // direct reference to the <div> for possible future use

  protected _surface: SVG.Doc;            // SVG Doc that serves as a Canvas

  // container dimensions in pixels
  protected _width: number;
  protected _height: number;

  // pixels per unit x and y
  protected _pxPerUnitX: number;
  protected _pxPerUnitY: number;

  // reference to the TSMT Extended Normal and current operation
  protected _normal: TSMT$ExtNormal = new TSMT$ExtNormal();

  // cache current x-value
  protected _x: number;

  /**
   * Construct a new SVG Container directive
   *
   * @param {ElementRef} _elementRef Injected element ref
   *
   * @returns {nothing}
   */
  constructor(protected _elementRef: ElementRef)
  {
    this._width      = 0;
    this._height     = 0;
    this._pxPerUnitX = 0;
    this._pxPerUnitY = 0;
    this._x          = 0;
    this._hBuffer    = 0;
    this._vBuffer    = 0;

    this._hSpan = 8;   // (initialize to -4 to 4 on the x-axis)
    this._vSpan = 1;   // (initialize to 0 to 1 on the y-axis)

    this._drawingUpdated = new EventEmitter<numericTriple>();

    // initialize the SVG surface and get prepped for drawing
    this._div        = this._elementRef.nativeElement;
    this._width      = this._div.clientWidth;
    this._height     = this._div.clientHeight;

    this._surface = SVG(this._div).size('100%', '100%').viewbox(0, 0, this._width, this._height);
  }

  /**
   * Angular lifecycle on init
   *
   * @returns {nothing} Initializes the SVG Canvas and prepares for rendering
   */
  public ngOnInit(): void
  {
    // reserved for future use
  }

  /**
   * Angular lifecycle on changes
   *
   * @param {SimpleChanges} changes Changes in databound properties
   *
   * @returns {nothing}
   */
  public ngOnChanges(changes: SimpleChanges): void
  {
    let prop: string;
    let change: SimpleChange;

    for (prop in changes)
    {
      change = changes[prop];

      switch (prop)
      {
        case 'hBuffer':
          if (change.currentValue !== undefined)
          {
            // set defaults, if necessary
            this._hBuffer = change.currentValue > 0 ? change.currentValue : 10;
          }
        break;

        case 'vBuffer':
          if (change.currentValue !== undefined)
          {
            // set defaults, if necessary
            this._vBuffer = change.currentValue > 0 ? change.currentValue : 5;
          }
        break;

        case 'hSpan':
          if (change.currentValue !== undefined)
          {
            // minor compensation for incorrect inputs
            this._hSpan = Math.round(Math.abs(change.currentValue));
          }
        break;

        case 'vSpan':
          if (change.currentValue !== undefined)
          {
            // minor compensation for incorrect inputs
            this._vSpan = Math.round(Math.abs(change.currentValue));
          }
        break;
      }
    }
  }

  /**
   * Assign a new x-coordinate in order to evaluate probability that X <= x and X > x
   *
   * @param {number} value x-coordinate; should be between +/- 4 sigma
   */
  public set x(value: number)
  {
    if (!isNaN(value) && this._normal.std > 0)
    {
      this._x = value;
      this.draw();
    }
  }

  /**
   * Initialize (or update) the normal curve with the specified parameters
   *
   * @param {number} mu Mean value
   * @param {number} sigma Standard deviation (must be greater than zero)
   * @param {number} x
   */
  public init(mu: number, sigma: number, x: number): void
  {
    this._normal.mean = mu;
    this._normal.std  = Math.abs(sigma);

    this.x = x;  // forces redraw
  }

  /**
   * Draw the normal curve onto the SVG surface; this should be preceded by a call to {init}.
   *
   * @returns {nothing} Subsequent calls to only the x-coordinate mutator are fine if the mean and std. dev. of the
   * distribution have not changed.
   */
  public draw(): void
  {
    // todo handle case where buffer spaces are too large for the drawing window
    const hBuffer: number = this._hBuffer === undefined || isNaN(this._hBuffer) ? 0 : Math.abs(Math.round(this._hBuffer));
    const vBuffer: number = this._vBuffer === undefined || isNaN(this._vBuffer) ? 0 : Math.abs(Math.round(this._vBuffer));

    // note: std dev should be greater than zero or computations will fail
    this._surface.clear();

    const mu: number = this._normal.mean;
    const a: number  = mu - 0.5*this._hSpan;
    const b: number  = mu + 0.5*this._hSpan;

    // output the drawing-updated parameters
    this._drawingUpdated.emit( [a, b, this._normal.getNormal(this._normal.mean)] );

    this._pxPerUnitX = (this._width - 2*hBuffer)/(b-a);
    this._pxPerUnitY = (this._height - 2*vBuffer)/this._vSpan;

    // approximate the current normal dist. with a sequence of quad beziers
    const controlPoints: Array<IControlPoints> = this._normal.toBezier(a, b);

    const n: number = controlPoints.length;
    let i: number;
    let quad: IControlPoints;

    let path: string = '';

    // note that the normal dist is computed based on a y-up orientation, but the SVG canvas is y-down
    for (i = 0; i < n; ++i)
    {
      quad = controlPoints[i];

      if (i == 0)
      {
        // moveTo
        path = 'M ' + ((quad.x0-a)*this._pxPerUnitX + hBuffer).toFixed(3) +
               ',' + (vBuffer + (this._vSpan-quad.y0)*this._pxPerUnitY + vBuffer).toFixed(3);
      }

      // quadBezierTo
      path += ' Q ' + ((quad.cx-a)*this._pxPerUnitX + hBuffer).toFixed(3) +
              ',' + (vBuffer + (this._vSpan-quad.cy)*this._pxPerUnitY).toFixed(3) +
              ' ' + ((quad.x1-a)*this._pxPerUnitX + hBuffer).toFixed(3) +
              ',' + (vBuffer + (this._vSpan-quad.y1)*this._pxPerUnitY).toFixed(3);
    }

    // draw the curve
    this._surface.path(path).fill('none').stroke({width: 2, color: '#0000ff'});

    // draw the vertical line segment from the x-axis to the normal curve at the currently specified x-coordinate
    const yNormal: number = this._normal.getNormal(this._x);
    const zero: string    = (vBuffer + (this._vSpan)*this._pxPerUnitY).toFixed(3);         // pixel value at y = 0
    const xPlot: string   = ((this._x-a)*this._pxPerUnitX + hBuffer).toFixed(3);           // pixel value at x = _x
    const yPlot: string   = (vBuffer + (this._vSpan-yNormal)*this._pxPerUnitY).toFixed(3); // pixel value at y = yNormal

    let linePath: string = 'M ' + xPlot + ',' + zero;
    linePath            += ' L ' + xPlot + ',' + yPlot;

    this._surface.path(linePath).fill('none').stroke({width: 2, color: '#ff0000'});
  }
}
