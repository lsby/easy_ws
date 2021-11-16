import 'mocha'
import lib from '../src/index'
import * as tools from '@lsby/js_tools'

describe('测试组', function () {
    it('测试1', async function () {
        tools.断言相等(lib(1, 2), 3)
    })
})
