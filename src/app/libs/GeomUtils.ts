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

/**
 * Typescript Math Toolkit: Common low-level utility methods for analytic geometry.  Although a PointUtils class is
 * available in the library, that class is designed to work with the Point class as a fundamental unit of coordinates.
 * Methods in this utility class use raw coordinate values and are independent from any specific point, coordinate, or
 * vector structure.
 *
 * Note that this class is intended for performance-critical environments, so error checking is at a minimum.
 *
 * @author Jim Armstrong (www.algorithmist.net)
 * 
 * @version 1.0
 */

import { TSMT$IRect } from "./IRect";
import { IPoint     } from "./IPoint";

export enum DirEnum
 {
   LEFT,
   RIGHT,
   ON
 }

export interface IProject
{
  x: number,
  y: number,
  d: number
}

export interface IProjectFromTo extends IProject
{
  fromX: number;
  fromY: number;
}

 // a more numerically robust floating-point compare (TODO replace with library util)
export function compare(a: number, b: number, tol: number): boolean
{
  if (a == b) {
    return true;
  }

  // pixel-based coordinates tend to not have very low tolerances, so we can be a bit 'loose' here
  const ma = Math.abs(a);
  const mb = Math.abs(b);

  if (ma < 0.000000001 && mb < 0.000000001 && tol > 0.0000001) {
    return true;
  }
  
  if (mb > ma)
  {
    return Math.abs((a - b) / b) <= tol;
  }
  else
  {
    return Math.abs((a - b) / a) <= tol;
  }
}

export class TSMT$GeomUtils
{
  protected ZERO_TOL: number   = 0.0000001;             // arbitrary zero-tolerance to use as default when tolerance not provided
  protected RAD_TO_DEG: number = 180/3.14159265359;     // convert radians to degrees
      
  // used in closest-points algorithm
  protected _best1: Object;
  protected _best2: Object;
  protected _bestDist: number;
      
  protected __t: number;
  protected __u: number;

  /**
   * Construct a new TSMT$GeomUtils instance
   *
   * @returns {nothing}
   */
  constructor()
  {
    this._best1    = {};
    this._best2    = {};
    this._bestDist = Number.MAX_VALUE;
      
    this.__t = 0;
    this.__u = 0;
   }
   
  /**
   * Is the point, (x1,y1) inside bounding box specified by the rectangle (left,top) to (right,bottom)?
   * 
   * @param {number} x1 x-coordinate of test point
   * 
   * @param {number} y1 y-coordinate of test point
   * 
   * @param {number} left x-coordinate of upper, left-hand corner of bounding box
   * 
   * @param {number} top y-coordinate of upper, left-hand corner of bounding box
   * 
   * @param {number} right x-coordinate or lower, right-hand corner of bounding box
   * 
   * @param {number} botton y-coordinate of lower, right-hand corner of bounding box
   * 
   * @returns {boolean} True if the specified point is strictly inside (not on the boundary) of the bounding box,
   * false otherwise.  The method takes y-up and y-down axis orientations into account.
   */
   public static insideBox(__x1: number, __y1: number, __left: number, __top: number, __right: number, __bottom: number ): boolean
   {
     const yDown: boolean = __bottom > __top;

	   if (yDown)
     {
       return __x1 > __left && __x1 < __right && __y1 > __top && __y1 < __bottom;
     }
	   else
     {
       return __x1 > __left && __x1 < __right && __y1 < __top && __y1 > __bottom;
     }
   }
    
  /**
   * Do two axis-aligned bounding boxes intersect?
   * 
   * @param {TSMT$IRect} bound1 Bounding-box object with left, top, right, and bottom properties for top-left point and bottom-right point
   * 
   * @param {TSMT$IRect} bound2 Bounding-box object with left, top, right, and bottom properties for top-left point and bottom-right point
   * 
   * @returns {boolean} True if bounding boxes intersect - a single point of contact is considered an intersection
   */
   public static boxesIntersect(bound1: TSMT$IRect, bound2: TSMT$IRect): boolean
   {
     // for a y-down coordinate system, bottom > top - reverse internally and copy to temp variables so that all
     // computations are y-up.
     const bound1Left:number   = bound1.left;
     const bound1Right:number  = bound1.right;
     const bound1Top:number    = bound1.top;
     const bound1Bottom:number = bound1.bottom;

     const bound2Left:number   = bound2.left;
     const bound2Right:number  = bound2.right;
     const bound2Top:number    = bound2.top;
     const bound2Bottom:number = bound2.bottom;

     const l1: number = bound1Left;
     const r1: number = bound1Right;
     const t1: number = bound1Top > bound1Bottom ? bound1Top : bound1Bottom;
     const b1: number = bound1Top > bound1Bottom ? bound1Bottom : bound1Top;
        
     const l2: number = bound2Left;
     const r2: number = bound2Right;
     const t2: number = bound2Top > bound2Bottom ? bound2Top : bound2Bottom;
     const b2: number = bound2Top > bound2Bottom ? bound2Bottom : bound2Top;
        
     if (l2 > r1)
     {
       return false;
     }
     else if (r2 < l1)
     {
       return false;
     }
     else if (t2 < b1)
     {
       return false;
     }
     else if (t1 < b2)
     {
       return false;
     }
     else if (r2 >= l1 && l2 <= r1)
     {
       return t2 >= b1 && b2 <= t1;
     }
   }
      
