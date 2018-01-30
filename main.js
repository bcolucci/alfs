
const colors = require('colors/safe')
const pad = require('pad')

const CELL_EMPTY = ' '
const CELL_OBSTACLE = 'x'
const CELL_FOOD = 'f'
const CELL_PHEROMONE = '.'

const CELL_CONTENT = ' '.repeat(3)

const ACTION_LOOKING_FOR_FOOD = 'lff'
const ACTION_GOING_BACK_HOME = 'gbh'

const Map = {
  width: 20,
  height: 17,
  cells: [],
  ants: []
}

const Seed = {
  maxQuantity: 100,
  obstacleRatio: 0.10,
  foodRatio: 0.05
}

const Cell = {
  x: 0,
  y: 0,
  content: CELL_EMPTY,
  quantity: 1
}

const Ant = {
  x: 0,
  y: 0,
  action: ACTION_LOOKING_FOR_FOOD
}

const middleOf = x => {
  const m = Math.round(x / 2)
  return m > 0 ? m - 1 : 0
}

const isQuantitative = content => content === CELL_FOOD || content === CELL_PHEROMONE

const mapGenerator = (seed = Seed) => (width = Map.width, height = Map.height) => {
  const generateLine = (y, line = []) => {
    if (line.length === width) {
      return line
    }
    const content = Math.random() <= seed.obstacleRatio ? CELL_OBSTACLE
      : (Math.random() <= seed.foodRatio ? CELL_FOOD : CELL_EMPTY)
    const quantity = isQuantitative(content) ? Math.round(Math.random() * seed.maxQuantity) : 1
    const cell = Object.assign({}, Cell, { x: line.length, y, content, quantity })
    return line.length === width ? line : generateLine(y, line.concat(cell))
  }
  return (function reduce(cells) {
    if (cells.length === height) {
      return Object.assign({}, Map, { width, height, cells, ants: [] })
    }
    return reduce(cells.concat([ generateLine(cells.length) ]))
  })(Map.cells)
}

const xCoordinateValidator = map => x => x >= 0 && x < map.width
const yCoordinateValidator = map => y => y >= 0 && y < map.height

const sameCoordinates = c1 => c2 => c1.x === c2.x && c1.y === c2.y

const coordinateValidator = map => {
  const xValidator = xCoordinateValidator(map)
  const yValidator = yCoordinateValidator(map)
  return p => xValidator(p.x) && yValidator(p.y)
}

const cellsAround = map => {
  const coordValidator = coordinateValidator(map)
  return srcPosition => {
    return []
      .concat({ x: srcPosition.x - 1, y: srcPosition.y - 1 })
      .concat({ x: srcPosition.x, y: srcPosition.y - 1 })
      .concat({ x: srcPosition.x + 1, y: srcPosition.y - 1 })
      .concat({ x: srcPosition.x - 1, y: srcPosition.y })
      .concat({ x: srcPosition.x + 1, y: srcPosition.y })
      .concat({ x: srcPosition.x - 1, y: srcPosition.y + 1 })
      .concat({ x: srcPosition.x, y: srcPosition.y + 1 })
      .concat({ x: srcPosition.x + 1, y: srcPosition.y + 1 })
      .filter(coordValidator)
  }
}

const randomItem = arr => arr[Math.floor(Math.random() * arr.length)]

const randomMapPositionFrom = map => {
  const coordValidator = coordinateValidator(map)
  const aroundCells = cellsAround(map)
  return srcPosition => {
    const cells = aroundCells(srcPosition)
    return randomItem(cells)
  }
}

const antsGenerator = map => {
  const getRandomPositionFrom = randomMapPositionFrom(map)
  return (nbAnts = 10) => {
    if (nbAnts === 0) {
      return map
    }
    const centerPosition = {
      x: middleOf(map.width),
      y: middleOf(map.height)
    }
    const antPosition = getRandomPositionFrom(centerPosition)
    const ant = Object.assign({}, Ant, {
      x: antPosition.x,
      y: antPosition.y
    })
    return antsGenerator(Object.assign(map, {
      ants: map.ants.concat(ant)
    }))(nbAnts - 1)
  }
}

const getCell = map => position => map.cells[position.y][position.x]

const cellContentIs = content => cell => cell.content === content

const cellIsEmpty = cellContentIs(CELL_EMPTY)
const cellIsAnObstacle = cellContentIs(CELL_OBSTACLE)
const cellIsFood = cellContentIs(CELL_FOOD)
const cellIsPheromone = cellContentIs(CELL_PHEROMONE)

const sortByQuantity = order => (c1, c2) => {
  if (c1.quantity === c2.quantity) {
    return 0
  }
  return (order === 'asc' ? +1 : -1)
    * (c1.quantity - c2.quantity)
}

const selectCellFrom = cells => {
  const foodCells = cells.filter(cellIsFood)
  if (foodCells.length > 0) {
    return foodCells[0]
  }
  const pheromoneCells = cells.filter(cellIsPheromone)
  if (pheromoneCells.length > 0) {
    return pheromoneCells.sort(sortByQuantity('desc'))[0]
  }
  const emptyCells = cells.filter(cellIsEmpty)
  return randomItem(emptyCells)
}

const nextAntDirectionSelector = map => {
  const getCellsArount = cellsAround(map)
  return ant => {
    const cells = getCellsArount(ant).map(getCell(map))
    return selectCellFrom(cells)
  }
}

const cellQuantityStr = cell => pad(3, ''+cell.quantity)

const foodCellToStr = cell => colors.bgGreen(cellQuantityStr(cell))
const pheromoneCellToStr = cell => colors.bgOrange(cellQuantityStr(cell.quantity))

const antsQuantityColor = nbAnts => nbAnts === 0 ? 'bgBlack'
  : nbAnts <= 3 ? 'bgYellow'
  : nbAnts <= 10 ? 'bgMagenta'
  : 'bgRed'

const cellToStr = map => cell => {
  switch (cell.content) {
    case CELL_EMPTY:
      const nbAnts = map.ants.filter(sameCoordinates(cell)).length
      const content = nbAnts === 0 ? CELL_CONTENT : cellQuantityStr(cell)
      return colors[antsQuantityColor(nbAnts)](content)
    case CELL_OBSTACLE:
      return colors.bgWhite(CELL_CONTENT)
    case CELL_FOOD:
      return foodCellToStr(cell)
    case CELL_PHEROMONE:
      return pheromoneCellToStr(cell)
  }
}

const rowToStr = map => row => row.map(cellToStr(map)).join('')
const mapToStr = map => map.cells.map(rowToStr(map)).join('\n')

const generateMap = mapGenerator()
const emptyMap = generateMap()
const generateAnts = antsGenerator(emptyMap)
const mapWithAnts = generateAnts()

const computeGame = state => {
  const antNextPositionSelector = nextAntDirectionSelector(state.map)
  //TODO
  return Object.assign({}, state, {
    iteration: state.iteration + 1
  })
}

const gameLoop = state => {
  console.log('\033c')
  console.log("Iteration:", state.iteration)
  console.log(colors.bgBlack(mapToStr(state.map)))
  setTimeout(() => gameLoop(computeGame(state)), 1000)
}

gameLoop({
  iteration: 0,
  map: mapWithAnts
})