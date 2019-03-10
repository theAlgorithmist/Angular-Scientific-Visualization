import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

// Data model
import { INormalModel } from '../models/models';
// rxjs
import { Observable,
         pipe
       } from 'rxjs';

import { catchError } from 'rxjs/internal/operators';

/**
 * A (very) simple http service to fetch model data for layout
 *
 * @author Jim Armstrong (www.algorithmist.net)
 *
 * @version 1.90
 */


@Injectable({
  providedIn: 'root'
})
export class ModelService
{
  /**
   * Construct a new ModelService
   *
   * @param {HttpClient} _http: Http Injected HttpClient instance
   */
  constructor(protected _http: HttpClient)
  {
    // empty
  }

  /**
   * Retrieve data from from the requested URL
   *
   * @param url: string URL of external service
   *
   * @return Observable<LayoutModel>
   */
  public getData(url: string): Observable<INormalModel>
  {
    if (url != "")
    {
      return this._http.get<INormalModel>(url)
        .pipe(
          catchError( (err: any, caught:Observable<any>) => this.__errHandler(err, caught) )
        );
    }
  }

  protected __errHandler( error: Response | any, caught: Observable<any> ): any
  {
    let errMsg: string = "DATA REQUEST FAILED: ";

    if (error instanceof Response)
    {
      const body: any = error.json() || '';
      const err: any  = body.error || JSON.stringify(body);

      errMsg += `${error.status} - ${error.statusText || ''} ${err}`;
    }
    else
    {
      errMsg += error.message ? error.message : error.toString();
    }

    // for demo purposes - modify as you see fit
    console.log( errMsg );
  }
}