  /**
   * Is the specified point (x1,y1) to the left, on, or to the right of the line specified by two input points
   * (x2,y2) - (x3,y3)
   * 
   * @param {number} x1 x-coordinate of first point on line
   * 
   * @param {number} y1 y-coordinate of first point on line
   * 
   * @param {number} x2 x-coordinate of second point on line
   * 
   * @param {number} y2 y-coordinate of second point on line
   * 
   * @param {number} x x-coordinate of test point
   * 
   * @param {number} y -coordinate of test point
   * 
   * @returns {number} One of the codes DirEnum.LEFT, DirEnum.RIGHT, DirEnum.ON if the point is to the left, right, or
   * on the line, respectively.  Test for point exactly on the line is made first and within a tight tolerance to
   * accommodate for roundoff error.
   * 
   */
   public static pointOrientation(__x1: number,
                                  __y1: number,
                                  __x2: number,
                                  __y2: number,
                                  __x: number,
                                  __y: number): number
   {
     const test: number = ( (__x2 - __x1)*(__y - __y1) - (__x -  __x1)*(__y2 - __y1) );

     if (Math.abs(test) < 0.0001)
     {
       // on the line withing tolerance suitable for typical online drawing environment
       return DirEnum.ON;
     }
     else
     {
       return test > 0 ? DirEnum.LEFT : DirEnum.RIGHT;
     }
   }
      
  /**
   * Does the line segment from (x1,y1) to (x2,y2) intersect the bounding-box specified by the rectangle (left,top)
   * to (right,bottom)?
   * 
   * @param {number} x1 x-coordinate of test point
   * 
   * @param {number} y1 y-coordinate of test point
   * 
   * @param {number} left x-coordinate of upper, left-hand corner of bounding box
   * 
   * @param {number} top y-coordinate of upper, left-hand corner of bounding box
   * 
   * @param {number} right x-coordinate or lower, right-hand corner of bounding box
   * 
   * @param {number} botton y-coordinate of lower, right-hand corner of bounding box
   * 
   * @return boolean True if the line segment intersects any part of the specified rectangle, even if it touches
   * only at a single point
   */
   public intersectBox(__x1: number,
                       __y1: number,
                       __x2: number,
                       __y2: number,
                       __left: number,
                       __top: number,
                       __right: number,
                       __bottom: number ): boolean
   {
     var yDown: boolean = __bottom > __top;

     // test if segment is completely outside
     if ((__x1 < __left && __x2 < __left) || (__x1 > __right && __x2 > __right)) {
       return false;
     }
      
     // y-down
     if( yDown )
     {
       if ((__y1 < __top && __y2 < __top) || (__y1 > __bottom && __y2 > __bottom)) {
         return false;
       }
     }
     else
     {
       if ((__y1 < __bottom && __y2 < __bottom) || (__y1 > __top && __y2 > __top)) {
         return false;
       }
     }
    
     // test intersection with each segment of bounding-box
     if (this.segmentsIntersect(__x1, __y1, __x2, __y2, __left, __top, __right, __top)) {
       return true;
     }
    
     if (this.segmentsIntersect(__x1, __y1, __x2, __y2, __right, __top, __right, __bottom)) {
       return true;
     }
    
     if (this.segmentsIntersect(__x1, __y1, __x2, __y2, __right, __bottom, __left, __bottom)) {
       return true;
     }
    
     if (this.segmentsIntersect(__x1, __y1, __x2, __y2, __left, __bottom, __left, __top)) {
       return true;
     }
    
     return false;
   }
      
