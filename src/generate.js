import { colord, extend } from 'colord'
import a11yPlugin from "colord/plugins/a11y"

extend([a11yPlugin])

import Curves from './curves'

export const easingCurves = Object.keys(Curves)
export const generatePalette = generate

function distribute(value, rangeA, rangeB) {

  const [fromLow, fromHigh] = Array.from(rangeA)
  const [toLow, toHigh] = Array.from(rangeB)

  const result = toLow + (((value - fromLow) / (fromHigh - fromLow)) * (toHigh - toLow));

  if (toLow < toHigh) {
    if (result < toLow) { return toLow }
    if (result > toHigh) { return toHigh }
  } else {
    if (result > toLow) { return toLow }
    if (result < toHigh) { return toHigh }
  }

  return result;
}

function generate({specs}) {

  function generateNumberOfSteps(curve, steps) {
    var array = []
    for (var step in Array.from(Array(steps).keys())) {
      const value = curve(step / (steps - 1))
      array.push(value)

    }
    array.reverse()
    return array
  }

  var lum_array = generateNumberOfSteps(Curves[specs.lum_curve], specs.steps)
  var sat_array = generateNumberOfSteps(Curves[specs.sat_curve], specs.steps)
  var hue_array = generateNumberOfSteps(Curves[specs.hue_curve], specs.steps)
  var lum_array_adjusted = []
  var sat_array_adjusted = []
  var hue_array_adjusted = []

  for (var index in lum_array) {
    const step = lum_array[index]
    lum_array_adjusted.push(distribute(step, [0, 1], [specs.lum_end, specs.lum_start], true))
  }


  for (var index in sat_array) {
    const step = sat_array[index]
    var sat_step = distribute(step, [0, 1], [specs.sat_start, specs.sat_end], true)

    sat_step = sat_step * (specs.sat_rate * .01)
    sat_array_adjusted.push(sat_step)
  }

  for (var index in hue_array) {
    const step = hue_array[index]
    hue_array_adjusted.push(distribute(step, [0,1], [specs.hue_start, specs.hue_end]))
  }

  sat_array_adjusted.reverse()
  hue_array_adjusted.reverse()

  lum_array = lum_array_adjusted
  sat_array = sat_array_adjusted
  hue_array = hue_array_adjusted

  var colorMap = []

  for (var index in lum_array) {
    var [hue, saturation, luminosity] = [
      hue_array[index],
      sat_array[index],
      lum_array[index],
    ]

    if (saturation > 100) { saturation = 100 }

    const color = colord({ h: hue, s: saturation, l: luminosity })
    const hsl = color.toHsl()

    const contrastWhite = color.contrast("white")
    const contrastBlack = color.contrast("black")

    var displayColor = ""
    if (contrastWhite < 4.5) { displayColor = "white" } else { displayColor = "black" }

    var colorObj = {
      hsl,
      hex: color.toHex(),
      hsv: color.toHsv(),
      rgb: color.toRgb(),
      hue: hsl.h,
      sat: hsl.s,
      lum: hsl.l,
      hueRange: [specs.hue_start, specs.hue_end],
      steps: specs.steps,
      label: specs.modifier * index,
      contrastBlack: contrastBlack,
      contrastWhite: contrastWhite,
      displayColor: displayColor,
    }
    colorMap.push(colorObj)
  }

  return colorMap
}
