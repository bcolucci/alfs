'use strict'

const CELL_EMPTY = ' '
const CELL_OBSTACLE = 'x'
const CELL_FOOD = 'f'
const CELL_PHEROMONE = '.'

const ACTION_LOOKING_FOR_FOOD = 'lff'
const ACTION_GOING_BACK_HOME = 'gbh'

const Map = { width: 5, height: 3, cells: [], ants: [] }
const Seed = { obstacleRatio: 0.2, foodRatio: 0.6 }

const Cell = { x: 0, y: 0, content: CELL_EMPTY, ratio: 1 } 
const Ant = { x: 0, y: 0, action: ACTION_LOOKING_FOR_FOOD }

const middleOf = x => {
  const m = Math.round(x / 2)
  return m > 0 ? m - 1 : 0
}

const mapGenerator = (seed = Seed) => (width = Map.width, height = Map.height) => {
  const generateLine = (y, line = []) => {
    if (line.length === width) {
      return line
    }
    const content = Math.random() <= seed.obstacleRatio ? CELL_OBSTACLE 
      : (Math.random() <= seed.foodRatio ? CELL_FOOD : CELL_EMPTY)
    const cell = Object.assign({}, Cell, { x: line.length, y, content })
    return line.length === width ? line : generateLine(y, line.concat(cell))
  }
  return (function reduce(cells) {
    if (cells.length === height) {
      return Object.assign({}, Map, { width, height, cells, ants: [] })
    }
    return reduce(cells.concat([ generateLine(cells.length) ]))
  })(Map.cells)
}

const isValidPosition = (map, position) => {
  return position.x >= 0 && position.x < map.width
    && position.y >= 0 && position.y < map.height
}

const randomPositionFrom = (map, srcPosition) => {
  const randPosition = (function () {
    switch (Math.round(Math.random() * 7)) {
      case 0: return { x: srcPosition.x - 1, y: srcPosition.y - 1 }
      case 1: return { x: srcPosition.x, y: srcPosition.y - 1 }
      case 2: return { x: srcPosition.x + 1, y: srcPosition.y - 1 }
      case 3: return { x: srcPosition.x - 1, y: srcPosition.y }
      case 4: return { x: srcPosition.x + 1, y: srcPosition.y }
      case 5: return { x: srcPosition.x - 1, y: srcPosition.y + 1 }
      case 6: return { x: srcPosition.x, y: srcPosition.y + 1 }
      case 7: return { x: srcPosition.x + 1, y: srcPosition.y + 1 }
    }
  })()
  return isValidPosition(map, randPosition) ? randPosition : srcPosition
}

const antsGenerator = (nbAnts = 10) => map => {
  if (nbAnts === 0) {
    return map
  }
  const centerPosition = {
    x: middleOf(map.width),
    y: middleOf(map.height)
  }
  const antPosition = randomPositionFrom(map, centerPosition)
  const ant = Object.assign({}, Ant, {
    x: antPosition.x,
    y: antPosition.y
  })
  return antsGenerator(nbAnts - 1)(Object.assign(map, {
    ants: map.ants.concat(ant)
  }))
}

const cellsAround = map => srcPosition => {
  return []
    .concat({ x: srcPosition.x - 1, y: srcPosition.y - 1 })
    .concat({ x: srcPosition.x, y: srcPosition.y - 1 })
    .concat({ x: srcPosition.x + 1, y: srcPosition.y - 1 })
    .concat({ x: srcPosition.x - 1, y: srcPosition.y })
    .concat({ x: srcPosition.x + 1, y: srcPosition.y })
    .concat({ x: srcPosition.x - 1, y: srcPosition.y + 1 })
    .concat({ x: srcPosition.x, y: srcPosition.y + 1 })
    .concat({ x: srcPosition.x + 1, y: srcPosition.y + 1 })
    .filter(position => isValidPosition(map, position))
}

const getCell = map => position => map.cells[position.y][position.x]

const nextAntDirectionCalculator = map => ant => {
  const around = cellsAround(map)(ant).map(getCell(map))
  console.log(around)
}

const generateMap = mapGenerator()
const generateAnts = antsGenerator()
const emptyMap = generateMap()
const mapWithAnts = generateAnts(emptyMap)
const calculateAntNextPosition = nextAntDirectionCalculator(mapWithAnts)
calculateAntNextPosition({ x: 2, y: 2 })