  /**
   * Return the two points of intersection between the line segment from (x1,y1) to (x2,y2) and the rectangle
   * (left,top) to (right,bottom) - this is intended for use after an intersection test as it is optimized for
   * the case where intersection is known to already exist.
   * 
   * @param {number} x1 x-coordinate of test point
   * 
   * @param {number} y1 y-coordinate of test point
   * 
   * @param {number} left x-coordinate of upper, left-hand corner of bounding box
   * 
   * @param {number} top y-coordinate of upper, left-hand corner of bounding box
   * 
   * @param {number} right x-coordinate or lower, right-hand corner of bounding box
   * 
   * @param {number} botton y-coordinate of lower, right-hand corner of bounding box
   * 
   * @returns {Object} - 'x1', 'y1', 'x2', and 'y2' properties of the intersection points (x1,y1) and (x2,y2)
   * with x2 >= x1.  If there is only one intersection point, i.e. one of the line segment points is inside the box,
   * then one of the coordinate sets will be null
   */
   public lineRectIntersection(__x1: number,
                               __y1: number,
                               __x2: number,
                               __y2: number,
                               __left: number,
                               __top: number,
                               __right: number,
                               __bottom: number): Object
   {
     let x1: number;
     let y1: number;
     let x2: number;
     let y2: number;

     // count number of intersections
     let count: number = 0;
        
     if (this.segmentsIntersect(__x1, __y1, __x2, __y2, __left, __top, __right, __top))
     {
       x1 = (1-this.__t)*__x1 + this.__t*__x2;
       y1 = (1-this.__t)*__y1 + this.__t*__y2;
       count++;
     }
    
     if (this.segmentsIntersect(__x1, __y1, __x2, __y2, __right, __top, __right, __bottom))
     {
       if (count == 0)
       {
         x1 = (1-this.__t)*__x1 + this.__t*__x2;
         y1 = (1-this.__t)*__y1 + this.__t*__y2;
       }
       else
       {
         x2 = (1-this.__t)*__x1 + this.__t*__x2;
         y2 = (1-this.__t)*__y1 + this.__t*__y2;
       }
       count++;
     }
    
     if (count < 2)
     {
       if (this.segmentsIntersect(__x1, __y1, __x2, __y2, __right, __bottom, __left, __bottom))
       {
         if (count == 0)
         {
           x1 = (1-this.__t)*__x1 + this.__t*__x2;
           y1 = (1-this.__t)*__y1 + this.__t*__y2;
         }
         else
         {
           x2 = (1-this.__t)*__x1 + this.__t*__x2;
           y2 = (1-this.__t)*__y1 + this.__t*__y2;
         }
         count++;
       }
     }
    
     if (count < 3)
     {
       if (this.segmentsIntersect(__x1, __y1, __x2, __y2, __left, __bottom, __left, __top))
       {
         if (count == 0)
         {
           x1 = (1-this.__t)*__x1 + this.__t*__x2;
           y1 = (1-this.__t)*__y1 + this.__t*__y2;
         }
         else
         {
           x2 = (1-this.__t)*__x1 + this.__t*__x2;
           y2 = (1-this.__t)*__y1 + this.__t*__y2;
         }
       }
     }
        
     if (x1 == undefined || x2 == undefined) {
       return {x1: Number.NaN, y1: Number.NaN, x2: Number.NaN, y2: Number.NaN};
     }
          
     if (x1 > x2)
     {
       return {x1: x2, y1: y2, x2: x1, y2: y1};
     }
     else
     {
       return {x1: x1, y1: y1, x2: x2, y2: y2};
     }
   }
  
  /**
   * Are the two points, (x1,y1) and (x2, y2) equal (to within a tolerance)?
   * 
   * @param {number} x1 x-coordinate of first point
   * 
   * @param {number} y1 y-coordinate of first point
   * 
   * @param {number} x2 x-coordinate of second point
   * 
   * @param {number} y2 y-coordinate of second point
   * 
   * @returns {boolean} True if the two points are equivalent to within a tolerance (currently 0.001 for each coordinate)
   */
   public pointsEqual(x1: number, y1: number, x2: number, y2: number): boolean
   {
	   return ( compare(x1, x2, 0.001) && compare(y1, y2, 0.001) );
   }
  
