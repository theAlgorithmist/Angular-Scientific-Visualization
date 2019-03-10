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
 * Main App Components for the Angular normal-distribution demo
 *
 * @author Jim Armstrong
 *
 * @version 1.0
 */
import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild
} from '@angular/core';

// models and service
import { INormalModel } from './models/models';
import { ModelService } from './services/model.service';

// this is responsible for the SVG rendering
import {
        numericTriple
      , SvgDrawNormalDirective
} from './directives/svg-draw-normal.directive';

@Component({
  selector: 'app-root',

  templateUrl: './app.component.html',

  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit
{
  // normal distribution parameters (used for two-way binding)
  public mu: number      = 0;
  public sigma: number   = 1;
  public x: number       = 1;
  public problem: string = '';

  // these are used to bind values from the SVG drawing to the UI
  public xMin: number;
  public xMax: number;
  public maxNormal: number;

  // reference to the SVG Container for rendering
  @ViewChild(SvgDrawNormalDirective)
  protected _svgContainer: SvgDrawNormalDirective;

  /**
   * Construct a new AppComponent
   *
   * @param {ModelService} _modelService Injected reference to the service that reads the model data
   *
   * @returns {nothing}
   */
  constructor(protected _modelService: ModelService)
  {
    // initial values are kind of hard to guess at, but these are in the ballpark of reasonable
    this.xMin      = -4;
    this.xMax      = 4;
    this.maxNormal = 0.4;
  }

  /**
   * Angular lifecycle on init
   *
   * @returns {nothing}
   */
  public ngOnInit(): void
  {
    // simulate loading a layout or model from a server
    this._modelService.getData('./assets/models/normal-problem.json').subscribe( (data: INormalModel) => this.__onModelLoaded(data) );
  }

  /**
   * Angular lifecycle after view init
   *
   * @returns {nothing}
   */
  public ngAfterViewInit(): void
  {
    // reserved for future use
  }

  /**
   * Respond to user changes in the normal parameters (i.e. mean/std. dev/x-value)
   *
   * @returns {nothing}
   *
   * @internal
   */
  public onChange(): void
  {
    // redraw (init does double-duty :)
    this._svgContainer.init(this.mu, this.sigma, this.x);
  }

  /**
   * Update local (bound) variables based on a drawing update from the SVG container
   *
   * @param {numericTriple} value Triple containing x-min, x-max, and max-normal values
   *
   * @returns {nothing}
   *
   * @internal
   *
   */
  public onDrawingUpdated(value: numericTriple): void
  {
    [this.xMin, this.xMax, this.maxNormal] = value;
  }

  /**
   * Execute when the external model is loaded; the model contains the values to initialize the normal curve
   *
   * @param {INormalModel} data Layout data
   *
   * @returns {nothing}
   *
   * @private
   */
  protected __onModelLoaded(data: INormalModel): void
  {
    // initialize the display
    if (data)
    {
      this.mu      = data.mu;
      this.sigma   = data.sigma;
      this.x       = data.x;
      this.problem = data.problem;  // todo reflect this in the UI in some meaningful way

      // initialize the drawing
      this.onChange();
    }
  }
}
