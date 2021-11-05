const fs = require('fs')
    , { execSync } = require('child_process')
    , path = require('path')

const defaultInput = path.join(__dirname, 'input')
    , defaultOutput = path.join(__dirname, 'output')

const ignoreFiles = ['.DS_Store']

const size = {
  width: 512,
  height: 512
}

const checkOrCreateFolder = path => {
  try {
    const stat = fs.lstatSync(path)
    return !stat.isFile()
  } catch (e) {
    fs.mkdirSync(path)
    return true
  }
}

;(async ({ input = defaultInput, output = defaultOutput }) => {
  if (!checkOrCreateFolder(input)) {
    console.error('Input not folder')
    process.exit(0)
  }

  if (!checkOrCreateFolder(output)) {
    console.error('Output not folder')
    process.exit(0)
  }

  fs.readdirSync(output)
    .filter(file => !ignoreFiles.find(ifile => ifile === file))
    .forEach(file => fs.unlinkSync(path.join(output, file)))

  const inputFiles = fs.readdirSync(input)
    .filter(file => !ignoreFiles.find(ifile => ifile === file))

  if (inputFiles.length === 0) {
    console.error('Input empty folder')
    process.exit(0)
  }

  console.log('File length: ' + inputFiles.length)

  inputFiles.forEach((file, i) => {
    const progress = 'progress: '+ parseInt((i + 1) * (100 / inputFiles.length)) + '%'
    try {
      execSync(`convert "${path.join(input, file)}" "${path.join(output, file.replace(/\..+$/, '.png'))}"`)
      console.log('CONVERT to format PNG: ' + file, progress)
    } catch (e) {
      console.log('ERROR to format PNG: ' + file, progress)
    }
  })

  fs.readdirSync(output)
    .map(file => file.replace(/\..+$/, '.png'))
    .forEach((file, i) => {
    const [_width, _height] = execSync(`identify -ping -format '%w %h' "${path.join(output, file)}"`).toString().split(' ')

    const width = parseInt(_width)
    const height = parseInt(_height)

    let resize = '100%'

    if (width < size.width || height < size.height) {
      if (width > height) {
        resize = parseInt(100 * parseFloat(size.width / width)) + '%'
      } else {
        resize = parseInt(100 * parseFloat(size.height / height)) + '%'
      }
    } else {
      if (width > height) {
        resize = parseInt(100 / parseFloat(width / size.width)) + '%'
      } else {
        resize = parseInt(100 / parseFloat(height / size.height)) + '%'
      }
    }

    const progress = 'progress: '+ parseInt((i + 1) * (100 / inputFiles.length)) + '%'

    try {
      execSync(`convert "${path.join(output, file)}" -resize ${resize} "${path.join(output, file)}"`)
      console.log('RESIZE image to: ' + resize, progress)
      execSync(`convert -size ${size.width}x${size.height} xc:transparent "${path.join(output, file)}" -gravity center -composite "${path.join(output, file)}"`)
      console.log('CREATE transparent background to: ' + file, progress)
    } catch (e) {
      console.log('ERROR resize and create transparent background for: ' + file, progress)
    }
  })

})({
  input: process.argv[2],
  output: process.argv[3]
})
.then(() => {
  console.log('ok')
})
.catch((e) => {
  console.error(e)
})