  /**
   * Do two lines defined by the points (x1,y1) - (x2,y2) and (x3,y3) - (x4,y4) intersect?
   * 
   * @param {number} x1 x-coordinate of initial point of first vector
   * 
   * @param {number} y1 y-coordinate of initial point of first vector
   * 
   * @param {number} x2 x-coordinate of terminal point of first vector
   * 
   * @param {number} y2 y-coordinate of terminal point of first vector
   *  
   * @param {number} x1 x-coordinate of initial point of first vector
   * 
   * @param {number} y1 y-coordinate of initial point of first vector
   * 
   * @param {number} x2 x-coordinate of terminal point of first vector
   * 
   * @param {number} y2 y-coordinate of terminal point of first vector
   * 
   * @return boolean True if the two lines intersect.
   */
   public linesIntersect(x1: number,
                         y1: number,
                         x2: number,
                         y2: number,
                         x3: number,
                         y3: number,
                         x4: number,
                         y4: number): boolean
   {
	   // coincident endpoints?
	   if (this.pointsEqual(x1, y1, x3, y3)) {
       return true;
     }
	  
	   if (this.pointsEqual(x1, y1, x4, y4)) {
       return true;
     }
	  
	   if (this.pointsEqual(x2, y2, x3, y3)) {
       return true;
     }
	  
	   if (this.pointsEqual(x2, y2, x4, y4)) {
       return true;
     }

	   // have to do it the hard way
	   let m1: number      = x2 - x1;
	   let m2: number      = x4 - x3;
	   const inf1: boolean = Math.abs(m1) < 0.00000001;
	   const inf2: boolean = Math.abs(m2) < 0.00000001;
	
	   m1 = inf1 ? m1 : (y2-y1) / m1;
	   m2 = inf2 ? m2 : (y4-y3) / m2;
	
	   if (inf1)
     {
       return !inf2;
     }
     else if (inf2)
     {
       return true;
     }
	   else
     {
       // must do a compare (equivalent slopes ==> parallel lines)
       return !compare(m1, m2, 0.001);
     }
   }
  
  /**
   * Do two line segments from points (x1,y1) - (x2,y2) and (x3,y3) - (x4,y4) intersect?
   * 
   * @param {number} x1 x-coordinate of initial point of first segment
   * 
   * @param {number} y1 y-coordinate of initial point of first segment
   * 
   * @param {number} x2 x-coordinate of terminal point of first segment
   * 
   * @param {number} y2 y-coordinate of terminal point of first segment
   *  
   * @param {number} x1 x-coordinate of initial point of second segment
   * 
   * @param {number} y1 y-coordinate of initial point of second segment
   * 
   * @param {number} x2 x-coordinate of terminal point of second segment
   * 
   * @param {number} y2 y-coordinate of terminal point of second segment
   * 
   * @returns {boolean} True if the two lines intersect. A full intersection test is performed - check bounding boxes of
   * the segments in advance if you expect a large number of tests with no possible intersection based on segments
   * completely to the left/right or top/bottom relative to one another.
   */
   public segmentsIntersect(px: number,
                            py: number,
                            p2x: number,
                            p2y: number,
                            qx: number,
                            qy: number,
                            q2x: number,
                            q2y: number): boolean
   {
     // Astute readers will recognize this as a 2D implementation of the Graphic Gems algorithm by Goldman.
     // There is really nothing new under the sun :)

     const rx: number = p2x - px;
     const ry: number = p2y - py;
     const sx: number = q2x - qx;
     const sy: number = q2y - qy;
        
     const tx: number = qx - px;
     const ty: number = qy - py;
        
     const num: number = this.__cross(tx, ty, rx, ry);
     const den: number = this.__cross(rx, ry, sx, sy);
        
     // co-linear test
     if (Math.abs(num) < 0.00000001 && Math.abs(den) < 0.00000001)
     {
       // intersecting points
       if (this.pointsEqual(px, py, qx, qy) ||
           this.pointsEqual(px, py, q2x, q2y) ||
           this.pointsEqual(p2x, p2y, qx, qy) ||
           this.pointsEqual(p2x, p2y, q2x, q2y)) {
         return true;
       }
          
       // overlap?
       return ( (qx - px < 0) != (qx - p2x < 0) ) || ( (qy - py < 0) != (qy - p2y < 0) );
     }

     // parallel segments?
     if (Math.abs(den) < 0.00000001) {
       return false;
     }

     this.__u = num/den;
     this.__t = this.__cross(tx, ty, sx, sy) / den;

     return (this.__t >= 0) && (this.__t <= 1) && (this.__u >= 0) && (this.__u <= 1);
   }
      
