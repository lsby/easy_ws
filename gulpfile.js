var { watch } = require('gulp')
var path = require('path')
var exec = require('@lsby/exec_cmd').default
var opn = require('better-opn')

exports.编译ts = async function 编译ts() {
    process.stdout.write('编译ts...')
    await exec(
        `node ${path.resolve(__dirname, './node_modules/typescript/bin/tsc')} -p ${path.resolve(
            __dirname,
            './tsconfig.json',
        )}`,
        { cwd: path.resolve(__dirname, '.') },
    )
    console.log('ok')
}
exports.持续编译ts = async function 持续编译ts() {
    process.stdout.write('持续编译ts...')
    watch('src/**/*.ts', { ignoreInitial: false }, exports.编译ts)
    console.log('ok')
}
exports.测试并生成覆盖率报告 = async function 测试并生成覆盖率报告() {
    await exports.编译ts()

    process.stdout.write('测试并生成覆盖率报告...')
    var r = await exec(
        `node ${path.resolve(
            __dirname,
            './node_modules/nyc/bin/nyc.js',
        )} --reporter=html --reporter=text-summary ${path.resolve(
            __dirname,
            './node_modules/ts-mocha/bin/ts-mocha',
        )} --timeout 99999999 --colors --bail test/**/*.test.ts`,
        { cwd: path.resolve(__dirname, '.') },
    )
    opn(path.resolve(__dirname, './coverage/index.html'))

    console.log('ok')
    console.log('测试信息:\n', r.join('\n'))
    console.log('已在浏览器中打开覆盖率报告')
}
exports.测试 = async function 测试() {
    await exports.编译ts()

    process.stdout.write('测试...')
    var r = await exec(
        `node ${path.resolve(
            __dirname,
            './node_modules/ts-mocha/bin/ts-mocha',
        )} --timeout 99999999 --colors --bail test/**/*.test.ts`,
        { cwd: path.resolve(__dirname, '.') },
    )

    console.log('ok')
    console.log('测试信息:\n', r.join('\n'))
}
exports.清理一切 = async function 清理一切() {
    process.stdout.write('清理一切...')
    await exec(`rm -rf ./dist`, { cwd: path.resolve(__dirname, '.') })
    await exec(`rm -rf ./node_modules`, { cwd: path.resolve(__dirname, '.') })
    await exec(`rm -rf ./.nyc_output`, { cwd: path.resolve(__dirname, '.') })
    await exec(`rm -rf ./coverage`, { cwd: path.resolve(__dirname, '.') })
    console.log('ok')
}
exports.发布到npm = async function 发布到npm() {
    await exports.测试()

    process.stdout.write('发布到npm...')
    var r = await exec(`npm publish --access=public`, { cwd: path.resolve(__dirname, '.') })

    console.log('ok')
    console.log('发布信息:\n', r.join('\n'))
}
