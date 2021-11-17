import ws, { WebSocket, Server } from 'ws'
import * as uuid from 'uuid'

export async function 创建服务器<服务器发来的消息 extends object, 发给服务器的消息 extends object>(opt: {
    端口: number
}) {
    var server = new Server({ port: opt.端口 })
    var 客户端列表: { 客户端id: string; 连接: ws }[] = []
    var cb_客户端连接时: ((data: { 客户端id: string; 连接: ws }) => void) | null = null
    var cb_客户端断开时: ((客户端id: string) => void) | null = null
    var cb_客户端发来消息时: ((data: { 客户端id: string; data: 服务器发来的消息 }) => void) | null = null
    var cb_同步监听: ((data: { 客户端id: string; data: 服务器发来的消息 }) => void) | null = null

    server.on('connection', (ws) => {
        var 客户端id = uuid.v4()
        客户端列表.push({ 客户端id, 连接: ws })
        ws.on('close', () => {
            客户端列表 = 客户端列表.filter((a) => a.客户端id != 客户端id)
            if (cb_客户端断开时) cb_客户端断开时(客户端id)
        })
        ws.on('message', (data: Buffer) => {
            var 转换过的消息: 服务器发来的消息 = JSON.parse(data.toString())
            if (cb_同步监听) cb_同步监听({ 客户端id, data: 转换过的消息 })
            if (cb_客户端发来消息时) cb_客户端发来消息时({ 客户端id, data: 转换过的消息 })
        })
        if (cb_客户端连接时) cb_客户端连接时({ 客户端id, 连接: ws })
    })

    var r = {
        _server: server,
        客户端列表,
        客户端连接时(cb: (data: { 客户端id: string; 连接: ws }) => void) {
            cb_客户端连接时 = cb
        },
        客户端断开时(cb: (客户端id: string) => void) {
            cb_客户端断开时 = cb
        },
        客户端发来消息时(cb: (data: { 客户端id: string; data: 服务器发来的消息 }) => void) {
            cb_客户端发来消息时 = cb
        },
        同步监听(客户端id: string, 超时时间: number = 5000): Promise<{ 客户端id: string; data: 服务器发来的消息 }> {
            return new Promise((res, rej) => {
                var 定时器 = setTimeout(() => {
                    rej('超时')
                }, 超时时间)
                cb_同步监听 = (data) => {
                    if (data.客户端id != 客户端id) return
                    clearTimeout(定时器)
                    cb_同步监听 = null
                    res(data)
                }
            })
        },
        发送消息(客户端id: string, 消息: 发给服务器的消息) {
            return new Promise((res, rej) => {
                var ws = r._获得客户端(客户端id)
                var 转换过的消息 = JSON.stringify(消息)
                ws.send(转换过的消息, (err) => (err ? rej(err) : res(null)))
            })
        },
        _获得客户端(客户端id: string) {
            var 筛选 = 客户端列表.filter((a) => a.客户端id == 客户端id)
            if (筛选.length == 0) throw '客户端不存在: ' + 客户端id
            return 筛选[0].连接
        },
    }
    return r
}

export async function 连接服务器<服务器发来的消息 extends object, 发给服务器的消息 extends object>(opt: {
    地址: string
    端口: number
}) {
    var ws = new WebSocket(`ws://${opt.地址}:${opt.端口}`)
    var cb_连接建立时: (() => void) | null = null
    var cb_服务器发来消息时: ((data: 服务器发来的消息) => void) | null = null
    var cb_同步监听连接建立: (() => void) | null = null
    var cb_同步监听: ((data: 服务器发来的消息) => void) | null = null

    ws.on('open', () => {
        if (cb_同步监听连接建立) cb_同步监听连接建立()
        if (cb_连接建立时) cb_连接建立时()
    })
    ws.on('message', (data: Buffer) => {
        var 转换过的消息: 服务器发来的消息 = JSON.parse(data.toString())
        if (cb_同步监听) cb_同步监听(转换过的消息)
        if (cb_服务器发来消息时) cb_服务器发来消息时(转换过的消息)
    })

    return {
        _ws: ws,
        连接建立时(cb: () => void) {
            cb_连接建立时 = cb
        },
        服务器发来消息时(cb: (data: 服务器发来的消息) => void) {
            cb_服务器发来消息时 = cb
        },
        同步监听连接建立(超时时间: number = 5000): Promise<null> {
            return new Promise((res, rej) => {
                var 定时器 = setTimeout(() => {
                    rej('超时')
                }, 超时时间)
                cb_同步监听连接建立 = () => {
                    clearTimeout(定时器)
                    cb_同步监听连接建立 = null
                    res(null)
                }
            })
        },
        同步监听(超时时间: number = 5000): Promise<服务器发来的消息> {
            return new Promise((res, rej) => {
                var 定时器 = setTimeout(() => {
                    rej('超时')
                }, 超时时间)
                cb_同步监听 = (data) => {
                    clearTimeout(定时器)
                    cb_同步监听 = null
                    res(data)
                }
            })
        },
        发送消息(data: 发给服务器的消息) {
            return new Promise((res, rej) => {
                ws.send(JSON.stringify(data), (err) => (err ? rej(err) : res(null)))
            })
        },
        关闭连接: () => {
            ws.close()
        },
    }
}