  /**
   * Intersection point of infinite lines between two segments
   * 
   * @param {number} x1 x-coordinate of initial point of first segment
   * 
   * @param {number} y1 y-coordinate of initial point of first segment
   * 
   * @param {number} x2 x-coordinate of terminal point of first segment
   * 
   * @param {number} y2 y-coordinate of terminal point of first segment
   *  
   * @param {number} x1 x-coordinate of initial point of second segment
   * 
   * @param {number} y1 y-coordinate of initial point of second segment
   * 
   * @param {number} x2 x-coordinate of terminal point of second segment
   * 
   * @param {number} y2 y-coordinate of terminal point of second segment
   * 
   * @return IPoint 'x' and 'y' properties contain the x- and y-coordinates of intersection point (for well-posed inputs).
   * This is NOT a general-purpose line-intersection method.  It is intended to be a fast algorithm for well-posed data, i.e.
   * lines are not co-linear or overlapping, and point data is well-defined.  There are no tests for bad data or outlier
   * conditions.
   * 
   */
   public lineIntersection(px: number,
                           py: number,
                           p2x: number,
                           p2y: number,
                           qx: number,
                           qy: number,
                           q2x: number,
                           q2y: number): IPoint
   {
     const rx: number = p2x - px;
     const ry: number = p2y - py;
     const sx: number = q2x - qx;
     const sy: number = q2y - qy;
         
     const tx: number = qx - px;
     const ty: number = qy - py;
         
     const den: number = this.__cross(rx, ry, sx, sy);
     const t: number   = this.__cross(tx, ty, sx, sy) / den;
     const t1: number  = 1 - t;
        
     return {x:t1*px + t*p2x, y:t1*py + t*p2y};
   }

  /**
   * Compute cross-product between two vectors, both based at the origin and with terminal points P1 and P2
   *
   * @param {number} p1x x-coordinate of P1
   *
   * @param {number} p1y y-coordinate of P1
   *
   * @param {number} p2x x-coordinate of P2
   *
   * @param {number} p2y y-coordinate of P2
   *
   * @private
   */
   protected __cross(p1x: number, p1y: number, p2x: number, p2y: number): number
   {
     return p1x*p2y - p1y*p2x;
   }
  
  /**
   * Compute the interior angle given three points, (x1,y1), (x2,y2), and (x3,y3) - (x2,y2) is the interior point
   *
   * @param {number} x1 x-coordinate of first point (x1,y1)
   * 
   * @param {number} y1 y-coordinate of first point (x1,y1)
   * 
   * @param {number} x2 x-coordinate of second point (x2,y2)
   * 
   * @param {number} y2 y-coordinate of second point (x2,y2)
   * 
   * @param {number} x3 x-coordinate of third point (x3,y3)
   * 
   * @param {number} y3 y-coordinate of third point (x3,y3)
   * 
   * @param {boolean} toDegreestrue if result is returned in degrees
   * @default false
   *
   * @returns {number} interior angle in degrees or radians, depending on toDegrees parameter
   *
   */
   public static interiorAngle(x1: number,
                               y1: number,
                               x2: number,
                               y2: number,
                               x3: number,
                               y3: number,
                               toDegrees: boolean=false): number
   {
     const v1x: number = x1 - x2;
     const v1y: number = y1 - y2;
     const v2x: number = x3 - x2;
     const v2y: number = y3 - y2;
      
     const v1 = Math.sqrt(v1x*v1x + v1y*v1y);
     const v2 = Math.sqrt(v2x*v2x + v2y*v2y);
      
     const innerProd = v1x*v2x + v1y*v2y;
      
     if (v1 <= 0.0000001 || v2 <= 0.0000001)
     {
       // that was easy ...
       return 0;
     }
     else
     {
       // TODO - very small magnitudes could cause numerical issues
       const result:number = Math.acos( innerProd/(v1*v2) );
        
       return toDegrees ? result*(180/3.14159265359) : result;
     }
   }
      
  /**
   * Is a sequence of points, P0, P1, P2 in clockwise or counter-clockwise order?
   * 
   * @param {number} x0 x-coordinate of P0
   * @param {number} y0 y-coordinate of P0
   * 
   * @param {number} x1 x-coordinate of P1
   * @param {number} y1 y-coordinate of P1
   * 
   * @param {number} x2 x-coordinate of P2
   * @param {number} y2 y-coordinate of P2
   *
   * @return boolean True if the point sequence is in CW order, false if CCW
   */
   public isClockwise(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): boolean
   {
     return !( (y2-y0)*(x1-x0) > (y1-y0)*(x2-x0) );
   }
      
  /**
   * Is an input point (rx,ry) anywhere on the line between two other points (px, py) and (qx, qy)
   * 
   * @param {number} rx x-coordinate of test point
   * 
   * @param {number} ry y-coordinate of test point
   * 
   * @param {number} px x-coordinate of first point on line
   * 
   * @param {number} py y-coordinate of first point on line
   * 
   * @param {number} qx x-coordinate of second point on line
   * 
   * @param {number} qy y-coordinate of second point on line
   * 
   * @returns {boolean} true if the input point is numerically 'close enough' to be considered on the line passing through
   * the two other points.  The test is designed for computer-based games and is performed very fast and without error
   * checking.  It also has a possible loss of significance if dealing with very close points of very small magnitude.
   */
   public pointOnLine(rx: number, ry: number, px: number, py: number, qx: number, qy: number): boolean
   {
     // test for small determinant where 'small' is based on pixel values typical in browser and mobile applications
     const det = (qx - px)*(ry - py) - (qy - py)*(rx - px);
        
     return Math.abs(det) < 0.001;
   }
      
