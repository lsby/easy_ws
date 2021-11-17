import 'mocha'
import { 创建服务器, 连接服务器 } from '../src/index'

describe('测试组', function () {
    it('测试1', async function () {
        var 客户端id = null

        var 服务器 = await 创建服务器({ 端口: 3000 })
        服务器.客户端连接时((data: { 客户端id; 连接 }) => {
            console.log('有客户端连接啦:', data.客户端id)
            客户端id = data.客户端id
        })
        服务器.客户端发来消息时((data) => console.log('客户端发来了消息', data))
        服务器.客户端断开时((客户端id) => console.log('客户端已断开', 客户端id))

        var 客户端 = await 连接服务器({ 地址: '127.0.0.1', 端口: 3000 })
        客户端.连接建立时(() => console.log('已与服务器建立连接'))
        客户端.服务器发来消息时((data) => console.log('服务器发来了消息:', data))

        console.log('客户端连接, 超时测试')
        await 客户端.同步监听连接建立(1).catch((e) => console.log('ok'))

        console.log('客户端连接')
        await 客户端.同步监听连接建立()
        console.log('ok')

        console.log('客户端发消息')
        await 客户端.发送消息({ 消息: '客户端->服务器' })
        console.log('ok')

        console.log('服务器发消息')
        await 服务器.发送消息(服务器.客户端列表[0].客户端id, { 消息: '服务器->客户端' })
        console.log('ok')

        console.log('服务器发消息, 客户端同步监听')
        setTimeout(() => {
            服务器.发送消息(客户端id, { 消息: '服务器->客户端' })
        }, 1000)
        var r1 = await 客户端.同步监听()
        console.log(r1)
        console.log('ok')

        console.log('客户端发消息, 服务器同步监听')
        setTimeout(() => {
            客户端.发送消息({ 消息: '客户端->服务器' })
        }, 1000)
        var r2 = await 服务器.同步监听(客户端id)
        console.log(r2)
        console.log('ok')

        console.log('服务器发消息, 客户端同步监听, 超时测试')
        await 客户端.同步监听(200).catch((e) => console.log('ok'))

        console.log('客户端发消息, 服务器同步监听, 超时测试')
        await 服务器.同步监听(客户端id, 200).catch((e) => console.log('ok'))

        客户端.关闭连接()

        setTimeout(function () {
            process.exit(0)
        }, 1000)
    })
})
