# Angular Normal Distribution Graphing

This is the code base for the Medium article, [Scientific Visualization With Angular](https://medium.com/ngconf/scientific-visualization-with-angular-24f2539aef23).

 
Author:  Jim Armstrong - [The Algorithmist](http://www.algorithmist.net)

@algorithmist

theAlgorithmist [at] gmail [dot] com

Angular: 7.2.0

SVG.js 2.7.0

Typescript: 3.2.2

Angular CLI: 7.2.2

Version: 1.0

## Introduction

This code distribution is deconstructed in the Medium article.  In short, this application illustrates how to dynamically draw a function graph in an SVG container, using an Angular Attribute Directive to manage parent container assignment and SVG rendering.  The example function in this demo is the [venerable normal distribution curve](https://en.wikipedia.org/wiki/Normal_distribution). 

The user-adjustable vertical graph span is currently set to cover the full normal curve with a standard deviation as low as 0.4.  Lower values will likely have some of the display clipped at the upper range of the distribution.  Mean, standard deviation and a vertical line from the x-axis to the value of the normal curve at a given x-coordinate may be changed.  Be aware that shifts in the mean may cause the vertical line to seem to disappear because the computed y-coordinate is too small.  For best use, keep this x-coordinate value relatively close to the mean. 

Several low-level libraries from my Typescript Math Toolkit are provided to handle computations relative to the normal distribution, and approximation of the normal curve by a quadratic Bezier spline.

## Low-level Testing

A set of specs (Mocha/Chai) are provided that exercise the _TSMT$Normal_ class and provide further examples of its usage.  To run the tests,

Gulp should be installed globally.

- gulp compile
- gulp test

Specs reside in the _specs/normal.specs.ts_ file.

I hope you find something of interest in the code.

Enjoy!!

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).


License
----

Apache 2.0

**Free Software? Yeah, Homey plays that**

[//]: # (kudos http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)