  /**
   * Return the area of a triangle, given the three vertices.  This is a suitably popular geometric shape whose area is
   * often needed to be computed very fast in games or other online applications, so it is supplied as a separate utility.
   * Feel free to inline the code into an app.
   * 
   * @param {number} x1 x-coordinate of first vertex
   * 
   * @param {number} y1 y-coordinate of first vertex
   * 
   * @param {number} x2 x-coordinate of second vertex
   * 
   * @param {number} y2 y-coordinate of second vertex
   * 
   * @param {number} x3 x-coordinate of third vertex
   * 
   * @param {number} y3 y-coordinate of third vertex
   * 
   * @returns {number} Area of triangle.  No error-checking is performed on inputs for performance reasons.  For best
   * performance, in-line this code into an application after debugging.  Note that if the vertex order (i.e. CCW or CW)
   * can be guaranteed in advance, the Math.abs call can be removed.
   */
   public triangleArea(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): number
   {
     const a = x1*(y2-y3) + x2*(y3-y1) + x3*(y1-y2);
        
     return 0.5*Math.abs(a);
   }
      
  /**
   * Compute the intersection point(s) of two circles
   * 
   * @param {number} xc1 x-coordinate of first circle center
   * 
   * @param {number} yc1 y-coordinate of first circle center
   * 
   * @param {number} r1 First circle radius
   * 
   * @param {number} xc2 x-coordinate of second circle center
   * 
   * @param {number} yc2 y-coordinate of second circle center
   * 
   * @param {number} r2 Second circle radius
   * 
   * @returns {Array<IPoint>} Array of objects with 'x' and 'y' properties containing coordinates of intersection point(s).
   * The array is empty if the two circles do not intersect, they are coincident, or one circle is contained inside
   * another.  No error checking is performed in order to maximize performance.
   */
   public circleToCircleIntersection(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): Array<IPoint>
   { 
     let dx: number  = x1 - x0;                  // delta-x
     let dy: number  = y1 - y0;                  // delta-y
     const d: number = Math.sqrt(dx*dx + dy*dy); // distance between centers

     if (d > r0+r1 || d < Math.abs(r0-r1)) {
       return new Array<IPoint>();
     }
        
     if ( Math.abs(d) < 0.001 && Math.abs(r1-r0) < 0.001) {
       return new Array<IPoint>();
     }
        
     const r0sq: number = r0*r0;
     const a: number    = (r0sq - r1*r1 + d*d ) / (2*d);
     const h: number    = Math.sqrt( r0sq - a*a );

     // unit vector
     dx /= d;
     dy /= d;
        
     // points of intersection are (x3,y3) and possibly (x4,y4)
     const x2: number = x0 + a*dx;
     const y2: number = y0 + a*dy;
     const x3: number = x2 + h*dy;
     const y3: number = y2 - h*dx;
        
     const intersect: Array<IPoint> = [ {x:x3, y:y3} ];
     if (d != r0 + r1)
     {
       const x4: number = x2 - h*dy;
       const y4: number = y2 + h*dx;
       intersect.push( {x:x4, y:y4} );
     }
        
     return intersect;
   }
      
  /**
   * Return the distance from a single point, P, to a line segment passing through P0 and P1
   * 
   * @param {number} p0x x-coordinate of P0
   * @param {number} p0y y-coordinate of P0
   * 
   * @param {number} p1x x-coordinate of P1
   * @param {number} p1y y-coordinate of P1
   * 
   * @param {number} px x-coordinate of P
   * @param {number} py y-coordinate of P
   * 
   * @returns {number} Distance from P to line segment between P0 and P1, which could be greater than the distance
   * between P and the infinite line between P0 and P1
   */
   public pointToSegmentDistance(p0x: number, p0y: number, p1x: number, p1y: number, px: number, py: number): number
   {
     const vx: number = p1x - p0x;
     const vy: number = p1y - p0y;
        
     let wx: number = px - p0x;
     let wy: number = py - p0y;

     const c1: number = wx*vx + wy*vy;
     if (c1 <= 0) {
       return Math.sqrt(wx * wx + wy * wy);
     }
        
     const c2: number = vx*vx + vy*vy;
     if (c2 <= c1)
     {
       wx = p1x - px;
       wy = p1y - py;
          
       return Math.sqrt(wx*wx + wy*wy);
     }
        
     const b: number  = c1 / c2;
     const tx: number = p0x + b*vx;
     const ty: number = p0y + b*vy;
     const dx: number = px - tx;
     const dy: number = py - ty;
        
     return Math.sqrt( dx*dx + dy*dy);
   }

