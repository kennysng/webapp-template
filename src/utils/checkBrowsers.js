const browserslist = require('browserslist')
const chalk = require('chalk')
const fs = require('fs')
const inquirer = require('inquirer')
const os = require('os')
const pkgUp = require('pkg-up')

module.exports = defaultBrowsers => function checkBrowsers (dir, retry = true) {
  const current = browserslist.findConfig(dir)
  if (current != null) {
    return Promise.resolve(current)
  }

  if (!retry) {
    return Promise.reject(
      new Error(
        chalk.red(
          'As of react-scripts >=2 you must specify targeted browsers.'
        ) +
          os.EOL +
          `Please add a ${chalk.underline(
            'browserslist'
          )} key to your ${chalk.bold('package.json')}.`
      )
    )
  }

  const question = {
    type: 'confirm',
    name: 'shouldSetBrowsers',
    message:
      chalk.yellow("We're unable to detect target browsers.") +
      `\n\nWould you like to add the defaults to your ${chalk.bold(
        'package.json'
      )}?`,
    default: true
  }
  return inquirer.prompt(question).then(answer => {
    if (answer.shouldSetBrowsers) {
      return (
        pkgUp(dir)
          .then(filePath => {
            if (filePath == null) {
              return Promise.reject(new Error('package.json file not found'))
            }
            const pkg = JSON.parse(fs.readFileSync(filePath))
            pkg['browserslist'] = defaultBrowsers
            fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + os.EOL)

            browserslist.clearCaches()
            console.log()
            console.log(chalk.green('Set target browsers:'))
            console.log()
            console.log(
              `\t${chalk.bold('Production')}: ${chalk.cyan(
                defaultBrowsers.production.join(', ')
              )}`
            )
            console.log(
              `\t${chalk.bold('Development')}: ${chalk.cyan(
                defaultBrowsers.development.join(', ')
              )}`
            )
            console.log()
          })
          // Swallow any error
          .catch(() => {})
          .then(() => checkBrowsers(dir, false))
      )
    } else {
      return checkBrowsers(dir, false)
    }
  })
}