  /**
   * Return the point from projecting a single point, P, to a line segment passing through P0 and P1
   * 
   * @param {number} p0x x-coordinate of P0
   * @param {number} p0y y-coordinate of P0
   * 
   * @param {number} p1x x-coordinate of P1
   * @param {number} p1y y-coordinate of P1
   * 
   * @param {number} px x-coordinate of P
   * @param {number} py y-coordinate of P
   * 
   * @returns {IProject} 'x' and 'y' properties provide the closest point to P on P0-P1; 'd' is the distance to
   * the projected point
   */
   public projectToSegment(p0x: number, p0y: number, p1x: number, p1y: number, px: number, py: number): IProject
   {
     let dx: number     = p1x-p0x;
     let dy: number     = p1y-p0y;
     const norm: number = dx*dx + dy*dy;

     if (norm < this.ZERO_TOL) {
       return {x: p0x, y: p0y, d: 0};
     }

     let vx: number;
     let vy: number;

     const t: number = ( (px-p0x)*(p1x-p0x) + (py-p0y)*(p1y-p0y) ) / norm;
        
     if (t <= 0)
     {
       vx = p0x;
       vy = p0y;
     }
     else if (t >= 1)
     {
       vx = p1x;
       vy = p1y;
     }
     else
     {
       vx = p0x+t*dx
       vy = p0y+t*dy;
     }
        
     // distance to projected point
     dx = vx-px;
     dy = vy-py;
     const d: number  = Math.sqrt(dx*dx + dy*dy);
        
     return { x:vx, y:vy, d: d };
   }
      
  /**
   * Reflect a point cloud about a line passing through P0 and P1
   * 
   * @param {Array<IPoint>} points Array of input points to be reflected
   * 
   * @param {number} x0 x-coordinate of P0
   * 
   * @param {number} y0 y-coordinate of P0
   * 
   * @param {number} x1 x-coordinate of P1
   * 
   * @param {number} y1 y-coordinate of P1
   * 
   * @returns {Array<IPoint>} Reflected point cloud, provided that the line segment is (numerically) distinct; otherwise,
   * the original array is returned.
   */
   public reflect( points: Array<IPoint>, x0: number, y0: number, x1: number, y1: number ): Array<IPoint>
   {
     let p1x: number;
     let p1y: number;

     let dx: number = x1 - x0;
     let dy: number = y1 - y0;
     let d: number  = dx*dx + dy*dy;

     if (Math.abs(d) < this.ZERO_TOL)
     {
       // there is no line to reflect about, so the transformation defaults to an indentity
       return points;
     }

     const len: number = points.length;
     if (len == 0)
     {
       // no points to process
       return points;
     }
         
     const a: number = (dx*dx - dy*dy) / d;
     const b: number = 2*dx*dy / d;

     let i: number;
     let p: IPoint;

     const reflect: Array<IPoint> = new Array<IPoint>();
        
     for (i = 0; i < len; ++i)
     {
       p   = points[i];
       dx  = p.x - x0;
       dy  = p.y - y0;
       p1x = (a*dx + b*dy + x0); 
       p1y = (b*dx - a*dy + y0);

       reflect.push( {x:p1x, y:p1y} );
     }
      
     return reflect;
   }
     
  /**
   * Find the two points in a point cloud that are closest in terms of Euclidean distance
   * 
   * @param {Array<number>} xcoord Array of x-coordinates (point count is taken from the length of this array)
   * 
   * @param {Array<number>} ycoord Array of y-coordinates
   * 
   * @return {Array<IPoint>} Two-element array of Objects whose 'x' and 'y' properties contain the coordinates of the two closest
   * points - there is no error-checking for performance reasons.  The return array is empty if the point collection is
   * less than two.  Note that duplicate points may cause an issue and that is not scanned for at this time.  It may also
   * be the case that multiple points exist for which the minimum distance is the same.  Only the first point set identified
   * by the algorithm will be returned.
   */
   public closestPoints( _xcoord: Array<number>, _ycoord: Array<number> ): Array<Object>
   {
     // Attribution:  This is a mashup of code I wrote in C back in the early 90's and a Java code sent to me by a
     // colleague, but I do not have a reference for the Java author.

     if (!_xcoord || !_ycoord || !_xcoord.length || !_ycoord.length) {
       return [];
     }

     if (_xcoord.length != _ycoord.length) {
       return [];
     }
        
     const n: number = _xcoord.length;
     if (n == 0) {
       return [];
     }

     if (n == 1) {
       return [{x: _xcoord[0], y: _ycoord[0]}, {x: _xcoord[0], y: _ycoord[0]}];
     }

     const points: Array<Object> = new Array<Object>();
     if (n == 2)
     {
       points.push( {x:_xcoord[0], y:_ycoord[0]} );
       points.push( {x:_xcoord[1], y:_ycoord[1]} );
     }
        
     // create a point collection that is sorted on x-coordinate
     const p: Array<IPoint> = new Array<IPoint>();
     let i: number;

     for (i = 0; i < n; ++i) {
       p.push({x: _xcoord[i], y: _ycoord[i]});
     }

     // in-line a 'sort-on' for performance - leave room open for adding additional criteria
     const args: Array<string> = ['x'];
     p.sort
     (
       function(a: number | Object, b: number | Object): number
       {
         let props: Array<string> = args.slice();
         let prop: string         = props.shift();

         while (a[prop] == b[prop] && props.length) {
           prop = props.shift();
         }
              
         return a[prop] == b[prop] ? 0 : a[prop] > b[prop] ? 1 : -1;
        }
     );
        
     this._best1    = null;
     this._best2    = null;
     this._bestDist = Number.MAX_VALUE;
     
     let d: number;
     let dx: number;
     let dy: number;
        
     if( n == 3 )
     {
       // this is more efficient and takes advantage of x-sorting
       dx = p[1].x - p[0].x;
       dy = p[1].y - p[0].y;
       d  = Math.sqrt(dx*dx + dy*dy);
          
       this._bestDist = d;
          
       dx = p[2].x - p[1].x;
       dy = p[2].y - p[1].y;
       d  = Math.sqrt( dx*dx + dy*dy );
          
       if( d < this._bestDist )
       {
         return [p[1], p[2]];
       }
       else
       {
         return [p[0], p[1]];
       }
     }
        
     // now, for the fun part ...
     const pY: Array<IPoint> = p.slice();  // point set to be ordered/merged by y
     const n1: number        = n-1;
        
     this.__closestPoint( p, pY, 0, n1 );
        
     return [this._best1, this._best2];
   }

  /**
   * Return closest point in range (pointsByX sorted by x-coord, pointsByY sorted by y-coord)
   *
   * @private
   */
   protected __closestPoint( pointsByX: Array<IPoint>, pointsByY: Array<IPoint>, from: number, to: number ): number
   {
     let dx: number;
     let dy: number;
        
     // outlier
     if (to <= from) {
       return Number.MAX_VALUE;
     }

     // median point
     const mid: number    = Math.floor( from + (to - from)/2 );
     const median: IPoint = pointsByX[mid];
        
     // left-right sections (from-mid) and (mid-to)
     let left: number  = this.__closestPoint(pointsByX, pointsByY, from, mid);
     let right: number = this.__closestPoint(pointsByX, pointsByY, mid+1, to);
     let d: number     = Math.min(left, right);

     // this is clearly not very DRY, but performance is paramount
     const args: Array<string> = ['y'];
     pointsByY.sort
     (
       function(a: number | Object, b: number | Object): number
       {
         let props: Array<string> = args.slice();
         let prop:string          = props.shift();

         while (a[prop] == b[prop] && props.length) {
           prop = props.shift();
         }
              
         return a[prop] == b[prop] ? 0 : a[prop] > b[prop] ? 1 : -1;
        }
     );
        
     const tmp: Array<IPoint> = new Array<IPoint>();
     let m: number            = 0;
     let i:number;

     for (i = from; i <= to; ++i)
     {
       if (Math.abs( pointsByY[i].x - median.x ) < d) {
         tmp[m++] = pointsByY[i];
       }
     }
       
     let j: number;
     let distance: number;

     for (i = 0; i < m; ++i)
     {
       j = i+1;
          
       // this iteration count is limited by the presort
       while ((j < m) && (tmp[j].y - tmp[i].y < d))
       {
         dx = tmp[j].x - tmp[i].x;
         dy = tmp[j].y - tmp[i].y;
            
         distance = Math.sqrt(dx*dx + dy*dy);
         if (distance < d)
         {
           d = distance;
           if (d < this._bestDist)
           {
             this._bestDist = d;
             this._best1    = tmp[i];
             this._best2    = tmp[j];
           }
         }
            
         j++;
       }
     }
        
     return d;
   }
 }
